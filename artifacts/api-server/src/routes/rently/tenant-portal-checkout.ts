import { Router, type IRouter } from "express";
import {
  CreateRentlyTenantPortalCheckoutBody,
  CreateRentlyTenantPortalCheckoutResponse,
} from "@workspace/api-zod";
import {
  createRentlyTenantCheckout,
  confirmRentlyTenantCheckoutSession,
  getRentlyCheckoutReturnUrl,
  RentlyStripeCheckoutError,
} from "../../lib/rently-stripe-payments";

const checkoutWindowMs = 15 * 60 * 1000;
const checkoutLimit = 5;
const checkoutAttempts = new Map<string, { count: number; expiresAt: number }>();

function takeCheckoutAttempt(ip: string, now = Date.now()) {
  let attempt = checkoutAttempts.get(ip);
  if (!attempt || attempt.expiresAt <= now) {
    attempt = { count: 0, expiresAt: now + checkoutWindowMs };
    checkoutAttempts.set(ip, attempt);
  }
  if (attempt.count >= checkoutLimit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((attempt.expiresAt - now) / 1000)),
    };
  }
  attempt.count += 1;
  if (checkoutAttempts.size > 5000) {
    for (const [key, value] of checkoutAttempts) {
      if (value.expiresAt <= now) checkoutAttempts.delete(key);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export type TenantPortalCheckoutService = {
  createCheckout(email: string, phone: string): Promise<string>;
  confirmCheckout(sessionId: string): Promise<boolean>;
  getReturnUrl(status: "success" | "pending" | "cancelled"): string;
};

const defaultService: TenantPortalCheckoutService = {
  createCheckout: createRentlyTenantCheckout,
  confirmCheckout: confirmRentlyTenantCheckoutSession,
  getReturnUrl: getRentlyCheckoutReturnUrl,
};

export function createTenantPortalCheckoutRouter(
  service: TenantPortalCheckoutService = defaultService,
): IRouter {
  const router: IRouter = Router();

  router.post("/rently/tenant-portal/checkout", async (req, res): Promise<void> => {
    const attempt = takeCheckoutAttempt(req.ip || req.socket.remoteAddress || "unknown");
    if (!attempt.allowed) {
      res.setHeader("Retry-After", String(attempt.retryAfterSeconds));
      res.status(429).json({ error: "Too many checkout attempts. Try again later." });
      return;
    }

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    const parsed = CreateRentlyTenantPortalCheckoutBody.safeParse({
      email: typeof body.email === "string" ? body.email.trim() : body.email,
      phone: typeof body.phone === "string" ? body.phone.trim() : body.phone,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address and phone number." });
      return;
    }
    const phoneDigits = parsed.data.phone.replace(/\D/g, "");
    if (phoneDigits.length < 6 || phoneDigits.length > 15) {
      res.status(400).json({ error: "Enter a valid email address and phone number." });
      return;
    }

    try {
      const checkoutUrl = await service.createCheckout(
        parsed.data.email.trim().toLowerCase(),
        parsed.data.phone.trim(),
      );
      const response = CreateRentlyTenantPortalCheckoutResponse.safeParse({ checkoutUrl });
      if (!response.success) {
        req.log.error("Stripe checkout returned an invalid response");
        res.status(500).json({ error: "Checkout could not be started." });
        return;
      }
      res.json(response.data);
    } catch (error) {
      if (error instanceof RentlyStripeCheckoutError && error.code === "not_found") {
        res.status(404).json({ error: "No outstanding rent payment matched those details." });
        return;
      }
      if (error instanceof RentlyStripeCheckoutError && error.code === "already_paid") {
        res.status(409).json({ error: "This rent payment has already been paid." });
        return;
      }
      req.log.error(
        { errorName: error instanceof Error ? error.name : "unknown" },
        "Tenant rent checkout could not be started",
      );
      res.status(503).json({ error: "Test checkout is temporarily unavailable." });
    }
  });

  router.get("/rently/tenant-portal/checkout/success", async (req, res): Promise<void> => {
    const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
    let status: "success" | "pending" | "cancelled" = "cancelled";
    if (sessionId.startsWith("cs_test_") && sessionId.length <= 255) {
      try {
        status = await service.confirmCheckout(sessionId) ? "success" : "pending";
      } catch (error) {
        req.log.error(
          { errorName: error instanceof Error ? error.name : "unknown" },
          "Tenant rent checkout confirmation failed",
        );
        status = "pending";
      }
    }

    try {
      res.redirect(303, service.getReturnUrl(status));
    } catch {
      res.status(503).send("Rently checkout confirmation is unavailable.");
    }
  });

  return router;
}

export default createTenantPortalCheckoutRouter();
