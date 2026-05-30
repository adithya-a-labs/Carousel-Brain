import { Router, type IRouter } from "express";
import analyticsRouter from "./analytics";
import healthRouter from "./health";
import extractionsRouter from "./extractions";
import organizationRouter from "./organization";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyticsRouter);
router.use(extractionsRouter);
router.use(organizationRouter);
router.use(storageRouter);

export default router;
