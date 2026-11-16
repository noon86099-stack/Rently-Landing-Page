import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

let stripeClientReady = false;

function connectionError(reason: string): Error {
  const error = new Error("Stripe connection is unavailable.");
  error.name = reason;
  return error;
}

export function markStripeClientReady() {
  stripeClientReady = true;
}

export function isStripeClientReady() {
  return stripeClientReady;
}

export function usesManualStripeApiKey() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

async function getStripeCredentials(): Promise<{
  secretKey: string;
  webhookSecret?: string;
  source: "manual" | "connector";
}> {
  const manualSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (manualSecretKey) {
    if (!manualSecretKey.startsWith("sk_test_") && !manualSecretKey.startsWith("rk_test_")) {
      throw connectionError("StripeTestModeRequired");
    }
    return {
      secretKey: manualSecretKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      source: "manual",
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !token) {
    throw connectionError("StripeRuntimeConfigurationMissing");
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: token },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw connectionError(`StripeConnectionHttp${response.status}`);
  }

  const data = await response.json() as {
    items?: Array<{ settings?: { secret_key?: string; secret?: string; webhook_secret?: string } }>;
  };
  const settings = data.items?.[0]?.settings;
  const secretKey = settings?.secret_key ?? settings?.secret;
  if (!secretKey) {
    throw connectionError("StripeConnectionKeyMissing");
  }
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
    throw connectionError("StripeTestModeRequired");
  }

  return { secretKey, webhookSecret: settings?.webhook_secret, source: "connector" };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe's managed data sync.");
  }
  const { secretKey, webhookSecret, source } = await getStripeCredentials();
  if (source === "manual") {
    throw connectionError("StripeManagedWebhookRequiresConnector");
  }
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}
