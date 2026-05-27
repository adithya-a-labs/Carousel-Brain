import { logger } from "../lib/logger";

export type OcrSlideResult = {
  slideIndex: number;
  rawText: string;
  confidence?: number;
  providerResponse: Record<string, unknown>;
};

export class OcrProviderError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "OcrProviderError";
    this.code = code;
    this.details = details;
  }
}

function getOcrSpaceApiKey() {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new OcrProviderError("OCR_PROVIDER_NOT_CONFIGURED", "OCR.Space is not configured.");
  }

  return apiKey;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseConfidence(parsedResult: Record<string, unknown>) {
  const candidates = [
    parsedResult.MeanConfidence,
    parsedResult.meanConfidence,
    parsedResult.Confidence,
    parsedResult.confidence,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function errorMessageFromPayload(payload: Record<string, unknown>) {
  const errorMessage = payload.ErrorMessage;
  if (typeof errorMessage === "string") return errorMessage;
  if (Array.isArray(errorMessage)) return errorMessage.filter((item) => typeof item === "string").join(" ");
  if (typeof payload.ErrorDetails === "string") return payload.ErrorDetails;
  return "OCR.Space could not process this slide.";
}

export async function runOcrForImage(input: {
  imageUrl: string;
  slideIndex: number;
}): Promise<OcrSlideResult> {
  const apiKey = getOcrSpaceApiKey();
  const formData = new FormData();
  formData.append("url", input.imageUrl);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");

  logger.info(
    {
      event: "ocr_space_request_start",
      slideIndex: input.slideIndex,
      apiKeyExists: true,
    },
    "Starting OCR.Space request",
  );

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: formData,
  });

  const responseText = await response.text();

  logger.info(
    {
      event: "ocr_space_request_end",
      slideIndex: input.slideIndex,
      status: response.status,
      ok: response.ok,
      responsePreview: responseText.slice(0, 1200),
    },
    "Finished OCR.Space request",
  );

  if (!response.ok) {
    throw new OcrProviderError("OCR_PROVIDER_REQUEST_FAILED", `OCR.Space request failed (${response.status}).`, {
      slideIndex: input.slideIndex,
      status: response.status,
      responsePreview: responseText.slice(0, 1200),
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(responseText) as unknown;
  } catch {
    throw new OcrProviderError("OCR_PROVIDER_BAD_JSON", "OCR.Space returned malformed JSON.", {
      slideIndex: input.slideIndex,
      responsePreview: responseText.slice(0, 1200),
    });
  }

  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    throw new OcrProviderError("OCR_PROVIDER_MALFORMED_RESPONSE", "OCR.Space returned an unexpected response.", {
      slideIndex: input.slideIndex,
    });
  }

  if (payloadRecord.IsErroredOnProcessing === true) {
    throw new OcrProviderError("OCR_PROVIDER_PROCESSING_FAILED", errorMessageFromPayload(payloadRecord), {
      slideIndex: input.slideIndex,
      providerResponse: payloadRecord,
    });
  }

  const parsedResults = Array.isArray(payloadRecord.ParsedResults) ? payloadRecord.ParsedResults : [];
  const firstResult = asRecord(parsedResults[0]);

  if (!firstResult) {
    throw new OcrProviderError("OCR_PROVIDER_MALFORMED_RESPONSE", "OCR.Space response did not include ParsedResults.", {
      slideIndex: input.slideIndex,
      providerResponse: payloadRecord,
    });
  }

  const rawText = typeof firstResult.ParsedText === "string" ? firstResult.ParsedText.trim() : "";

  if (!rawText) {
    throw new OcrProviderError("OCR_EMPTY_TEXT", "OCR.Space returned no parsed text for this slide.", {
      slideIndex: input.slideIndex,
      providerResponse: payloadRecord,
    });
  }

  return {
    slideIndex: input.slideIndex,
    rawText,
    confidence: parseConfidence(firstResult),
    providerResponse: payloadRecord,
  };
}
