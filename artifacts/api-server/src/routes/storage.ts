import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { createSignedStorageUrls } from "../services/storage";

const router: IRouter = Router();

router.post("/storage/signed-urls", async (req, res) => {
  const paths = Array.isArray(req.body?.paths) ? req.body.paths : [];

  if (!paths.every((path: unknown) => typeof path === "string")) {
    res.status(400).json({
      error: {
        code: "INVALID_STORAGE_PATHS",
        message: "paths must be an array of storage path strings.",
      },
    });
    return;
  }

  try {
    const urls = await createSignedStorageUrls(paths);
    res.json({ data: urls });
  } catch (error) {
    logger.warn(
      {
        event: "storage_signed_urls_request_failed",
        pathCount: paths.length,
        message: error instanceof Error ? error.message : "Unknown storage URL error",
      },
      "Storage signed URL request failed",
    );
    res.status(500).json({
      error: {
        code: "STORAGE_URLS_FAILED",
        message: "Could not prepare source slide images.",
      },
    });
  }
});

export default router;
