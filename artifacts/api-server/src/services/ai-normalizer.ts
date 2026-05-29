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
  | "catalog_grid"
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
  quality?: {
    extractionQualityScore: number;
    groundingScore: number;
    hasHallucinationRisk: boolean;
    warningCount: number;
    missingSummaryRecovered: boolean;
    resourceCount: number;
    opportunityCount: number;
    actionStepCount: number;
    promptTemplateCount: number;
    catalogItemCount: number;
  };
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
  const title =
    cleanString(raw.title) ||
    cleanString(existing.title) ||
    inferTitleFromOcr(input.slideTexts, input.ocrText) ||
    fallbackTitle(contentType);
  const missingSummaryRecovered = !cleanString(raw.summary);
  const summary =
    cleanString(raw.summary) ||
    summarizeFromRaw(raw) ||
    cleanString(existing.summary) ||
    summarizeFromOcr(input.ocrText, title) ||
    "Structured knowledge extracted from the source carousel.";
  const blocks: CanonicalBlock[] = [];

  blocks.push({
    id: "hero",
    type: "hero",
    kind: "summary",
    title: "Knowledge Frame",
    eyebrow: labelForContentType(contentType),
    body: summary,
    confidence: raw.confidence,
    highlights: compactStrings([
      raw.contentTypeReason,
      firstInsight(raw.keyInsights),
      raw.catalogItems?.[0]?.title ?? raw.resources?.[0]?.reason ?? raw.opportunities?.[0]?.focus,
    ], 3),
    trust: blockTrust(raw.confidence, raw.keyInsights.length + raw.resources.length + (raw.opportunities?.length ?? 0) + (raw.catalogItems?.length ?? 0)),
  });

  if (summary) {
    blocks.push({
      id: "summary",
      type: "summary",
      kind: "summary",
      title: "Summary",
      body: summary,
      highlights: compactStrings(raw.keyInsights.map(toText), 3),
      confidence: raw.confidence,
      trust: blockTrust(raw.confidence, raw.keyInsights.length),
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
      trust: blockTrust(raw.confidence, insights.filter((item) => item.evidenceText).length),
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
      trust: blockTrust(raw.confidence, actions.filter((item) => item.evidenceText).length),
    });
  }

  const resources = (raw.resources ?? []).filter((resource) => cleanString(resource.title));
  const catalogItems = (raw.catalogItems ?? []).filter((item) => cleanString(item.title));
  if (catalogItems.length > 0) {
    blocks.push({
      id: "catalog-grid",
      type: "catalog_grid",
      kind: "catalog_grid",
      title: catalogTitle(raw.catalogType),
      catalogType: raw.catalogType ?? "unknown",
      items: catalogItems.map((item, index) => {
        const color = COLORS[index % COLORS.length];
        return {
          title: cleanString(item.title),
          description: cleanString(item.description) || cleanString(item.evidenceText),
          category: cleanString(item.category) || undefined,
          difficulty: cleanString(item.difficulty) || undefined,
          techStack: item.techStack ?? [],
          sourceSlideIndex: item.sourceSlideIndex,
          evidenceText: item.evidenceText,
          color: color.color,
          colorBg: color.bg,
        };
      }),
      trust: blockTrust(raw.confidence, catalogItems.filter((item) => item.evidenceText).length),
    });
  }

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
            const link = normalizeOptionalUrl(resource.url);
            const linkStatus = link.status ?? resource.linkStatus ?? (link.url ? "explicit" : "missing");
            return {
              title: cleanString(resource.title),
              description: cleanString(resource.reason) || cleanString(resource.evidenceText),
              type: cleanString(resource.type) || "Resource",
              link: link.url ?? "#",
              url: link.url,
              category: cleanString(resource.category) || cleanString(resource.type) || undefined,
              bestFor: cleanString(resource.bestFor) || undefined,
              difficulty: cleanString(resource.difficulty) || undefined,
              reason: cleanString(resource.reason) || undefined,
              sourceSlideIndex: resource.sourceSlideIndex,
              evidenceText: resource.evidenceText,
              linkStatus,
              color: color.color,
              colorBg: color.bg,
            };
          }),
        },
      ],
      trust: blockTrust(raw.confidence, resources.filter((resource) => resource.evidenceText).length),
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
              opportunity.eligibility ? `Eligibility: ${opportunity.eligibility}` : undefined,
              opportunity.format ? `Format: ${opportunity.format}` : undefined,
            ], 6).join(" - ");
            const applyLink = normalizeOptionalUrl(opportunity.applyUrl);
            return {
              title: cleanString(opportunity.title),
              description: details || cleanString(opportunity.notes) || cleanString(opportunity.evidenceText),
              type: "Opportunity",
              link: applyLink.url ?? "#",
              applyUrl: applyLink.url,
              organization: cleanString(opportunity.organization) || undefined,
              deadline: cleanString(opportunity.deadline) || undefined,
              stipend: cleanString(opportunity.stipend) || undefined,
              location: cleanString(opportunity.location) || undefined,
              duration: cleanString(opportunity.duration) || undefined,
              focus: cleanString(opportunity.focus) || undefined,
              eligibility: cleanString(opportunity.eligibility) || undefined,
              format: cleanString(opportunity.format) || undefined,
              urgency: cleanString(opportunity.urgency) || undefined,
              notes: cleanString(opportunity.notes) || undefined,
              sourceSlideIndex: opportunity.sourceSlideIndex,
              evidenceText: opportunity.evidenceText,
              color: color.color,
              colorBg: color.bg,
            };
          }),
        },
      ],
      opportunities,
      trust: blockTrust(raw.confidence, opportunities.filter((opportunity) => opportunity.evidenceText).length),
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
        whyItMatters: cleanString(concept.whyItMatters) || undefined,
        relatedResources: concept.relatedResources ?? [],
        ideas: compactStrings([concept.whyItMatters, concept.evidenceText], 2),
        sourceSlideIndex: concept.sourceSlideIndex,
        evidenceText: concept.evidenceText,
      })),
      trust: blockTrust(raw.confidence, concepts.filter((concept) => concept.evidenceText).length),
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
        detail: compactStrings([prompt.purpose, prompt.promptText], 2).join(" - "),
        variables: prompt.variables ?? [],
        promptText: cleanString(prompt.promptText),
        purpose: cleanString(prompt.purpose) || undefined,
        expectedOutput: cleanString(prompt.expectedOutput) || undefined,
        bestUsedFor: cleanString(prompt.bestUsedFor) || undefined,
        sourceSlideIndex: prompt.sourceSlideIndex,
        evidenceText: prompt.evidenceText,
      })),
      promptTemplates,
      trust: blockTrust(raw.confidence, promptTemplates.filter((prompt) => prompt.evidenceText).length),
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

  if (blocks.length <= 2 && !insights.length && !actions.length && !resources.length && !catalogItems.length && !opportunities.length && !concepts.length && !promptTemplates.length) {
    blocks.push({
      id: "low-signal-warning",
      type: "warning",
      kind: "summary",
      title: "Limited Structure Detected",
      body: "CarouselBrain could not identify a strong resource, opportunity, playbook, roadmap, or prompt structure from the available OCR text.",
      trust: blockTrust(raw.confidence, 0),
    });
  }

  const quality = calculateQuality({
    confidence: raw.confidence,
    warnings: cleanWarnings,
    missingSummaryRecovered,
    resources,
    catalogItems,
    opportunities,
    actions,
    promptTemplates,
    insights,
    concepts,
  });

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
    quality,
    metadata: {
      ...existingMetadata,
      normalizedAt: new Date().toISOString(),
      normalizerVersion: "phase5d-v1",
      sourceAiModel: input.sourceAiModel,
      sourceAiProvider: input.sourceAiProvider,
      generatedFrom: "ai_raw_output",
      contentTypeReason: raw.contentTypeReason,
      quality,
    },
    slides: Array.isArray(existing.slides) ? existing.slides : [],
  };
}

function chooseContentType(raw: RawGroqExtractionJson) {
  const opportunities = raw.opportunities?.length ?? 0;
  const resources = raw.resources?.length ?? 0;
  const catalogItems = raw.catalogItems?.length ?? 0;
  const actions = raw.actionSteps?.length ?? 0;
  const prompts = raw.promptTemplates?.length ?? 0;
  const learningPath = raw.learningPath?.length ?? 0;
  const titleAndSummary = `${raw.title} ${raw.summary} ${raw.contentTypeReason ?? ""}`.toLowerCase();
  const opportunityListSignal =
    raw.contentType === "opportunities" ||
    /\b(opportunities|internships?|programs?|fellowships?|scholarships?|grants?|deadlines?|stipends?|applications?|open calls?)\b/.test(titleAndSummary);
  const resourceListSignal =
    raw.contentType === "resources" ||
    /\b(websites?|repos?|repositories|tools?|resources?|apis?|books?|courses?|platforms?|libraries|github)\b/.test(titleAndSummary);
  const promptSignal = prompts > 0 || /\b(prompt|template|claude|chatgpt|copyable)\b/.test(titleAndSummary);
  const playbookSignal = /\b(advice|things i wish|do this|rules?|heuristics?|strategy|tips?|mistakes?|playbook)\b/.test(titleAndSummary);
  const systemSignal = /\b(system|workflow|checklist|routine|operating system|process)\b/.test(titleAndSummary);
  const tutorialSignal = raw.contentType === "tutorial" && learningPath > 0;
  const roadmapSignal =
    raw.contentType === "roadmap" &&
    learningPath > 1 &&
    /\b(roadmap|stage|phase|path|curriculum|progression|timeline|week|month|level)\b/.test(titleAndSummary);

  if (catalogItems > 0) {
    if (raw.catalogType === "tools" || raw.catalogType === "resources") return "resources";
    if (raw.catalogType === "startup_ideas" || raw.catalogType === "project_ideas" || raw.catalogType === "examples") return "system";
    return raw.contentType === "unknown" ? "system" : raw.contentType;
  }
  if (opportunities >= 2 || opportunityListSignal) {
    return "opportunities";
  }
  if (resources >= Math.max(3, learningPath + actions) || (resourceListSignal && resources > 0)) {
    return "resources";
  }
  if (promptSignal) {
    return raw.contentType === "system" ? "system" : "playbook";
  }
  if (roadmapSignal) return "roadmap";
  if (tutorialSignal) return "tutorial";
  if (raw.contentType === "system" || systemSignal) return "system";
  if (actions > 0 || playbookSignal) return "playbook";
  if (raw.contentType === "conceptual") return "conceptual";
  if (raw.contentType === "roadmap") return learningPath > 1 ? "roadmap" : "unknown";
  if (raw.contentType === "tutorial") return learningPath > 0 || actions > 1 ? "tutorial" : "unknown";
  return raw.contentType || "unknown";
}

function summarizeFromRaw(raw: RawGroqExtractionJson) {
  const first = firstInsight(raw.keyInsights);
  const second = raw.keyInsights.length > 1 ? toGroundedText(raw.keyInsights[1]).text : "";
  if (first && second) return `${first} ${second}`;
  if (first) return first;
  if (raw.resources?.length) return `A curated set of ${raw.resources.length} extracted resources.`;
  if (raw.catalogItems?.length) return `A structured catalog of ${raw.catalogItems.length} visible items from the carousel.`;
  if (raw.opportunities?.length) return `A structured list of ${raw.opportunities.length} extracted opportunities.`;
  if (raw.promptTemplates?.length) return `A set of ${raw.promptTemplates.length} reusable prompt templates.`;
  return "";
}

function summarizeFromOcr(ocrText: string | undefined, title: string) {
  const lines = compactStrings((ocrText ?? "").split(/\n+/), 3)
    .filter((line) => !/^slide\s+\d+/i.test(line))
    .filter((line) => line.toLowerCase() !== title.toLowerCase());
  if (!lines.length) return "";
  return `${title}: ${lines.slice(0, 2).join(" ")}`;
}

function inferTitleFromOcr(slideTexts: Array<{ slideIndex: number; text: string }> | undefined, ocrText: string | undefined) {
  const source = slideTexts?.[0]?.text || ocrText || "";
  const firstLine = source
    .split(/\n+/)
    .map((line) => cleanString(line))
    .find((line) => line.length >= 4 && line.length <= 90 && !/^slide\s+\d+/i.test(line));
  return firstLine || "";
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

function normalizeOptionalUrl(value: unknown): {
  url: string | null;
  status?: "explicit" | "incomplete" | "missing" | "uncertain";
} {
  const link = cleanString(value);
  if (!link) return { url: null, status: "missing" };
  if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(link) || /^www\.[^\s]+\.[^\s]+/i.test(link)) {
    return { url: link, status: "explicit" };
  }
  if (/\.[a-z]{2,}/i.test(link) || /github\.com\//i.test(link)) {
    return { url: link, status: "incomplete" };
  }
  return { url: null, status: "missing" };
}

function blockTrust(confidence: unknown, evidenceCount: number) {
  const numericConfidence = typeof confidence === "number" && Number.isFinite(confidence) ? confidence : undefined;
  return {
    confidence: numericConfidence,
    evidenceCount,
    grounded: evidenceCount > 0,
  };
}

function calculateQuality(input: {
  confidence: unknown;
  warnings: string[];
  missingSummaryRecovered: boolean;
  resources: unknown[];
  opportunities: unknown[];
  actions: unknown[];
  promptTemplates: unknown[];
  catalogItems: unknown[];
  insights: Array<{ evidenceText?: string | null }>;
  concepts: Array<{ evidenceText?: string | null }>;
}) {
  const confidence = typeof input.confidence === "number" && Number.isFinite(input.confidence) ? input.confidence : 0.55;
  const majorItemCount =
    input.resources.length +
    input.opportunities.length +
    input.actions.length +
    input.promptTemplates.length +
    input.catalogItems.length +
    input.insights.length +
    input.concepts.length;
  const evidenceCount =
    input.insights.filter((item) => item.evidenceText).length +
    input.concepts.filter((item) => item.evidenceText).length +
    input.catalogItems.filter((item) => {
      const record = asRecord(item);
      return Boolean(record?.evidenceText);
    }).length;
  const groundingScore = clamp01(majorItemCount === 0 ? 0 : evidenceCount / Math.max(majorItemCount, 1));
  const warningPenalty = Math.min(input.warnings.length * 0.06, 0.3);
  const structureBonus = Math.min(majorItemCount * 0.03, 0.18);
  const extractionQualityScore = clamp01(confidence * 0.55 + groundingScore * 0.25 + structureBonus - warningPenalty);

  return {
    extractionQualityScore,
    groundingScore,
    hasHallucinationRisk: input.warnings.some((warning) => /ungrounded|inferred|hallucinat|removed/i.test(warning)),
    warningCount: input.warnings.length,
    missingSummaryRecovered: input.missingSummaryRecovered,
    resourceCount: input.resources.length,
    opportunityCount: input.opportunities.length,
    actionStepCount: input.actions.length,
    promptTemplateCount: input.promptTemplates.length,
    catalogItemCount: input.catalogItems.length,
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function catalogTitle(catalogType: string | undefined) {
  if (catalogType === "project_ideas") return "Project Ideas";
  if (catalogType === "startup_ideas") return "Startup Ideas";
  if (catalogType === "tools") return "Tool Catalog";
  if (catalogType === "resources") return "Resource Catalog";
  if (catalogType === "examples") return "Examples";
  return "Catalog";
}
