import type Stripe from "stripe";
import { createHash } from "node:crypto";
import {
  getRentlyCheckoutUrls,
  getRentlyPublicBaseUrl,
  hasCurrentRentlyCheckoutUrls,
} from "./rently-checkout-urls";
import {
  clearExpiredRentlyStripeCheckoutSession,
  findRentlyTenantPortalCheckoutPayment,
  getRentlyStripePaymentReference,
  recordRentlyStripePayment,
  saveRentlyStripeCheckoutSession,
} from "./rently-tenant-portal-db";
import { getUncachableStripeClient, isStripeClientReady } from "./stripeClient";

export class RentlyStripeCheckoutError extends Error {
  constructor(readonly code: "not_found" | "already_paid" | "unavailable") {
    super(code);
    this.name = "RentlyStripeCheckoutError";
  }
}

function getRentlyBaseUrl() {
  return getRentlyPublicBaseUrl();
}

function amountInCents(amount: number) {
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0 || Math.abs(amount * 100 - cents) > 0.001) {
    throw new RentlyStripeCheckoutError("unavailable");
  }
  return cents;
}

async function getRentProduct(stripe: Stripe) {
  const existing = await stripe.products.search({
    query: "metadata['rently_catalog']:'rent_payment' AND active:'true'",
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];

  return stripe.products.create(
    {
      name: "Rently Rent Payment",
      description: "Rent payment recorded through Rently.",
      metadata: { rently_catalog: "rent_payment" },
    },
    { idempotencyKey: "rently-rent-payment-product-v1" },
  );
}

async function getRentPrice(stripe: Stripe, cents: number) {
  const lookupKey = `rently-rent-usd-${cents}`;
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];

  const product = await getRentProduct(stripe);
  return stripe.prices.create(
    {
      product: product.id,
      unit_amount: cents,
      currency: "usd",
      lookup_key: lookupKey,
      metadata: { rently_payment_type: "rent" },
    },
    { idempotencyKey: `${lookupKey}-v1` },
  );
}

export async function createRentlyTenantCheckout(email: string, phone: string): Promise<string> {
  try {
    if (!isStripeClientReady()) throw new RentlyStripeCheckoutError("unavailable");
    const payment = await findRentlyTenantPortalCheckoutPayment(email, phone);
    if (!payment) throw new RentlyStripeCheckoutError("not_found");
    if (payment.paidAt) throw new RentlyStripeCheckoutError("already_paid");

    const stripe = await getUncachableStripeClient();
    const checkoutUrls = getRentlyCheckoutUrls();
    if (payment.checkoutSessionId) {
      const previous = await stripe.checkout.sessions.retrieve(payment.checkoutSessionId);
      if (previous.payment_status === "paid") {
        if (!(await confirmRentlyTenantCheckout(previous))) {
          throw new RentlyStripeCheckoutError("unavailable");
        }
        throw new RentlyStripeCheckoutError("already_paid");
      }
      if (previous.status === "open" && previous.url) {
        if (hasCurrentRentlyCheckoutUrls(previous, checkoutUrls)) return previous.url;
        // Stripe cannot change an existing session's return URLs. Replace only
        // unpaid, open sessions that would return the tenant to an old origin.
        await stripe.checkout.sessions.expire(previous.id);
        previous.status = "expired";
      }
      if (previous.status !== "expired") {
        throw new RentlyStripeCheckoutError("unavailable");
      }
      await clearExpiredRentlyStripeCheckoutSession(payment.id, previous.id);
    }

    const cents = amountInCents(payment.amount);
    const price = await getRentPrice(stripe, cents);
    const checkoutRevision = createHash("sha256")
      .update(JSON.stringify([checkoutUrls, payment.checkoutSessionId]))
      .digest("hex")
      .slice(0, 16);
    const metadata = {
      rently_payment_id: payment.id,
      rently_owner_id: payment.ownerId,
    };
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: payment.id,
        metadata,
        payment_intent_data: { metadata },
        ...checkoutUrls,
      },
      { idempotencyKey: `rently-checkout-${payment.id}-${new Date().toISOString().slice(0, 10)}-${checkoutRevision}` },
    );

    if (!session.url) throw new RentlyStripeCheckoutError("unavailable");
    const stored = await saveRentlyStripeCheckoutSession(payment.id, session.id);
    if (!stored) {
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      }
      throw new RentlyStripeCheckoutError("unavailable");
    }
    return session.url;
  } catch (error) {
    if (error instanceof RentlyStripeCheckoutError) throw error;
    throw new RentlyStripeCheckoutError("unavailable");
  }
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") return session.payment_intent;
  return session.payment_intent?.id ?? null;
}

async function confirmRentlyTenantCheckout(session: Stripe.Checkout.Session): Promise<boolean> {
  if (
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.currency !== "usd" ||
    !session.amount_total ||
    !session.metadata?.rently_payment_id ||
    !session.metadata.rently_owner_id
  ) {
    return false;
  }

  const payment = await getRentlyStripePaymentReference(session.metadata.rently_payment_id);
  if (
    !payment ||
    payment.ownerId !== session.metadata.rently_owner_id ||
    payment.checkoutSessionId !== session.id ||
    amountInCents(payment.amount) !== session.amount_total
  ) {
    return false;
  }

  return recordRentlyStripePayment({
    paymentId: payment.id,
    sessionId: session.id,
    paymentIntentId: paymentIntentId(session),
    amountCents: session.amount_total,
    currency: session.currency,
  });
}

export async function confirmRentlyTenantCheckoutSession(sessionId: string): Promise<boolean> {
  if (!isStripeClientReady()) return false;
  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return confirmRentlyTenantCheckout(session);
}

export function getRentlyCheckoutReturnUrl(payment: "success" | "pending" | "cancelled") {
  return `${getRentlyBaseUrl()}/tenant-portal?payment=${payment}`;
}
