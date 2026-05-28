import type { RawGroqExtractionJson } from "./groq-provider";

type GroundedText = string | {
  text?: string;
  sourceSlideIndex?: number | null;
  evidenceText?: string | null;
};

type CanonicalBlockType =
  | "hero"
  | "summary"
  | "key_insights"
  | "action_checklist"
  | "resource_grid"
  | "opportunity_list"
  | "concept_cards"
  | "learning_path"
  | "prompt_templates"
  | "notes"
  | "warning";

type CanonicalBlock = {
  id: string;
  type: CanonicalBlockType;
  kind: string;
  title: string;
  sourceSlideIndex?: number | null;
  evidenceText?: string | null;
  [key: string]: unknown;
};

export type CanonicalExtractionPayload = {
  id: string;
  version: "v1";
  generatedFrom: "ai_raw_output";
  contentType: string;
  title: string;
  summary: string;
  confidence?: number;
  blocks: CanonicalBlock[];
  warnings?: string[];
  metadata: Record<string, unknown>;
  slides: unknown[];
};

const COLORS = [
  { color: "hsl(248 70% 58%)", bg: "hsl(248 70% 58% / 0.08)", border: "hsl(248 70% 58% / 0.2)" },
  { color: "hsl(200 70% 50%)", bg: "hsl(200 70% 50% / 0.08)", border: "hsl(200 70% 50% / 0.2)" },
  { color: "hsl(150 65% 48%)", bg: "hsl(150 65% 48% / 0.08)", border: "hsl(150 65% 48% / 0.2)" },
  { color: "hsl(30 90% 55%)", bg: "hsl(30 90% 55% / 0.08)", border: "hsl(30 90% 55% / 0.2)" },
  { color: "hsl(340 75% 58%)", bg: "hsl(340 75% 58% / 0.08)", border: "hsl(340 75% 58% / 0.2)" },
];

export function normalizeGroqExtraction(input: {
  extractionId: string;
  rawOutput: RawGroqExtractionJson;
  ocrText?: string;
  slideTexts?: Array<{ slideIndex: number; text: string }>;
  existingPayload?: unknown;
  sourceAiModel?: string;
  sourceAiProvider?: string;
}): CanonicalExtractionPayload {
  const existing = asRecord(input.existingPayload) ?? {};
  const existingMetadata = asRecord(existing.metadata) ?? {};
  const raw = input.rawOutput;
  const warnings = [...(raw.extractionWarnings ?? [])];
  const contentType = chooseContentType(raw);
  const title = cleanString(raw.title) || cleanString(existing.title) || fallbackTitle(contentType);
  const summary =
    cleanString(raw.summary) ||
    summarizeFromRaw(raw) ||
    cleanString(existing.summary) ||
    "Structured knowledge extracted from the source carousel.";
  const blocks: CanonicalBlock[] = [];

  blocks.push({
    id: "hero",
    type: "hero",
    kind: "summary",
    title: "Knowledge Frame",
    eyebrow: labelForContentType(contentType),
    body: summary,
    highlights: compactStrings([
      raw.contentTypeReason,
      firstInsight(raw.keyInsights),
      raw.resources?.[0]?.reason ?? raw.opportunities?.[0]?.focus,
    ], 3),
  });

  if (summary) {
    blocks.push({
      id: "summary",
      type: "summary",
      kind: "summary",
      title: "Summary",
      body: summary,
      highlights: compactStrings(raw.keyInsights.map(toText), 3),
    });
  }

  const insights = raw.keyInsights.map(toGroundedText).filter((item) => item.text);
  if (insights.length > 0) {
    blocks.push({
      id: "key-insights",
      type: "key_insights",
      kind: "checklist",
      title: "Key Insights",
      items: insights.map((item) => ({
        text: item.text,
        detail: item.evidenceText ? `Evidence: ${item.evidenceText}` : undefined,
        sourceSlideIndex: item.sourceSlideIndex,
        evidenceText: item.evidenceText,
      })),
    });
  }

  const actions = raw.actionSteps.map(toGroundedText).filter((item) => item.text);
  if (actions.length > 0) {
    blocks.push({
      id: "action-checklist",
      type: "action_checklist",
      kind: "checklist",
      title: "Action Checklist",
      items: actions.map((item) => ({
        text: item.text,
        detail: item.evidenceText,
        sourceSlideIndex: item.sourceSlideIndex,
        evidenceText: item.evidenceText,
      })),
    });
  }

  const resources = (raw.resources ?? []).filter((resource) => cleanString(resource.title));
  if (resources.length > 0) {
    blocks.push({
      id: "resource-grid",
      type: "resource_grid",
      kind: "resources",
      title: "Resources",
      groups: [
        {
          category: "Extracted Resources",
          items: resources.map((resource, index) => {
            const color = COLORS[index % COLORS.length];
            return {
              title: cleanString(resource.title),
              description: cleanString(resource.reason) || cleanString(resource.evidenceText),
              type: cleanString(resource.type) || "Resource",
              link: safeLink(resource.url),
              sourceSlideIndex: resource.sourceSlideIndex,
              evidenceText: resource.evidenceText,
              linkStatus: resource.linkStatus ?? (resource.url ? "explicit" : "missing"),
              color: color.color,
              colorBg: color.bg,
            };
          }),
        },
      ],
    });
  }

  const opportunities = (raw.opportunities ?? []).filter((opportunity) => cleanString(opportunity.title));
  if (opportunities.length > 0) {
    blocks.push({
      id: "opportunity-list",
      type: "opportunity_list",
      kind: "resources",
      title: "Opportunities",
      groups: [
        {
          category: "Programs & Opportunities",
          items: opportunities.map((opportunity, index) => {
            const color = COLORS[index % COLORS.length];
            const details = compactStrings([
              opportunity.organization,
              opportunity.deadline ? `Deadline: ${opportunity.deadline}` : undefined,
              opportunity.stipend ? `Stipend: ${opportunity.stipend}` : undefined,
              opportunity.location,
              opportunity.duration,
              opportunity.focus,
            ], 6).join(" • ");
            return {
              title: cleanString(opportunity.title),
              description: details || cleanString(opportunity.notes) || cleanString(opportunity.evidenceText),
              type: "Opportunity",
              link: safeLink(opportunity.applyUrl),
              sourceSlideIndex: opportunity.sourceSlideIndex,
              evidenceText: opportunity.evidenceText,
              color: color.color,
              colorBg: color.bg,
            };
          }),
        },
      ],
      opportunities,
    });
  }

  const concepts = (raw.concepts ?? []).filter((concept) => cleanString(concept.name) || cleanString(concept.explanation));
  if (concepts.length > 0) {
    blocks.push({
      id: "concept-cards",
      type: "concept_cards",
      kind: "concepts",
      title: "Concepts",
      clusters: concepts.map((concept) => ({
        name: cleanString(concept.name) || "Concept",
        description: cleanString(concept.explanation) || cleanString(concept.evidenceText) || "Extracted concept.",
        ideas: compactStrings([concept.evidenceText], 1),
        sourceSlideIndex: concept.sourceSlideIndex,
        evidenceText: concept.evidenceText,
      })),
    });
  }

  const learningPath = (raw.learningPath ?? []).filter((step) => cleanString(step.step) || cleanString(step.description));
  if (["roadmap", "tutorial", "system"].includes(contentType) && learningPath.length > 0) {
    blocks.push({
      id: "learning-path",
      type: "learning_path",
      kind: "roadmap",
      title: contentType === "tutorial" ? "Implementation Sequence" : "Learning Path",
      stages: learningPath.map((step, index) => {
        const color = COLORS[index % COLORS.length];
        return {
          stage: cleanString(step.step) || `Step ${index + 1}`,
          description: cleanString(step.description) || cleanString(step.evidenceText) || "Continue to the next stage.",
          milestone: cleanString(step.evidenceText) || undefined,
          sourceSlideIndex: step.sourceSlideIndex,
          evidenceText: step.evidenceText,
          duration: undefined,
          color: color.color,
          bg: color.bg,
          border: color.border,
        };
      }),
    });
  }

  const promptTemplates = (raw.promptTemplates ?? []).filter((prompt) => cleanString(prompt.title) || cleanString(prompt.promptText));
  if (promptTemplates.length > 0) {
    blocks.push({
      id: "prompt-templates",
      type: "prompt_templates",
      kind: "checklist",
      title: "Prompt Templates",
      items: promptTemplates.map((prompt) => ({
        text: cleanString(prompt.title) || "Prompt template",
        detail: compactStrings([prompt.purpose, prompt.promptText], 2).join(" — "),
        variables: prompt.variables ?? [],
        sourceSlideIndex: prompt.sourceSlideIndex,
        evidenceText: prompt.evidenceText,
      })),
      promptTemplates,
    });
  }

  const notes = compactStrings(raw.notes, 8);
  if (notes.length > 0) {
    blocks.push({
      id: "notes",
      type: "notes",
      kind: "summary",
      title: "Notes",
      body: notes.join("\n\n"),
    });
  }

  const cleanWarnings = compactStrings(warnings, 12);
  if (cleanWarnings.length > 0) {
    blocks.push({
      id: "warnings",
      type: "warning",
      kind: "summary",
      title: "Extraction Warnings",
      body: cleanWarnings.join("\n\n"),
    });
  }

  return {
    id: input.extractionId,
    version: "v1",
    generatedFrom: "ai_raw_output",
    contentType,
    title,
    summary,
    confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
    blocks,
    warnings: cleanWarnings,
    metadata: {
      ...existingMetadata,
      normalizedAt: new Date().toISOString(),
      normalizerVersion: "phase5b-v1",
      sourceAiModel: input.sourceAiModel,
      sourceAiProvider: input.sourceAiProvider,
      generatedFrom: "ai_raw_output",
      contentTypeReason: raw.contentTypeReason,
    },
    slides: Array.isArray(existing.slides) ? existing.slides : [],
  };
}

function chooseContentType(raw: RawGroqExtractionJson) {
  const opportunities = raw.opportunities?.length ?? 0;
  const resources = raw.resources?.length ?? 0;
  const actions = raw.actionSteps?.length ?? 0;
  const prompts = raw.promptTemplates?.length ?? 0;
  const learningPath = raw.learningPath?.length ?? 0;
  const titleAndSummary = `${raw.title} ${raw.summary} ${raw.contentTypeReason ?? ""}`.toLowerCase();
  const opportunityListSignal =
    raw.contentType === "opportunities" ||
    /\b(opportunities|programs|fellowships|scholarships|grants|deadlines|stipends|open calls)\b/.test(titleAndSummary);

  if (opportunities >= 2 || opportunityListSignal) {
    return "opportunities";
  }
  if (resources >= Math.max(3, learningPath + actions) || /\b(websites?|repos?|repositories|tools?|resources?)\b/.test(titleAndSummary)) {
    return "resources";
  }
  if (prompts > 0 || /\b(prompt|template)\b/.test(titleAndSummary)) {
    return raw.contentType === "system" ? "system" : "playbook";
  }
  if (raw.contentType === "roadmap" && learningPath > 0) return "roadmap";
  if (raw.contentType === "tutorial") return "tutorial";
  if (raw.contentType === "system") return "system";
  if (actions > 0) return "playbook";
  if (raw.contentType === "conceptual") return "conceptual";
  return raw.contentType || "unknown";
}

function summarizeFromRaw(raw: RawGroqExtractionJson) {
  const first = firstInsight(raw.keyInsights);
  if (first) return first;
  if (raw.resources?.length) return `A curated set of ${raw.resources.length} extracted resources.`;
  if (raw.opportunities?.length) return `A structured list of ${raw.opportunities.length} extracted opportunities.`;
  if (raw.promptTemplates?.length) return `A set of ${raw.promptTemplates.length} reusable prompt templates.`;
  return "";
}

function firstInsight(items: GroundedText[]) {
  return cleanString(toGroundedText(items[0]).text);
}

function toGroundedText(item: GroundedText | undefined) {
  if (typeof item === "string") return { text: cleanString(item) };
  return {
    text: cleanString(item?.text),
    sourceSlideIndex: item?.sourceSlideIndex,
    evidenceText: cleanString(item?.evidenceText),
  };
}

function toText(item: GroundedText) {
  return toGroundedText(item).text;
}

function compactStrings(values: unknown[], limit: number) {
  return values
    .map(cleanString)
    .filter(Boolean)
    .slice(0, limit);
}

function safeLink(value: unknown) {
  const link = cleanString(value);
  return link || "#";
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function fallbackTitle(contentType: string) {
  if (contentType === "resources") return "Extracted Resources";
  if (contentType === "opportunities") return "Extracted Opportunities";
  if (contentType === "playbook") return "Extracted Playbook";
  if (contentType === "system") return "Extracted System";
  return "Adaptive Knowledge Extraction";
}

function labelForContentType(contentType: string) {
  return contentType.replace(/_/g, " ");
}
