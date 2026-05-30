import { Router, type IRouter } from "express";
import {
  getFounderAnalytics,
  isAdminAnalyticsEnabled,
  isValidAdminSecret,
  recordAnalyticsEvent,
} from "../services/analytics";

const router: IRouter = Router();

router.post("/analytics/events", async (req, res) => {
  try {
    const eventType = typeof req.body?.eventType === "string" ? req.body.eventType : "";
    await recordAnalyticsEvent({
      eventType,
      userId: typeof req.body?.userId === "string" ? req.body.userId : undefined,
      extractionId: typeof req.body?.extractionId === "string" ? req.body.extractionId : undefined,
      metadata: req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {},
    });
    res.status(202).json({ data: { accepted: true } });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "ANALYTICS_EVENT_FAILED",
        message: error instanceof Error ? error.message : "Could not record analytics event.",
      },
    });
  }
});

router.get("/admin/analytics", async (req, res) => {
  if (!isAdminAnalyticsEnabled()) {
    res.status(404).json({
      error: {
        code: "ADMIN_ANALYTICS_DISABLED",
        message: "Admin analytics are not enabled.",
      },
    });
    return;
  }

  if (!isValidAdminSecret(req.headers["x-admin-analytics-secret"])) {
    res.status(403).json({
      error: {
        code: "ADMIN_ANALYTICS_FORBIDDEN",
        message: "Admin analytics access denied.",
      },
    });
    return;
  }

  try {
    res.json({ data: await getFounderAnalytics() });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "ADMIN_ANALYTICS_LOAD_FAILED",
        message: error instanceof Error ? error.message : "Could not load founder analytics.",
      },
    });
  }
});

export default router;
