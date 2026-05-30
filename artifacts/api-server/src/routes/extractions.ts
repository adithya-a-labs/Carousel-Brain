import { Router, type IRouter, type Response } from "express";
import {
  createMockExtraction,
  getAllExtractions,
  getExtractionById,
} from "../data/extractions";
import { logger } from "../lib/logger";
import { parseMultipart } from "../lib/multipart";
import {
  getInstagramProviderDiagnostics,
  InstagramProviderError,
  validateInstagramUrl,
} from "../services/instagram-provider";
import { OcrProviderError, runOcrForImage } from "../services/ocr-provider";
import {
  saveOcrResult,
  setExtractionOcrStatus,
  updateExtractionOcrSummary,
} from "../services/ocr-results";
import { createSignedStorageUrls } from "../services/storage";
import { setExtractionAiStatus } from "../services/ai-results";
import { runAiExtractionPipeline } from "../services/ai-pipeline";
import { GroqProviderError } from "../services/groq-provider";
import { recordAnalyticsEvent } from "../services/analytics";

const router: IRouter = Router();

function badRequest(
  res: Response,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  res.status(400).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

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

router.post("/extractions/:id/ocr", async (req, res) => {
  const extractionId = req.params.id;
  const extraction = await getExtractionById(extractionId);

  if (!extraction) {
    res.status(404).json({
      error: {
        code: "EXTRACTION_NOT_FOUND",
        message: `No extraction found for id "${extractionId}".`,
      },
    });
    return;
  }

  const storagePaths = extraction.metadata.storagePaths ?? [];

  if (storagePaths.length === 0) {
    badRequest(res, "OCR_NO_SOURCE_IMAGES", "This extraction does not have source slide images to OCR.", {
      extractionId,
    });
    return;
  }

  logger.info(
    {
      event: "ocr_pipeline_start",
      extractionId,
      slideCount: storagePaths.length,
    },
    "Starting extraction OCR pipeline",
  );

  const successfulTexts: string[] = [];
  const slideErrors: Array<{ slideIndex: number; code: string; message: string }> = [];

  try {
    await setExtractionOcrStatus(extractionId, "processing");
    const signedUrls = await createSignedStorageUrls(storagePaths);
    const urlByPath = new Map(signedUrls.map((item) => [item.path, item.url]));

    for (const [index, storagePath] of storagePaths.entries()) {
      const slideIndex = index + 1;
      const imageUrl = urlByPath.get(storagePath);

      if (!imageUrl) {
        slideErrors.push({
          slideIndex,
          code: "OCR_IMAGE_URL_MISSING",
          message: "Could not create a signed URL for this source image.",
        });
        continue;
      }

      try {
        const result = await runOcrForImage({ imageUrl, slideIndex });
        await saveOcrResult(extractionId, slideIndex, storagePath, result);
        successfulTexts.push(result.rawText);
      } catch (error) {
        const code = error instanceof OcrProviderError ? error.code : "OCR_SLIDE_FAILED";
        const message = error instanceof Error ? error.message : "OCR failed for this slide.";
        slideErrors.push({ slideIndex, code, message });
        logger.warn(
          {
            event: "ocr_slide_failed",
            extractionId,
            slideIndex,
            storagePath,
            code,
            message,
            details: error instanceof OcrProviderError ? error.details : undefined,
          },
          "OCR failed for slide",
        );
      }
    }

    const summary = await updateExtractionOcrSummary(extractionId);

    if (summary.ocrStatus === "failed") {
      await setExtractionOcrStatus(extractionId, "failed");
    }

    logger.info(
      {
        event: "ocr_pipeline_complete",
        extractionId,
        ocrStatus: summary.ocrStatus,
        successfulSlideCount: successfulTexts.length,
        failedSlideCount: slideErrors.length,
      },
      "Extraction OCR pipeline completed",
    );

    let aiResult:
      | {
          aiStatus: "complete";
          contentType: string;
          title: string;
          summaryPreview: string;
          normalized: true;
          blockCount: number;
        }
      | undefined;
    let aiError:
      | {
          code: string;
          message: string;
        }
      | undefined;

    if (summary.ocrStatus === "complete") {
      try {
        const latestExtraction = await getExtractionById(extractionId);
        if (!latestExtraction) {
          throw new Error("Extraction disappeared before AI orchestration could start.");
        }

        aiResult = await runAiExtractionPipeline({
          extractionId,
          extraction: latestExtraction as { metadata: Record<string, unknown>; [key: string]: unknown },
        });
        await recordAnalyticsEvent({
          eventType: "extraction_completed",
          extractionId,
          metadata: {
            ocrStatus: summary.ocrStatus,
            aiStatus: aiResult.aiStatus,
            contentType: aiResult.contentType,
            slideCount: storagePaths.length,
            blockCount: aiResult.blockCount,
          },
        });
      } catch (error) {
        await setExtractionAiStatus(extractionId, "failed").catch(() => undefined);
        const code = error instanceof GroqProviderError ? error.code : "AI_ORCHESTRATION_FAILED";
        const message = error instanceof Error ? error.message : "AI orchestration failed.";
        aiError = { code, message };

        logger.warn(
          {
            event: "ai_orchestration_failed_after_ocr",
            extractionId,
            code,
            message,
            details: error instanceof GroqProviderError ? error.details : undefined,
          },
          "AI orchestration failed after OCR completion",
        );
      }
    }

    res.json({
      data: {
        extractionId,
        ocrStatus: summary.ocrStatus,
        slideCount: storagePaths.length,
        combinedTextPreview: summary.ocrText.slice(0, 500),
        failedSlideCount: slideErrors.length,
        slideErrors,
        aiStatus: aiResult?.aiStatus ?? (aiError ? "failed" : "pending"),
        ai: aiResult,
        aiError,
      },
    });
  } catch (error) {
    await setExtractionOcrStatus(extractionId, successfulTexts.length > 0 ? "complete" : "failed").catch(() => undefined);
    logger.warn(
      {
        event: "ocr_pipeline_failed",
        extractionId,
        successfulSlideCount: successfulTexts.length,
        message: error instanceof Error ? error.message : "Unknown OCR pipeline failure",
      },
      "Extraction OCR pipeline failed",
    );
    res.status(400).json({
      error: {
        code: error instanceof OcrProviderError ? error.code : "OCR_PIPELINE_FAILED",
        message: error instanceof Error ? error.message : "OCR pipeline failed.",
      },
    });
  }
});

router.post("/extractions/:id/ai/extract", async (req, res) => {
  const extractionId = req.params.id;
  const extraction = await getExtractionById(extractionId);

  if (!extraction) {
    res.status(404).json({
      error: {
        code: "EXTRACTION_NOT_FOUND",
        message: `No extraction found for id "${extractionId}".`,
      },
    });
    return;
  }

  try {
    const result = await runAiExtractionPipeline({
      extractionId,
      extraction: extraction as { metadata: Record<string, unknown>; [key: string]: unknown },
    });

    res.json({ data: result });
  } catch (error) {
    await setExtractionAiStatus(extractionId, "failed").catch(() => undefined);
    const code = error instanceof GroqProviderError ? error.code : "AI_EXTRACTION_FAILED";
    const message = error instanceof Error ? error.message : "AI structured extraction failed.";

    logger.warn(
      {
        event: "ai_extraction_failed",
        extractionId,
        code,
        message,
        details: error instanceof GroqProviderError ? error.details : undefined,
      },
      "AI structured extraction failed",
    );

    res.status(400).json({
      error: {
        code,
        message,
        ...(error instanceof GroqProviderError && error.details ? { details: error.details } : {}),
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
    let normalizedInstagramUrl: string | undefined;

    logger.info(
      {
        event: "extraction_create_received",
        sourceType,
        instagramUrl,
        isMultipart: Boolean(multipart),
        uploadedFileCount: Array.isArray(uploadedFiles) ? uploadedFiles.length : undefined,
        ...getInstagramProviderDiagnostics(),
      },
      "Received extraction creation request",
    );

    if (sourceType !== "upload" && sourceType !== "instagram") {
      logger.warn(
        {
          event: "extraction_create_bad_request",
          code: "INVALID_EXTRACTION_SOURCE",
          reason: "source_type_not_supported",
          sourceType,
        },
        "Rejecting extraction request before 400 response",
      );
      badRequest(res, "INVALID_EXTRACTION_SOURCE", 'sourceType must be either "upload" or "instagram".', {
        receivedSourceType: sourceType,
      });
      return;
    }

    if (sourceType === "instagram") {
      try {
        normalizedInstagramUrl = validateInstagramUrl(instagramUrl ?? "");
        logger.info(
          {
            event: "instagram_validation_success",
            sourceType,
            instagramUrl,
            normalizedInstagramUrl,
            ...getInstagramProviderDiagnostics(),
          },
          "Instagram URL validation succeeded",
        );
      } catch (error) {
        const details =
          error instanceof InstagramProviderError
            ? error.details
            : { branch: "unknown_validation_error", instagramUrl };
        logger.warn(
          {
            event: "extraction_create_bad_request",
            code: "INVALID_INSTAGRAM_URL",
            reason: "instagram_validation_failed",
            sourceType,
            instagramUrl,
            details,
            ...getInstagramProviderDiagnostics(),
          },
          "Rejecting Instagram extraction before 400 response",
        );
        badRequest(res, "INVALID_INSTAGRAM_URL", "The Instagram URL format is not supported.", details);
        return;
      }
    }

    const job = await createMockExtraction({
      sourceType,
      instagramUrl: normalizedInstagramUrl ?? instagramUrl,
      uploadedFiles,
    });

    logger.info(
      {
        event: "extraction_create_success",
        sourceType,
        id: job.id,
        status: job.extraction.metadata.status,
        slideCount: job.extraction.metadata.slideCount,
        storagePathCount: job.extraction.metadata.storagePaths?.length ?? 0,
        normalizedInstagramUrl,
      },
      "Extraction creation completed",
    );
    await recordAnalyticsEvent({
      eventType: "extraction_created",
      extractionId: job.id,
      metadata: {
        sourceType,
        status: job.extraction.metadata.status,
        slideCount: job.extraction.metadata.slideCount,
        storagePathCount: job.extraction.metadata.storagePaths?.length ?? 0,
      },
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
    if (error instanceof InstagramProviderError) {
      logger.warn(
        {
          event: "extraction_create_bad_request",
          code: error.code,
          reason: "instagram_provider_failed",
          message: error.message,
          details: error.details,
          ...getInstagramProviderDiagnostics(),
        },
        "Rejecting Instagram extraction before 400 response",
      );
      badRequest(res, error.code, error.message, error.details);
      return;
    }

    logger.warn(
      {
        event: "extraction_create_bad_request",
        code: "EXTRACTION_CREATE_FAILED",
        reason: "extraction_creation_failed",
        message: error instanceof Error ? error.message : "Unknown extraction creation error",
      },
      "Rejecting extraction before 400 response",
    );
    badRequest(
      res,
      "EXTRACTION_CREATE_FAILED",
      error instanceof Error ? error.message : "Could not create extraction.",
    );
  }
});

export default router;
