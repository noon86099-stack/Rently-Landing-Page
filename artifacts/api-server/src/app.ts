import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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
