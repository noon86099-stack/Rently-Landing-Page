import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync, getUncachableStripeClient, markStripeSyncReady } from "./lib/stripeClient";
import { startRentlyStripeReconciliation } from "./lib/rently-stripe-reconciliation";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initializeStripe() {
  let stage = "database_configuration";
  try {
    const expectedAccountId = process.env.RENTLY_STRIPE_ACCOUNT_ID;
    if (!expectedAccountId) {
      logger.warn("Stripe checkout is paused until the Rently test account is confirmed.");
      return;
    }

    stage = "stripe_credentials";
    const stripe = await getUncachableStripeClient();
    stage = "stripe_account_retrieve";
    const account = await stripe.accounts.retrieve(null);
    stage = "stripe_account_binding";
    if (account.id !== expectedAccountId) {
      logger.error(
        {
          expectedAccountSuffix: expectedAccountId.slice(-4),
          connectedAccountSuffix: account.id.slice(-4),
        },
        "Connected Stripe account does not match the selected test account",
      );
      throw new Error("The connected Stripe account does not match the confirmed Rently account.");
    }

    stage = "database_configuration";
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for Stripe's managed data sync.");
    }

    stage = "stripe_sync_migrations";
    await runMigrations({ databaseUrl });

    stage = "stripe_connection";
    const stripeSync = await getStripeSync();

    stage = "managed_webhook";
    const configuredDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
    if (!configuredDomain) {
      throw new Error("REPLIT_DOMAINS is required to configure Stripe's test webhook.");
    }
    const webhookBaseUrl = configuredDomain.startsWith("http")
      ? configuredDomain
      : `https://${configuredDomain}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);

    stage = "stripe_backfill";
    await stripeSync.syncBackfill({ object: "all" });
    markStripeSyncReady();
    startRentlyStripeReconciliation();
  } catch (error) {
    logger.error(
      { stage, errorName: error instanceof Error ? error.name : "unknown" },
      "Stripe initialization step failed",
    );
    throw error;
  }
}

async function startServer() {
  await initializeStripe().catch(() => undefined);
  app.listen(port, (err) => {
    if (err) {
      logger.error({ errorName: err instanceof Error ? err.name : "unknown" }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

void startServer().catch((error: unknown) => {
  logger.error(
    { errorName: error instanceof Error ? error.name : "unknown" },
    "API server startup failed",
  );
  process.exit(1);
});
