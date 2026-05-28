import { logger } from "../lib/logger";
import { getSupabaseConfig, supabaseErrorMessage, supabaseHeaders } from "../lib/supabase";
import type { CanonicalExtractionPayload } from "./ai-normalizer";
import type { RawGroqExtractionResult } from "./groq-provider";

export type AiStatus = "pending" | "processing" | "complete" | "failed";

const memoryAiSummaries = new Map<
  string,
  {
    ai_status: AiStatus;
    ai_raw_output?: Record<string, unknown>;
    ai_model?: string;
    ai_provider?: string;
    ai_generated_at?: string;
  }
>();

export async function setExtractionAiStatus(extractionId: string, status: AiStatus) {
  const config = getSupabaseConfig();

  if (!config) {
    const previous = memoryAiSummaries.get(extractionId);
    memoryAiSummaries.set(extractionId, {
      ...previous,
      ai_status: status,
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
      ai_status: status,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to update extraction AI status"));
  }
}

export async function saveAiExtractionResult(extractionId: string, result: RawGroqExtractionResult) {
  const config = getSupabaseConfig();
  const record = {
    ai_status: "complete" as const,
    ai_raw_output: result.rawOutput,
    ai_model: result.model,
    ai_provider: result.provider,
    ai_generated_at: result.generatedAt,
    updated_at: new Date().toISOString(),
  };

  if (!config) {
    memoryAiSummaries.set(extractionId, record);
    return record;
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(extractionId)}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const message = await supabaseErrorMessage(response, "Failed to persist AI extraction result");
    logger.warn(
      {
        event: "ai_extraction_result_save_failed",
        extractionId,
        status: response.status,
        message,
      },
      "AI extraction result persistence failed",
    );
    throw new Error(message);
  }

  return record;
}

export async function saveNormalizedAiExtractionPayload(
  extractionId: string,
  result: RawGroqExtractionResult,
  payload: CanonicalExtractionPayload,
) {
  const config = getSupabaseConfig();
  const record = {
    title: payload.title,
    summary: payload.summary,
    content_type: databaseContentType(payload.contentType),
    payload,
    ai_status: "complete" as const,
    ai_raw_output: result.rawOutput,
    ai_model: result.model,
    ai_provider: result.provider,
    ai_generated_at: result.generatedAt,
    updated_at: new Date().toISOString(),
  };

  if (!config) {
    memoryAiSummaries.set(extractionId, {
      ai_status: "complete",
      ai_raw_output: result.rawOutput,
      ai_model: result.model,
      ai_provider: result.provider,
      ai_generated_at: result.generatedAt,
    });
    return record;
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(extractionId)}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const message = await supabaseErrorMessage(response, "Failed to persist normalized AI extraction payload");
    logger.warn(
      {
        event: "ai_normalized_payload_save_failed",
        extractionId,
        status: response.status,
        message,
      },
      "Normalized AI payload persistence failed",
    );
    throw new Error(message);
  }

  return record;
}

function databaseContentType(contentType: string) {
  return contentType === "opportunities" || contentType === "unknown" ? "resources" : contentType;
}
