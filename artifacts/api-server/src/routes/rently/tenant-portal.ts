import { Router, type IRouter } from "express";
import {
  LookupRentlyTenantPortalBody,
  LookupRentlyTenantPortalResponse,
} from "@workspace/api-zod";
import {
  lookupRentlyTenantPortal,
  TenantPortalDatabaseUnavailable,
  type TenantPortalRow,
} from "../../lib/rently-tenant-portal-db";

const lookupWindowMs = 15 * 60 * 1000;
const lookupLimit = 8;
const lookupAttempts = new Map<string, { count: number; expiresAt: number }>();

function takeLookupAttempt(ip: string, now = Date.now()) {
  let attempt = lookupAttempts.get(ip);
  if (!attempt || attempt.expiresAt <= now) {
    attempt = { count: 0, expiresAt: now + lookupWindowMs };
    lookupAttempts.set(ip, attempt);
  }
  if (attempt.count >= lookupLimit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((attempt.expiresAt - now) / 1000)) };
  }
  attempt.count += 1;

  if (lookupAttempts.size > 5000) {
    for (const [key, value] of lookupAttempts) {
      if (value.expiresAt <= now) lookupAttempts.delete(key);
    }
    while (lookupAttempts.size > 5000) {
      const oldest = lookupAttempts.keys().next().value;
      if (oldest === undefined) break;
      lookupAttempts.delete(oldest);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export type TenantPortalLookup = (email: string, phone: string) => Promise<TenantPortalRow | null>;

export function createTenantPortalRouter(lookup: TenantPortalLookup): IRouter {
  const router: IRouter = Router();
  router.post("/rently/tenant-portal/lookup", async (req, res): Promise<void> => {
    const attempt = takeLookupAttempt(req.ip || req.socket.remoteAddress || "unknown");
    if (!attempt.allowed) {
      res.setHeader("Retry-After", String(attempt.retryAfterSeconds));
      res.status(429).json({ error: "Too many lookup attempts. Try again later." });
      return;
    }

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : {};
    const parsed = LookupRentlyTenantPortalBody.safeParse({
      email: typeof body.email === "string" ? body.email.trim() : body.email,
      phone: typeof body.phone === "string" ? body.phone.trim() : body.phone,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address and phone number." });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const phone = parsed.data.phone.trim();
    const digitCount = phone.replace(/\D/g, "").length;
    if (digitCount < 7 || digitCount > 15) {
      res.status(400).json({ error: "Enter a valid email address and phone number." });
      return;
    }

    let row: TenantPortalRow | null;
    try {
      row = await lookup(email, phone);
    } catch (cause) {
      const code = cause && typeof cause === "object" && "code" in cause
        ? String(cause.code)
        : "lookup_failed";
      const unavailable = cause instanceof TenantPortalDatabaseUnavailable ||
        ["42883", "42P01", "42703", "08000", "08003", "08006"].includes(code);
      req.log.error({ code }, "Tenant portal lookup failed");
      res.status(unavailable ? 503 : 500).json({
        error: unavailable
          ? "Tenant lookup is not available yet."
          : "The tenant details could not be checked.",
      });
      return;
    }

    if (!row) {
      res.status(404).json({ error: "No tenant matched those details." });
      return;
    }

    const rentAmount = typeof row.rent_amount === "number"
      ? row.rent_amount
      : Number(row.rent_amount);
    const response = LookupRentlyTenantPortalResponse.safeParse({
      tenantName: row.tenant_name,
      rentAmount,
      dueDate: row.due_date instanceof Date ? row.due_date.toISOString().slice(0, 10) : row.due_date,
      paymentStatus: row.payment_status,
    });
    if (!response.success) {
      req.log.error("Tenant portal lookup returned invalid data");
      res.status(500).json({ error: "The tenant rent summary could not be loaded." });
      return;
    }
    res.json(response.data);
  });
  return router;
}

const router = createTenantPortalRouter(lookupRentlyTenantPortal);
export default router;
