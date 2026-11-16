import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import Stripe from "stripe";
import {
  processRentlyStripeWebhook,
  RentlyStripeWebhookError,
  type RentlyStripeWebhookDependencies,
} from "../src/lib/rently-stripe-webhook";
import { createRentlyStripeWebhookRouter } from "../src/routes/rently/stripe-webhook";

const stripe = new Stripe("sk_test_webhook_test");
const webhookSecret = "whsec_rently_test";

function signedPayload(event: Record<string, unknown>, secret = webhookSecret) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return { payload: Buffer.from(payload), signature };
}

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_rently_checkout",
    object: "event",
    api_version: "2026-10-28.endive",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "cs_test_rently_payment",
        object: "checkout.session",
        payment_status: "paid",
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "checkout.session.completed",
    ...overrides,
  };
}

function dependencies(
  confirmCheckout: (sessionId: string) => Promise<boolean>,
  secret: string | undefined = webhookSecret,
): RentlyStripeWebhookDependencies {
  return {
    getStripe: async () => stripe,
    confirmCheckout,
    getWebhookSecret: () => secret,
  };
}

test("verified paid test checkout confirms its linked rent record", async () => {
  const calls: string[] = [];
  const { payload, signature } = signedPayload(checkoutEvent());
  const result = await processRentlyStripeWebhook(
    payload,
    signature,
    dependencies(async (sessionId) => {
      calls.push(sessionId);
      return true;
    }),
  );

  assert.equal(result, "confirmed");
  assert.deepEqual(calls, ["cs_test_rently_payment"]);
});

test("unrelated and unpaid Stripe events do not update rent records", async () => {
  let confirmations = 0;
  const deps = dependencies(async () => {
    confirmations += 1;
    return true;
  });
  const unrelated = signedPayload(checkoutEvent({ type: "customer.created" }));
  const unpaid = signedPayload(checkoutEvent({
    data: { object: { id: "cs_test_unpaid", object: "checkout.session", payment_status: "unpaid" } },
  }));

  assert.equal(await processRentlyStripeWebhook(unrelated.payload, unrelated.signature, deps), "ignored");
  assert.equal(await processRentlyStripeWebhook(unpaid.payload, unpaid.signature, deps), "ignored");
  assert.equal(confirmations, 0);
});

test("webhook rejects invalid signatures, live events, and missing secrets", async () => {
  const signed = signedPayload(checkoutEvent());
  await assert.rejects(
    processRentlyStripeWebhook(signed.payload, "t=1,v1=invalid", dependencies(async () => true)),
    (error: unknown) => error instanceof RentlyStripeWebhookError && error.code === "invalid_signature",
  );

  const liveEvent = signedPayload(checkoutEvent({ livemode: true }));
  await assert.rejects(
    processRentlyStripeWebhook(liveEvent.payload, liveEvent.signature, dependencies(async () => true)),
    (error: unknown) => error instanceof RentlyStripeWebhookError && error.code === "invalid_signature",
  );

  await assert.rejects(
    processRentlyStripeWebhook(signed.payload, signed.signature, {
      getStripe: async () => stripe,
      confirmCheckout: async () => true,
      getWebhookSecret: () => undefined,
    }),
    (error: unknown) => error instanceof RentlyStripeWebhookError && error.code === "missing_secret",
  );
});

test("webhook HTTP route preserves the raw body and requires Stripe's signature", async (t) => {
  const requests: Array<{ body: Buffer; signature: string }> = [];
  const app = express();
  app.use(createRentlyStripeWebhookRouter({
    async process(body, signature) {
      requests.push({ body, signature });
      return "confirmed";
    },
  }));

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/rently/stripe/webhook`;
  const body = '{"type":"checkout.session.completed"}';

  const missingSignature = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  assert.equal(missingSignature.status, 400);
  assert.equal(requests.length, 0);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "valid-test-signature",
    },
    body,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(requests.map((request) => ({
    body: request.body.toString(),
    signature: request.signature,
  })), [{ body, signature: "valid-test-signature" }]);
});
