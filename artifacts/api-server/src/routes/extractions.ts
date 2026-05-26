import { Router, type IRouter } from "express";
import {
  createMockExtraction,
  getAllExtractions,
  getExtractionById,
} from "../data/extractions";
import { parseMultipart } from "../lib/multipart";

const router: IRouter = Router();

router.get("/extractions", async (_req, res) => {
  try {
    res.json({ data: await getAllExtractions() });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "EXTRACTIONS_LOAD_FAILED",
        message: error instanceof Error ? error.message : "Could not load extractions.",
      },
    });
  }
});

router.get("/extractions/:id", async (req, res) => {
  try {
    const extraction = await getExtractionById(req.params.id);

    if (!extraction) {
      res.status(404).json({
        error: {
          code: "EXTRACTION_NOT_FOUND",
          message: `No extraction found for id "${req.params.id}".`,
        },
      });
      return;
    }

    res.json({ data: extraction });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "EXTRACTION_LOAD_FAILED",
        message: error instanceof Error ? error.message : "Could not load extraction.",
      },
    });
  }
});

router.post("/extractions", async (req, res) => {
  try {
    const contentType = req.headers["content-type"] ?? "";
    const multipart = contentType.includes("multipart/form-data") ? await parseMultipart(req) : null;
    const sourceType = multipart?.fields.sourceType ?? req.body?.sourceType;
    const instagramUrl = multipart?.fields.instagramUrl ?? req.body?.instagramUrl;
    const uploadedFiles = multipart?.files ?? req.body?.uploadedFiles;

    if (sourceType !== "upload" && sourceType !== "instagram") {
      res.status(400).json({
        error: {
          code: "INVALID_EXTRACTION_SOURCE",
          message: 'sourceType must be either "upload" or "instagram".',
        },
      });
      return;
    }

    if (sourceType === "instagram" && !/instagram\.com\/(p|reel|tv)\//i.test(instagramUrl ?? "")) {
      res.status(400).json({
        error: {
          code: "INVALID_INSTAGRAM_URL",
          message: "Paste a valid Instagram carousel URL.",
        },
      });
      return;
    }

    const job = await createMockExtraction({
      sourceType,
      instagramUrl,
      uploadedFiles,
    });

    res.status(201).json({
      data: {
        id: job.id,
        status: job.status,
        lifecycle: job.lifecycle,
        extraction: job.extraction,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "EXTRACTION_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Could not create extraction.",
      },
    });
  }
});

export default router;
