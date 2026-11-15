import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";

const owner = "11111111-1111-4111-8111-111111111111";
const paymentId = "33333333-3333-4333-8333-333333333333";
const otherPayment = "44444444-4444-4444-8444-444444444444";

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

test("correction API requires auth and confirmation, derives actor from auth, and scopes history", async () => {
  const calls: { path: string; body: Record<string, unknown>; authorization?: string }[] = [];
  let rpcError: string | null = null;
  const upstream = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const url = new URL(req.url!, "http://test");
    calls.push({ path: req.url!, body: body ? JSON.parse(body) : {}, authorization: req.headers.authorization });
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/auth/v1/user") {
      res.end(JSON.stringify({ id: owner, email: "owner@example.invalid", role: "authenticated" }));
    } else if (url.pathname.endsWith("/rpc/correct_rently_payment")) {
      res.statusCode = rpcError ? 400 : 200;
      res.end(JSON.stringify(rpcError ? { code: rpcError, message: "Rejected" } : true));
    } else if (url.pathname.endsWith("/rently_payments")) {
      const data = url.searchParams.get("id") === `eq.${otherPayment}` ? null :
        { id: paymentId, due_date: "2026-01-31", amount: "1500.00", paid_at: "2026-02-02" };
      res.end(JSON.stringify(data));
    } else if (url.pathname.endsWith("/rently_payment_corrections")) {
      res.end(JSON.stringify([{
        id: "55555555-5555-4555-8555-555555555555", payment_id: paymentId,
        previous_paid_at: "2026-02-01", new_paid_at: "2026-02-02",
        reason: "Receipt checked", actor_id: owner, corrected_at: "2026-02-03T10:00:00Z",
      }]));
    } else {
      res.statusCode = 404;
      res.end("{}");
    }
  });
  const upstreamUrl = await listen(upstream);
  // Synthetic local test configuration, not project credentials.
  process.env.SUPABASE_URL = upstreamUrl;
  process.env.SUPABASE_PUBLISHABLE_KEY = "local-test-key";
  const { default: router } = await import("../src/routes/rently/index");
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => {
    Object.assign(_req, { log: { warn() {}, error() {} } });
    next();
  });
  app.use(router);
  const server = createServer(app);
  const base = await listen(server);
  const endpoint = `${base}/rently/payments/${paymentId}/corrections`;
  const input = { paidAt: "2026-02-02", expectedPaidAt: "2026-02-01", reason: " Receipt checked ", confirmed: true };
  async function post(body: unknown, url = endpoint) {
    return fetch(url, {
      method: "POST", headers: { Authorization: "Bearer local-test-token", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  try {
    assert.equal((await fetch(endpoint)).status, 401);
    assert.equal((await fetch(endpoint, { method: "POST" })).status, 401);
    for (const body of [
      { ...input, confirmed: false }, { ...input, confirmed: undefined },
      { ...input, reason: "  " }, { ...input, reason: "x".repeat(1001) },
      { ...input, paidAt: null },
    ]) {
      assert.equal((await post(body)).status, 400);
    }
    assert.equal(calls.filter((call) => call.path.includes("/rpc/")).length, 0);
    assert.equal((await post(input, endpoint.replace(paymentId, "bad-id"))).status, 400);
    const response = await post({ ...input, actorId: otherPayment, ownerId: otherPayment });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: paymentId, dueDate: "2026-01-31", amount: 1500, paidAt: "2026-02-02",
    });
    const rpc = calls.find((call) => call.path.includes("/rpc/"))!;
    assert.deepEqual(rpc.body, {
      p_payment_id: paymentId, p_paid_at: input.paidAt,
      p_expected_paid_at: input.expectedPaidAt, p_reason: "Receipt checked",
    });
    assert.equal(rpc.authorization, "Bearer local-test-token");
    for (const [code, status] of [["P0002", 404], ["23505", 409], ["22023", 400], ["PGRST202", 503]] as const) {
      rpcError = code;
      assert.equal((await post(input)).status, status);
    }
    const headers = { Authorization: "Bearer local-test-token" };
    const history = await fetch(endpoint, { headers });
    assert.equal(history.status, 200);
    const rows = await history.json();
    assert.equal(rows[0].previousPaidAt, "2026-02-01");
    assert.equal(rows[0].newPaidAt, "2026-02-02");
    assert.equal(rows[0].actorId, owner);
    const query = new URL(calls.find((call) => call.path.includes("/rently_payment_corrections"))!.path, base);
    assert.equal(query.searchParams.get("owner_id"), `eq.${owner}`);
    assert.equal(query.searchParams.get("payment_id"), `eq.${paymentId}`);
    const historyCalls = calls.filter((call) => call.path.includes("/rently_payment_corrections")).length;
    assert.equal((await fetch(endpoint.replace(paymentId, otherPayment), { headers })).status, 404);
    assert.equal(calls.filter((call) => call.path.includes("/rently_payment_corrections")).length, historyCalls);
  } finally {
    server.closeAllConnections();
    upstream.closeAllConnections();
    await Promise.all([
      new Promise<void>((resolve) => server.close(() => resolve())),
      new Promise<void>((resolve) => upstream.close(() => resolve())),
    ]);
  }
});
