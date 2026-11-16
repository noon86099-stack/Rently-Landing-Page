import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./lib/webhookHandlers";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const header = req.headers["stripe-signature"];
  const signature = Array.isArray(header) ? header[0] : header;
  if (!signature) {
    res.status(400).json({ error: "Missing Stripe signature." });
    return;
  }
  try {
    await WebhookHandlers.processWebhook(req.body as Buffer, signature);
    res.status(200).json({ received: true });
  } catch (error) {
    req.log.error(
      { errorName: error instanceof Error ? error.name : "unknown" },
      "Stripe webhook processing failed",
    );
    res.status(400).json({ error: "Webhook processing failed." });
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.error(
    { errorName: error instanceof Error ? error.name : "unknown" },
    "API request failed",
  );
  if (res.headersSent) {
    _next(error);
    return;
  }
  const isInvalidJson = error instanceof SyntaxError && "status" in error && error.status === 400;
  res.status(isInvalidJson ? 400 : 500).json({
    error: isInvalidJson ? "Invalid JSON request." : "The request could not be completed.",
  });
});

export default app;
