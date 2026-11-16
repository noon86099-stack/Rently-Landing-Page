import { logger } from "./logger";
import { listUnpaidRentlyStripeSessions } from "./rently-tenant-portal-db";
import { confirmRentlyTenantCheckoutSession } from "./rently-stripe-payments";
import { isStripeSyncReady } from "./stripeClient";

// A tenant can close Stripe's tab before returning to Rently. Reconcile saved
// session references independently of that redirect, without changing webhooks.
export function startRentlyStripeReconciliation() {
  let busy = false;
  let cursor: string | null = null;
  const tick = async () => {
    if (busy || !isStripeSyncReady()) return;
    busy = true;
    try {
      const sessions = await listUnpaidRentlyStripeSessions(cursor);
      for (const session of sessions) {
        try {
          await confirmRentlyTenantCheckoutSession(session.session_id);
        } catch {
          logger.warn("A rent checkout could not be reconciled; it will be retried.");
        }
      }
      cursor = sessions.length === 20 ? sessions[sessions.length - 1]!.id : null;
    } catch {
      logger.warn("Rent payment reconciliation is temporarily unavailable; it will be retried.");
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => void tick(), 30_000);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
