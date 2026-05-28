import { logger } from "../lib/logger";
import { buildStructuredExtractionPrompt } from "./extraction-prompt";

export type RawGroqExtractionJson = {
  contentType:
    | "roadmap"
    | "resources"
    | "opportunities"
    | "tutorial"
    | "playbook"
    | "conceptual"
    | "system"
    | "unknown";
  contentTypeReason?: string;
  title: string;
  summary: string;
  confidence: number;
  keyInsights: Array<GroundedTextItem | string>;
  actionSteps: Array<GroundedTextItem | string>;
  concepts: Array<{
    name: string;
    explanation: string;
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
  resources: Array<{
    title: string;
    type?: "repo" | "website" | "tool" | "course" | "program" | "prompt" | "unknown" | string;
    url?: string | null;
    reason?: string | null;
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
    linkStatus?: "explicit" | "incomplete" | "missing" | "uncertain";
  }>;
  opportunities?: Array<{
    title: string;
    organization?: string | null;
    deadline?: string | null;
    location?: string | null;
    stipend?: string | null;
    duration?: string | null;
    focus?: string | null;
    applyUrl?: string | null;
    notes?: string | null;
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
  promptTemplates?: Array<{
    title: string;
    purpose?: string | null;
    promptText: string;
    variables?: string[];
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
  learningPath: Array<{
    step: string;
    description: string;
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
  notes: string[];
  extractionWarnings?: string[];
};

type GroundedTextItem = {
  text: string;
  sourceSlideIndex?: number | null;
  evidenceText?: string | null;
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
    "opportunities",
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
    contentTypeReason: typeof record.contentTypeReason === "string" ? record.contentTypeReason : undefined,
    title: typeof record.title === "string" ? record.title : "Untitled extraction",
    summary: typeof record.summary === "string" ? record.summary : "",
    confidence,
    keyInsights: groundedTextArray(record.keyInsights),
    actionSteps: groundedTextArray(record.actionSteps),
    concepts: Array.isArray(record.concepts)
      ? record.concepts.map((item) => {
          const concept = asRecord(item) ?? {};
          return {
            name: typeof concept.name === "string" ? concept.name : "",
            explanation: typeof concept.explanation === "string" ? concept.explanation : "",
            sourceSlideIndex: nullableNumber(concept.sourceSlideIndex),
            evidenceText: nullableString(concept.evidenceText ?? concept.sourceSnippet),
          };
        }).filter((item) => item.name || item.explanation)
      : [],
    resources: Array.isArray(record.resources)
      ? record.resources.map((item) => {
          const resource = asRecord(item) ?? {};
          return {
            title: typeof resource.title === "string" ? resource.title : "",
            url: nullableString(resource.url),
            type: typeof resource.type === "string" ? resource.type : undefined,
            reason: nullableString(resource.reason ?? resource.useCase),
            sourceSlideIndex: nullableNumber(resource.sourceSlideIndex),
            evidenceText: nullableString(resource.evidenceText ?? resource.sourceSnippet),
            linkStatus: parseLinkStatus(resource.linkStatus),
          };
        }).filter((item) => item.title || item.url)
      : [],
    opportunities: Array.isArray(record.opportunities)
      ? record.opportunities.map((item) => {
          const opportunity = asRecord(item) ?? {};
          return {
            title: typeof opportunity.title === "string" ? opportunity.title : "",
            organization: nullableString(opportunity.organization),
            deadline: nullableString(opportunity.deadline),
            location: nullableString(opportunity.location),
            stipend: nullableString(opportunity.stipend),
            duration: nullableString(opportunity.duration),
            focus: nullableString(opportunity.focus),
            applyUrl: nullableString(opportunity.applyUrl),
            notes: nullableString(opportunity.notes),
            sourceSlideIndex: nullableNumber(opportunity.sourceSlideIndex),
            evidenceText: nullableString(opportunity.evidenceText ?? opportunity.sourceSnippet),
          };
        }).filter((item) => item.title || item.organization || item.focus)
      : [],
    promptTemplates: Array.isArray(record.promptTemplates)
      ? record.promptTemplates.map((item) => {
          const prompt = asRecord(item) ?? {};
          return {
            title: typeof prompt.title === "string" ? prompt.title : "",
            purpose: nullableString(prompt.purpose),
            promptText: typeof prompt.promptText === "string" ? prompt.promptText : "",
            variables: stringArray(prompt.variables),
            sourceSlideIndex: nullableNumber(prompt.sourceSlideIndex),
            evidenceText: nullableString(prompt.evidenceText ?? prompt.sourceSnippet),
          };
        }).filter((item) => item.title || item.promptText)
      : [],
    learningPath: Array.isArray(record.learningPath)
      ? record.learningPath.map((item) => {
          const pathStep = asRecord(item) ?? {};
          return {
            step: typeof pathStep.step === "string" ? pathStep.step : "",
            description: typeof pathStep.description === "string" ? pathStep.description : "",
            sourceSlideIndex: nullableNumber(pathStep.sourceSlideIndex),
            evidenceText: nullableString(pathStep.evidenceText ?? pathStep.sourceSnippet),
          };
        }).filter((item) => item.step || item.description)
      : [],
    notes: stringArray(record.notes),
    extractionWarnings: stringArray(record.extractionWarnings),
  };
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function nullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseLinkStatus(value: unknown): "explicit" | "incomplete" | "missing" | "uncertain" | undefined {
  return value === "explicit" || value === "incomplete" || value === "missing" || value === "uncertain"
    ? value
    : undefined;
}

function groundedTextArray(value: unknown): Array<GroundedTextItem | string> {
  if (!Array.isArray(value)) return [];

  const items: Array<GroundedTextItem | string> = [];

  for (const item of value) {
    if (typeof item === "string") {
      items.push(item);
      continue;
    }

    const record = asRecord(item);
    if (!record) continue;

    const text = typeof record.text === "string" ? record.text : "";
    if (!text) continue;

    items.push({
      text,
      sourceSlideIndex: nullableNumber(record.sourceSlideIndex),
      evidenceText: nullableString(record.evidenceText ?? record.sourceSnippet),
    });
  }

  return items;
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
      max_tokens: 1600,
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
  const rawOutput = enforceSourceGroundedLinks(parseJsonContent(content), input.ocrText);

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

function enforceSourceGroundedLinks(output: RawGroqExtractionJson, ocrText: string): RawGroqExtractionJson {
  const normalizedOcr = normalizeLinkText(ocrText);
  const warnings = [...(output.extractionWarnings ?? [])];

  const sanitize = (value: string | null | undefined, context: string) => {
    if (!value) return value;

    const trimmed = value.trim();
    const withoutProtocol = trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/$/i, "");
    const normalizedWithoutProtocol = normalizeLinkText(withoutProtocol);
    const normalizedOriginal = normalizeLinkText(trimmed);
    const isProtocolAdded = /^https?:\/\//i.test(trimmed);
    const githubRepoPath = withoutProtocol.match(/^github\.com\/(.+)$/i)?.[1];

    if (normalizedOcr.includes(normalizedOriginal)) {
      return trimmed;
    }

    if (normalizedOcr.includes(normalizedWithoutProtocol)) {
      return isProtocolAdded ? withoutProtocol : trimmed;
    }

    if (githubRepoPath && normalizeRepoPathVisible(githubRepoPath, normalizedOcr)) {
      warnings.push(`Removed inferred GitHub URL for ${context}; OCR showed a repository name but not a full URL.`);
      return null;
    }

    warnings.push(`Removed ungrounded URL for ${context}.`);
    return null;
  };

  output.resources = output.resources.map((resource) => {
    const url = sanitize(resource.url, resource.title || "resource");
    return {
      ...resource,
      url,
      linkStatus: url ? resource.linkStatus ?? "explicit" : resource.linkStatus === "incomplete" ? "incomplete" : "missing",
    };
  });

  output.opportunities = output.opportunities?.map((opportunity) => ({
    ...opportunity,
    applyUrl: sanitize(opportunity.applyUrl, opportunity.title || "opportunity"),
  }));

  output.extractionWarnings = warnings;
  return output;
}

function normalizeLinkText(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//g, "")
    .replace(/^www\./g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/[),.;\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRepoPathVisible(repoPath: string, normalizedOcr: string) {
  const normalizedRepoPath = normalizeLinkText(repoPath);
  return normalizedOcr.includes(normalizedRepoPath);
}
