import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rentlyRouter from "./rently";
import tenantPortalRouter from "./rently/tenant-portal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rentlyRouter);
router.use(tenantPortalRouter);

export default router;
