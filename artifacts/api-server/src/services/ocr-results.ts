import { logger } from "../lib/logger";
import { getSupabaseConfig, supabaseErrorMessage, supabaseHeaders } from "../lib/supabase";
import type { OcrSlideResult } from "./ocr-provider";

export type OcrStatus = "pending" | "processing" | "complete" | "failed";

type StoredOcrResult = {
  id?: string;
  extraction_id: string;
  slide_index: number;
  storage_path: string;
  raw_text: string;
  confidence: number | null;
  provider_response: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

const memoryOcrResults = new Map<string, StoredOcrResult[]>();
const memoryOcrSummaries = new Map<
  string,
  { ocr_text: string; ocr_status: OcrStatus; ocr_confidence: number | null }
>();

function toRecord(extractionId: string, slideIndex: number, storagePath: string, result: OcrSlideResult): StoredOcrResult {
  return {
    extraction_id: extractionId,
    slide_index: slideIndex,
    storage_path: storagePath,
    raw_text: result.rawText,
    confidence: result.confidence ?? null,
    provider_response: result.providerResponse,
  };
}

export async function saveOcrResult(
  extractionId: string,
  slideIndex: number,
  storagePath: string,
  result: OcrSlideResult,
) {
  const config = getSupabaseConfig();
  const record = toRecord(extractionId, slideIndex, storagePath, result);

  if (!config) {
    const existing = memoryOcrResults.get(extractionId) ?? [];
    const next = existing.filter((item) => item.slide_index !== slideIndex).concat(record);
    memoryOcrResults.set(extractionId, next);
    return record;
  }

  const response = await fetch(
    `${config.url}/rest/v1/extraction_ocr_results?on_conflict=extraction_id,slide_index`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(config, "application/json"),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(record),
    },
  );

  if (!response.ok) {
    const message = await supabaseErrorMessage(response, "Failed to persist OCR result");
    logger.warn(
      {
        event: "ocr_result_save_failed",
        extractionId,
        slideIndex,
        status: response.status,
        message,
      },
      "OCR result persistence failed",
    );
    throw new Error(message);
  }

  const [saved] = (await response.json()) as StoredOcrResult[];
  return saved ?? record;
}

export async function listOcrResults(extractionId: string) {
  const config = getSupabaseConfig();

  if (!config) {
    return (memoryOcrResults.get(extractionId) ?? []).sort((a, b) => a.slide_index - b.slide_index);
  }

  const response = await fetch(
    `${config.url}/rest/v1/extraction_ocr_results?extraction_id=eq.${encodeURIComponent(
      extractionId,
    )}&select=*&order=slide_index.asc`,
    {
      headers: supabaseHeaders(config),
    },
  );

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to list OCR results"));
  }

  return (await response.json()) as StoredOcrResult[];
}

export async function setExtractionOcrStatus(extractionId: string, status: OcrStatus) {
  const config = getSupabaseConfig();

  if (!config) {
    const previous = memoryOcrSummaries.get(extractionId);
    memoryOcrSummaries.set(extractionId, {
      ocr_text: previous?.ocr_text ?? "",
      ocr_confidence: previous?.ocr_confidence ?? null,
      ocr_status: status,
    });
    return;
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(extractionId)}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ocr_status: status,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to update extraction OCR status"));
  }
}

export async function updateExtractionOcrSummary(extractionId: string) {
  const results = await listOcrResults(extractionId);
  const orderedResults = results
    .filter((result) => result.raw_text.trim())
    .sort((a, b) => a.slide_index - b.slide_index);
  const combinedText = orderedResults
    .map((result) => `Slide ${result.slide_index}\n${result.raw_text.trim()}`)
    .join("\n\n");
  const confidences = orderedResults
    .map((result) => result.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number" && Number.isFinite(confidence));
  const averageConfidence =
    confidences.length > 0
      ? confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length
      : null;
  const status: OcrStatus = combinedText ? "complete" : "failed";
  const config = getSupabaseConfig();

  if (!config) {
    memoryOcrSummaries.set(extractionId, {
      ocr_text: combinedText,
      ocr_status: status,
      ocr_confidence: averageConfidence,
    });
    return {
      ocrText: combinedText,
      ocrStatus: status,
      ocrConfidence: averageConfidence,
    };
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(extractionId)}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ocr_text: combinedText,
      ocr_status: status,
      ocr_confidence: averageConfidence,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to update extraction OCR summary"));
  }

  logger.info(
    {
      event: "ocr_summary_updated",
      extractionId,
      ocrStatus: status,
      slideResultCount: orderedResults.length,
      confidence: averageConfidence,
      textLength: combinedText.length,
    },
    "Extraction OCR summary updated",
  );

  return {
    ocrText: combinedText,
    ocrStatus: status,
    ocrConfidence: averageConfidence,
  };
}
