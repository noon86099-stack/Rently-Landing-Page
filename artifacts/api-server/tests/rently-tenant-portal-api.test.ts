import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";
import {
  createTenantPortalRouter,
  type TenantPortalLookup,
} from "../src/routes/rently/tenant-portal";

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

test("public tenant portal validates, returns a minimal summary, and limits attempts", async () => {
  let noMatch = false;
  const lookupCalls: { email: string; phone: string }[] = [];
  const lookup: TenantPortalLookup = async (email, phone) => {
    lookupCalls.push({ email, phone });
    return noMatch ? null : {
      tenant_name: "Portal Tenant",
      rent_amount: "900.00",
      due_date: "2026-11-15",
      payment_status: "overdue",
    };
  };
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use((req, _res, next) => {
    Object.assign(req, { log: { error() {} } });
    next();
  });
  app.use(createTenantPortalRouter(lookup));
  const server = createServer(app);
  const base = await listen(server);
  const post = (body: unknown, ip: string) => fetch(`${base}/rently/tenant-portal/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });

  try {
    assert.equal((await post({ email: "not-email", phone: "15550100001" }, "203.0.113.20")).status, 400);
    assert.equal(lookupCalls.length, 0);

    const response = await post(
      { email: " Tenant@Example.com ", phone: "+1 (555) 010-0001" },
      "203.0.113.21",
    );
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result, {
      tenantName: "Portal Tenant",
      rentAmount: 900,
      dueDate: "2026-11-15",
      paymentStatus: "overdue",
    });
    assert.deepEqual(lookupCalls[0], {
      email: "tenant@example.com",
      phone: "+1 (555) 010-0001",
    });
    assert.deepEqual(Object.keys(result).sort(), ["dueDate", "paymentStatus", "rentAmount", "tenantName"]);

    const shortRegisteredPhone = await post(
      { email: "tenant@example.com", phone: "898989" },
      "203.0.113.24",
    );
    assert.equal(shortRegisteredPhone.status, 200);
    assert.deepEqual(lookupCalls[1], { email: "tenant@example.com", phone: "898989" });

    noMatch = true;
    const missing = await post(
      { email: "tenant@example.com", phone: "15550100002" },
      "203.0.113.22",
    );
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "No tenant matched those details." });

    noMatch = false;
    const rateLimitedIp = "203.0.113.23";
    for (let i = 0; i < 8; i += 1) {
      assert.equal((await post(
        { email: "tenant@example.com", phone: "15550100001" },
        rateLimitedIp,
      )).status, 200);
    }
    const blocked = await post(
      { email: "tenant@example.com", phone: "15550100001" },
      rateLimitedIp,
    );
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
