import { Router, type IRouter } from "express";
import healthRouter from "./health";
import extractionsRouter from "./extractions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(extractionsRouter);

export default router;
