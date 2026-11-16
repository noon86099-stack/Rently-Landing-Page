import type Stripe from "stripe";
import { confirmRentlyTenantCheckoutSession } from "./rently-stripe-payments";
import { getUncachableStripeClient } from "./stripeClient";

export type RentlyStripeWebhookResult = "confirmed" | "ignored" | "unmatched";

export class RentlyStripeWebhookError extends Error {
  constructor(readonly code: "missing_secret" | "invalid_signature" | "invalid_payload") {
    super(code);
    this.name = "RentlyStripeWebhookError";
  }
}

export type RentlyStripeWebhookDependencies = {
  getStripe(): Promise<Stripe>;
  confirmCheckout(sessionId: string): Promise<boolean>;
  getWebhookSecret(): string | undefined;
};

const defaultDependencies: RentlyStripeWebhookDependencies = {
  getStripe: getUncachableStripeClient,
  confirmCheckout: confirmRentlyTenantCheckoutSession,
  getWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET?.trim(),
};

export async function processRentlyStripeWebhook(
  payload: Buffer,
  signature: string,
  dependencies: RentlyStripeWebhookDependencies = defaultDependencies,
): Promise<RentlyStripeWebhookResult> {
  if (!Buffer.isBuffer(payload)) {
    throw new RentlyStripeWebhookError("invalid_payload");
  }

  const secret = dependencies.getWebhookSecret();
  if (!secret) throw new RentlyStripeWebhookError("missing_secret");

  const stripe = await dependencies.getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    throw new RentlyStripeWebhookError("invalid_signature");
  }

  if (event.livemode) throw new RentlyStripeWebhookError("invalid_signature");
  if (event.type !== "checkout.session.completed") return "ignored";

  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.id.startsWith("cs_test_") || session.payment_status !== "paid") {
    return "ignored";
  }

  return (await dependencies.confirmCheckout(session.id)) ? "confirmed" : "unmatched";
}
