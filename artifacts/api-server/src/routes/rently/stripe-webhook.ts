import express, { Router, type IRouter } from "express";
import {
  processRentlyStripeWebhook,
  RentlyStripeWebhookError,
  type RentlyStripeWebhookResult,
} from "../../lib/rently-stripe-webhook";

export type RentlyStripeWebhookService = {
  process(payload: Buffer, signature: string): Promise<RentlyStripeWebhookResult>;
};

const defaultService: RentlyStripeWebhookService = {
  process: processRentlyStripeWebhook,
};

export function createRentlyStripeWebhookRouter(
  service: RentlyStripeWebhookService = defaultService,
): IRouter {
  const router: IRouter = Router();

  router.post(
    "/rently/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res): Promise<void> => {
      const header = req.headers["stripe-signature"];
      const signature = Array.isArray(header) ? header[0] : header;
      if (!signature) {
        res.status(400).json({ error: "Missing Stripe signature." });
        return;
      }

      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Invalid Stripe webhook payload." });
        return;
      }

      try {
        const result = await service.process(req.body, signature);
        if (result === "unmatched") {
          req.log.warn("A paid Stripe session did not match an outstanding Rently rent payment.");
        }
        res.status(200).json({ received: true });
      } catch (error) {
        if (error instanceof RentlyStripeWebhookError) {
          const status = error.code === "missing_secret" ? 503 : 400;
          res.status(status).json({ error: "Stripe webhook could not be verified." });
          return;
        }
        req.log.error(
          { errorName: error instanceof Error ? error.name : "unknown" },
          "Rently Stripe webhook processing failed",
        );
        res.status(500).json({ error: "Stripe webhook processing failed." });
      }
    },
  );

  return router;
}

export default createRentlyStripeWebhookRouter();
