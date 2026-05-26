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
