import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rentlyRouter from "./rently";
import tenantPortalRouter from "./rently/tenant-portal";
import tenantPortalCheckoutRouter from "./rently/tenant-portal-checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rentlyRouter);
router.use(tenantPortalRouter);
router.use(tenantPortalCheckoutRouter);

export default router;
