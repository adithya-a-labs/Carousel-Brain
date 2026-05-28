import { logger } from "../lib/logger";
import { normalizeGroqExtraction } from "./ai-normalizer";
import {
  saveAiRawExtractionResult,
  saveNormalizedAiExtractionPayload,
  setExtractionAiStatus,
} from "./ai-results";
import { GroqProviderError, runGroqStructuredExtraction } from "./groq-provider";
import { cleanOcrText, cleanSlideTexts } from "./ocr-cleaner";
import { listOcrResults } from "./ocr-results";

export type AiPipelineResult = {
  extractionId: string;
  aiStatus: "complete";
  contentType: string;
  title: string;
  summaryPreview: string;
  normalized: true;
  blockCount: number;
};

export async function runAiExtractionPipeline(input: {
  extractionId: string;
  extraction: {
    metadata: Record<string, unknown>;
    [key: string]: unknown;
  };
}): Promise<AiPipelineResult> {
  const { extractionId, extraction } = input;
  const rawOcrText = typeof extraction.metadata.ocrText === "string" ? extraction.metadata.ocrText.trim() : "";
  const ocrText = cleanOcrText(rawOcrText);

  if (!ocrText) {
    throw new GroqProviderError("AI_OCR_TEXT_MISSING", "This extraction does not have OCR text to structure.", {
      extractionId,
    });
  }

  logger.info(
    {
      event: "ai_orchestration_start",
      extractionId,
      ocrTextLength: ocrText.length,
    },
    "Starting AI orchestration",
  );

  await setExtractionAiStatus(extractionId, "processing");

  const ocrResults = await listOcrResults(extractionId);
  const slideTexts = cleanSlideTexts(
    ocrResults
      .filter((result) => result.raw_text.trim())
      .map((result) => ({
        slideIndex: result.slide_index,
        text: result.raw_text,
      })),
  );

  logger.info(
    {
      event: "ai_extraction_service_start",
      extractionId,
      slideCount: slideTexts.length,
    },
    "Starting Groq extraction service",
  );

  const result = await runGroqStructuredExtraction({
    extractionId,
    ocrText,
    slideTexts,
    metadata: extraction.metadata,
  });

  await saveAiRawExtractionResult(extractionId, result, "processing");

  logger.info(
    {
      event: "normalization_start",
      extractionId,
      contentType: result.rawOutput.contentType,
      model: result.model,
    },
    "Starting AI output normalization",
  );

  const normalizedPayload = normalizeGroqExtraction({
    extractionId,
    rawOutput: result.rawOutput,
    ocrText,
    slideTexts,
    existingPayload: extraction,
    sourceAiModel: result.model,
    sourceAiProvider: result.provider,
  });

  await saveNormalizedAiExtractionPayload(extractionId, result, normalizedPayload);

  logger.info(
    {
      event: "normalization_complete",
      extractionId,
      contentType: normalizedPayload.contentType,
      blockCount: normalizedPayload.blocks.length,
    },
    "AI output normalization completed",
  );

  logger.info(
    {
      event: "ai_orchestration_complete",
      extractionId,
      aiStatus: "complete",
      contentType: normalizedPayload.contentType,
      title: normalizedPayload.title,
      model: result.model,
      blockCount: normalizedPayload.blocks.length,
    },
    "AI orchestration completed",
  );

  return {
    extractionId,
    aiStatus: "complete",
    contentType: normalizedPayload.contentType,
    title: normalizedPayload.title,
    summaryPreview: normalizedPayload.summary.slice(0, 500),
    normalized: true,
    blockCount: normalizedPayload.blocks.length,
  };
}
