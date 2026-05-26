import { Router, type IRouter } from "express";
import {
  createMockExtraction,
  getAllExtractions,
  getExtractionById,
} from "../data/extractions";

const router: IRouter = Router();

router.get("/extractions", (_req, res) => {
  res.json({ data: getAllExtractions() });
});

router.get("/extractions/:id", (req, res) => {
  const extraction = getExtractionById(req.params.id);

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
});

router.post("/extractions", (req, res) => {
  const { sourceType, instagramUrl, uploadedFiles } = req.body ?? {};

  if (sourceType !== "upload" && sourceType !== "instagram") {
    res.status(400).json({
      error: {
        code: "INVALID_EXTRACTION_SOURCE",
        message: 'sourceType must be either "upload" or "instagram".',
      },
    });
    return;
  }

  const job = createMockExtraction({
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
});

export default router;
