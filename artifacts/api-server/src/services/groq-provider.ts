import { logger } from "../lib/logger";
import { buildStructuredExtractionPrompt } from "./extraction-prompt";

export type RawGroqExtractionJson = {
  contentType: "roadmap" | "resources" | "tutorial" | "playbook" | "conceptual" | "system" | "unknown";
  title: string;
  summary: string;
  confidence: number;
  keyInsights: string[];
  actionSteps: string[];
  concepts: Array<{
    name: string;
    explanation: string;
  }>;
  resources: Array<{
    title: string;
    url?: string;
    type?: string;
  }>;
  learningPath: Array<{
    step: string;
    description: string;
  }>;
  notes: string[];
};

export type RawGroqExtractionResult = {
  rawOutput: RawGroqExtractionJson;
  provider: "groq";
  model: string;
  generatedAt: string;
  providerMetadata: {
    responseId?: string;
    finishReason?: string;
    usage?: unknown;
  };
};

export class GroqProviderError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "GroqProviderError";
    this.code = code;
    this.details = details;
  }
}

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    throw new GroqProviderError("GROQ_PROVIDER_NOT_CONFIGURED", "Groq is not configured.");
  }

  return { apiKey, model };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseJsonContent(content: string): RawGroqExtractionJson {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new GroqProviderError("GROQ_EMPTY_RESPONSE", "Groq returned an empty response.");
  }

  try {
    return normalizeRawOutput(JSON.parse(trimmed));
  } catch (error) {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return normalizeRawOutput(JSON.parse(jsonMatch[0]));
      } catch {
        // Fall through to the structured parse error below.
      }
    }

    throw new GroqProviderError("GROQ_INVALID_JSON", "Groq returned invalid JSON.", {
      responsePreview: trimmed.slice(0, 1200),
      parserMessage: error instanceof Error ? error.message : undefined,
    });
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeRawOutput(value: unknown): RawGroqExtractionJson {
  const record = asRecord(value);

  if (!record) {
    throw new GroqProviderError("GROQ_INVALID_JSON_SHAPE", "Groq JSON response was not an object.");
  }

  const allowedContentTypes = new Set([
    "roadmap",
    "resources",
    "tutorial",
    "playbook",
    "conceptual",
    "system",
    "unknown",
  ]);
  const contentType = typeof record.contentType === "string" && allowedContentTypes.has(record.contentType)
    ? record.contentType
    : "unknown";
  const confidence =
    typeof record.confidence === "number" && Number.isFinite(record.confidence)
      ? Math.max(0, Math.min(1, record.confidence))
      : 0;

  return {
    contentType: contentType as RawGroqExtractionJson["contentType"],
    title: typeof record.title === "string" ? record.title : "Untitled extraction",
    summary: typeof record.summary === "string" ? record.summary : "",
    confidence,
    keyInsights: stringArray(record.keyInsights),
    actionSteps: stringArray(record.actionSteps),
    concepts: Array.isArray(record.concepts)
      ? record.concepts.map((item) => {
          const concept = asRecord(item) ?? {};
          return {
            name: typeof concept.name === "string" ? concept.name : "",
            explanation: typeof concept.explanation === "string" ? concept.explanation : "",
          };
        }).filter((item) => item.name || item.explanation)
      : [],
    resources: Array.isArray(record.resources)
      ? record.resources.map((item) => {
          const resource = asRecord(item) ?? {};
          return {
            title: typeof resource.title === "string" ? resource.title : "",
            url: typeof resource.url === "string" ? resource.url : undefined,
            type: typeof resource.type === "string" ? resource.type : undefined,
          };
        }).filter((item) => item.title || item.url)
      : [],
    learningPath: Array.isArray(record.learningPath)
      ? record.learningPath.map((item) => {
          const pathStep = asRecord(item) ?? {};
          return {
            step: typeof pathStep.step === "string" ? pathStep.step : "",
            description: typeof pathStep.description === "string" ? pathStep.description : "",
          };
        }).filter((item) => item.step || item.description)
      : [],
    notes: stringArray(record.notes),
  };
}

export async function runGroqStructuredExtraction(input: {
  extractionId: string;
  ocrText: string;
  slideTexts?: Array<{ slideIndex: number; text: string }>;
  metadata?: Record<string, unknown>;
}): Promise<RawGroqExtractionResult> {
  const { apiKey, model } = getGroqConfig();
  const messages = buildStructuredExtractionPrompt(input);

  logger.info(
    {
      event: "groq_structured_extraction_start",
      extractionId: input.extractionId,
      model,
      ocrTextLength: input.ocrText.length,
      slideCount: input.slideTexts?.length ?? 0,
    },
    "Starting Groq structured extraction",
  );

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    }),
  });
  const responseText = await response.text();

  logger.info(
    {
      event: "groq_structured_extraction_response",
      extractionId: input.extractionId,
      model,
      status: response.status,
      ok: response.ok,
      responsePreview: responseText.slice(0, 1200),
    },
    "Finished Groq structured extraction request",
  );

  if (!response.ok) {
    throw new GroqProviderError("GROQ_REQUEST_FAILED", `Groq request failed (${response.status}).`, {
      status: response.status,
      responsePreview: responseText.slice(0, 1200),
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new GroqProviderError("GROQ_RESPONSE_BAD_JSON", "Groq API returned malformed JSON.", {
      responsePreview: responseText.slice(0, 1200),
    });
  }

  const payloadRecord = asRecord(payload);
  const choices = Array.isArray(payloadRecord?.choices) ? payloadRecord.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);
  const content = typeof message?.content === "string" ? message.content : "";
  const rawOutput = parseJsonContent(content);

  logger.info(
    {
      event: "groq_structured_extraction_complete",
      extractionId: input.extractionId,
      model,
      contentType: rawOutput.contentType,
      title: rawOutput.title,
    },
    "Groq structured extraction completed",
  );

  return {
    rawOutput,
    provider: "groq",
    model,
    generatedAt: new Date().toISOString(),
    providerMetadata: {
      responseId: typeof payloadRecord?.id === "string" ? payloadRecord.id : undefined,
      finishReason: typeof firstChoice?.finish_reason === "string" ? firstChoice.finish_reason : undefined,
      usage: payloadRecord?.usage,
    },
  };
}
