import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import {
  createTenantPortalCheckoutRouter,
  type TenantPortalCheckoutService,
} from "../src/routes/rently/tenant-portal-checkout";

test("tenant portal checkout validates contacts and returns a Stripe test URL", async (t) => {
  const calls: Array<{ email: string; phone: string }> = [];
  const service: TenantPortalCheckoutService = {
    async createCheckout(email, phone) {
      calls.push({ email, phone });
      return "https://checkout.stripe.com/c/pay/cs_test_example";
    },
    async confirmCheckout() {
      return true;
    },
    getReturnUrl(status) {
      return `https://rently.example/tenant-portal?payment=${status}`;
    },
  };
  const app = express();
  app.use(express.json());
  app.use(createTenantPortalCheckoutRouter(service));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  const response = await fetch(`${base}/rently/tenant-portal/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "Tenant@Example.com", phone: "89-89-89" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_example",
  });
  assert.deepEqual(calls, [{ email: "tenant@example.com", phone: "89-89-89" }]);

  const invalid = await fetch(`${base}/rently/tenant-portal/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "Tenant@Example.com", phone: "123" }),
  });
  assert.equal(invalid.status, 400);

  const success = await fetch(
    `${base}/rently/tenant-portal/checkout/success?session_id=cs_test_example`,
    { redirect: "manual" },
  );
  assert.equal(success.status, 303);
  assert.equal(success.headers.get("location"), "https://rently.example/tenant-portal?payment=success");
});
