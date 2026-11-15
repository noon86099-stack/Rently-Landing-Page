import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";

const owner = "11111111-1111-4111-8111-111111111111";
const record = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

test("all setup endpoints forward stable retry keys, load real saved records, and retain legacy callers", async () => {
  const calls: { path: string; method: string; body: Record<string, unknown>; authorization?: string }[] = [];
  let rpcError: string | null = null;
  let loadFailure = false;
  const upstream = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const url = new URL(req.url!, "http://test");
    calls.push({ path: req.url!, method: req.method!, body: body ? JSON.parse(body) : {}, authorization: req.headers.authorization });
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/auth/v1/user") {
      res.end(JSON.stringify({ id:owner,email:"owner@example.invalid",role:"authenticated" }));
    } else if (url.pathname.endsWith("/rpc/create_rently_setup_record") || url.pathname.endsWith("/rpc/create_rently_lease_with_schedule")) {
      res.statusCode = rpcError ? 400 : 200;
      res.end(JSON.stringify(rpcError ? { code:rpcError,message:"Rejected" } : record));
    } else if (loadFailure) {
      res.statusCode = 500;
      res.end(JSON.stringify({ code:"XX000",message:"Simulated response-load failure" }));
    } else if (url.pathname.endsWith("/rently_properties")) {
      res.end(JSON.stringify({ id:record,name:"عقار",property_type:"Apartment",street_address:null,city:null,region:null }));
    } else if (url.pathname.endsWith("/rently_units")) {
      res.end(JSON.stringify({ id:record,property_id:record,unit_label:"شقة 1" }));
    } else if (url.pathname.endsWith("/rently_leases")) {
      res.end(JSON.stringify({
        id:record,unit_id:record,tenant_id:record,start_date:"2028-01-01",end_date:"2028-12-31",
        status:"upcoming",monthly_rent:"1500",due_day:1,
        tenant:{ id:record,full_name:"مستأجر",email:null,phone:null },
        payments:[{ id:record,due_date:"2028-01-01",amount:"1500",paid_at:null }],
      }));
    } else {
      res.statusCode = 404; res.end("{}");
    }
  });
  process.env.SUPABASE_URL = await listen(upstream);
  process.env.SUPABASE_PUBLISHABLE_KEY = "local-test-key";
  const { default: router } = await import("../src/routes/rently/index");
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { Object.assign(req,{ log:{ warn() {},error() {} } }); next(); });
  app.use(router);
  const server = createServer(app);
  const base = await listen(server);
  const inputs = [
    { path:"/rently/properties",kind:"property",data:{ name:"عقار",propertyType:"Apartment" } },
    { path:`/rently/properties/${record}/units`,kind:"unit",data:{ unitLabel:"شقة 1" } },
    { path:"/rently/leases",kind:"lease",data:{ unitId:record,tenantFullName:"مستأجر",
      startDate:"2028-01-01",endDate:"2028-12-31",monthlyRent:1500,dueDay:1 } },
  ];
  const post = (path: string, data: unknown) => fetch(base + path, {
    method:"POST",headers:{ Authorization:"Bearer local-test-token","Content-Type":"application/json" },
    body:JSON.stringify(data),
  });
  try {
    for (const input of inputs) {
      assert.equal((await fetch(base + input.path,{ method:"POST" })).status,401);
      assert.equal((await post(input.path,{ ...input.data,requestId:"bad-uuid" })).status,400);
      const before = calls.length;
      const response = await post(input.path,{ ...input.data,requestId,ownerId:"forged" });
      assert.equal(response.status,201);
      assert.equal((await response.json()).id,record);
      const writes = calls.slice(before).filter(c => c.path.includes("/rpc/"));
      assert.equal(writes.length,1);
      assert.equal(writes[0].authorization,"Bearer local-test-token");
      assert.deepEqual(writes[0].body,{
        p_request_id:requestId,p_kind:input.kind,
        p_payload:input.kind === "unit" ? { ...input.data,propertyId:record } : input.data,
      });
      const loads = calls.slice(before).filter(c => c.method === "GET" && c.path.startsWith("/rest/"));
      assert.ok(loads.every(c => new URL(c.path,base).searchParams.get("id") === `eq.${record}`));
      loadFailure = true;
      assert.equal((await post(input.path,{ ...input.data,requestId })).status,500);
      loadFailure = false;
      // The same stable key must reach the DB on retry after a response load failed.
      assert.equal((await post(input.path,{ ...input.data,requestId })).status,201);
      assert.equal(calls.filter(c => c.path.includes("/rpc/create_rently_setup_record")).at(-1)!.body.p_request_id,requestId);
      rpcError = "PGRST202";
      assert.equal((await post(input.path,{ ...input.data,requestId })).status,503);
      rpcError = null;
      assert.equal((await post(input.path,input.data)).status,201);
    }
  } finally {
    server.closeAllConnections(); upstream.closeAllConnections();
    await Promise.all([
      new Promise<void>(resolve => server.close(() => resolve())),
      new Promise<void>(resolve => upstream.close(() => resolve())),
    ]);
  }
});
