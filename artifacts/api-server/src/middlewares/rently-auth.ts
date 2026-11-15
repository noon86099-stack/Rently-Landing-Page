import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "";

export type RentlyRequestContext = {
  client: ReturnType<typeof createClient>;
  userId: string;
};

export function requireRentlyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    if (!supabaseUrl || !publishableKey) {
      res.status(503).json({ error: "Rently authentication is not configured." });
      return;
    }

    const authorization = req.get("authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1]?.trim();
    if (!accessToken) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const client = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) {
      req.log.warn(
        { code: error?.code ?? "no-user" },
        "Rently API rejected an invalid Supabase session",
      );
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    res.locals.rently = { client, userId: data.user.id } satisfies RentlyRequestContext;
    next();
  })().catch((error: unknown) => {
    req.log.error(
      { errorName: error instanceof Error ? error.name : "unknown" },
      "Rently authentication failed unexpectedly",
    );
    res.status(500).json({ error: "Authentication could not be verified." });
  });
}

export function getRentlyContext(res: Response): RentlyRequestContext {
  const context = res.locals.rently as RentlyRequestContext | undefined;
  if (!context) {
    throw new Error("Rently authentication context is missing.");
  }
  return context;
}
