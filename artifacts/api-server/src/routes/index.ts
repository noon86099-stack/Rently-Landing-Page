import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rentlyRouter from "./rently";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rentlyRouter);

export default router;
