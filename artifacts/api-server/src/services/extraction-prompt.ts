import type { RawGroqExtractionJson } from "./groq-provider";

type BuildExtractionPromptInput = {
  extractionId: string;
  ocrText: string;
  slideTexts?: Array<{ slideIndex: number; text: string }>;
  metadata?: Record<string, unknown>;
};

export function buildStructuredExtractionPrompt(input: BuildExtractionPromptInput) {
  const catalogMode = isCatalogCarousel(input);
  const perSlideLimit = catalogMode ? 4000 : 700;
  const fullLimit = catalogMode ? 40000 : 7000;
  const slideText =
    input.slideTexts && input.slideTexts.length > 0
      ? input.slideTexts
          .map((slide) => `Slide ${slide.slideIndex}\n${compactText(slide.text, perSlideLimit, catalogMode)}`)
          .join("\n\n---\n\n")
          .slice(0, fullLimit)
      : compactText(input.ocrText, fullLimit, catalogMode);
  const metadataPreview = input.metadata ? JSON.stringify(input.metadata).slice(0, 800) : "{}";

  return [
    {
      role: "system" as const,
      content:
        "You are CarouselBrain's semantic extraction engine. CarouselBrain is not a generic summarizer. It transforms OCR text from educational carousels into structured knowledge that can later drive adaptive interfaces. Be conservative, source-grounded, and precise. Return valid JSON only. Do not wrap the JSON in markdown. Do not include prose outside JSON.",
    },
    {
      role: "user" as const,
      content: `Analyze this carousel OCR and produce structured JSON.

Extraction id: ${input.extractionId}
Metadata preview: ${metadataPreview}

Use this exact JSON shape:
${JSON.stringify(exampleShape(), null, 2)}

Classification:
- roadmap ONLY for explicit ordered progression/stages/curriculum/timeline.
- resources for dominant lists of websites/tools/repos/APIs/books/courses/platforms/link lists/resource directories.
- opportunities for internships/fellowships/programs/grants/scholarships/deadlines/stipends/applications/open calls.
- tutorial for actual step-by-step implementation instructions.
- playbook for advice/strategy/heuristics/prompts/"things I wish I knew"/repeatable practices/CS or career advice.
- conceptual for ideas/frameworks/mental models.
- system for workflows/templates/checklists/routines.
- unknown if uncertain.
If unsure prefer opportunities/resources/playbook/system over roadmap.
- If the carousel names 3+ websites, tools, repos, platforms, programs, courses, or resource names, choose resources unless it is clearly internships/program applications; then choose opportunities.
- Titles like "websites that...", "tools that...", "repos that...", "resources for...", "best sites", "GitHub repos", or "prompt collection" are resources, not playbooks or roadmaps.
- Titles like "internships", "fellowships", "programs", "scholarships", "grants", "opportunities", or "deadlines" are opportunities, not resources or roadmaps.

Strict grounding:
- Never invent URLs, fake links, official sites, repo owners, organizations, deadlines, stipends, locations, or durations.
- Brand/tool names are not URLs. If no explicit URL appears, use null.
- Preserve imperfect visible URLs as text and set linkStatus "incomplete" or "uncertain".
- Ignore OCR noise; if uncertain, use null and add extractionWarnings.
- Major items should include sourceSlideIndex and short evidenceText when possible.
- contentTypeReason must be one short sentence explaining why this structure was chosen.
- Never include anything from the examples below unless the same item appears in the OCR text.

Extraction behavior:
- Catalog/list mode: ${catalogMode ? "ON" : "OFF"}. Catalog-style carousels include project ideas, startup ideas, app ideas, SaaS ideas, AI project ideas, 100+, list of ideas, examples, directories, and collections.
- If the carousel contains many ideas/items/examples, DO NOT summarize the list. Extract every visible item individually into catalogItems. Preserve each project idea as a separate catalogItem. Do not merge similar ideas. Do not drop items just because there are many. If text is noisy, still preserve the item title when visible. Use sourceSlideIndex for every item where possible.
- catalogType should be project_ideas, startup_ideas, resources, tools, examples, or unknown.
- Semantic compression: keyInsights must synthesize the meaning rather than copy OCR verbatim. Example: "projects > grades" means "Portfolio-quality work is a stronger hiring signal than GPA once baseline academic performance is acceptable." Example: "Pinecone gives LLMs memory" means "Vector databases extend LLM applications by enabling retrieval over external knowledge." Example: "apply everywhere" means "Broad application volume increases exposure to internships, clubs, and early-career opportunities."
- Summaries must never be empty. They should state what the carousel helps the user understand or do.
- Resources: title, type repo|website|tool|course|program|prompt|api|book|unknown, url/null, linkStatus, category, reason, bestFor, difficulty, sourceSlideIndex, evidenceText. reason should explain why the resource is useful, not merely repeat its name.
- GitHub repos: preserve visible names exactly; do not invent github.com links.
- Opportunities: populate opportunities with title, organization, deadline, location, stipend, duration, focus, eligibility, format, applyUrl, urgency, notes; null if missing. Preserve concrete deadlines, stipends, locations, and durations exactly when visible.
- Prompts/templates: populate promptTemplates; preserve actual copyable prompt text as much as OCR allows; capture variables/placeholders, expectedOutput, and bestUsedFor.
- Concepts: include specific concepts, not generic labels. Add whyItMatters and relatedResources when grounded in OCR.
- Action steps: only real instructions. They must be concrete and directly executable. CS advice should include concrete "DO THIS" actions when visible.
- Learning path: only real learning/progression sequence. Empty for resources, opportunities, prompt collections, CS advice, GitHub profile rewrites, numbered prompt/action steps, and OCR-noise stages.
- If the OCR contains unrelated code/editor text like "Stage 4 - Backend", "Deploy", "Cursor", "TypeScript", or UI fragments that do not match the carousel topic, treat it as OCR noise.
- Engagement bait like "comment X for link" should not become a resource. Keep it only in notes when relevant.
- Never hallucinate URLs, official links, facts, deadlines, organizations, or eligibility. Null is better than a fake value.

Few-shot patterns:
- If OCR says "100+ AI project ideas" and then lists individual ideas, choose resources or system, set catalogType "project_ideas", create one catalogItem per visible idea, and do not collapse the ideas into keyInsights.
- If OCR is a list of developer websites with no visible URLs, choose resources, create one resource per visible site, set url null, linkStatus missing, and keep learningPath empty.
- If OCR is a list of programs with deadlines, stipends, or locations, choose opportunities, create one opportunity per visible program, set missing fields null, and keep learningPath empty.
- If OCR contains copyable prompt text, choose playbook or system, extract only promptTemplates whose promptText appears in OCR, and keep learningPath empty unless it is also a real curriculum.

Return JSON only. No markdown, comments, or prose outside JSON. confidence is 0..1. Use empty arrays when absent.

OCR text:
${slideText}`,
    },
  ];
}

function compactText(value: string, maxLength: number, catalogMode = false) {
  const cleaned = value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (catalogMode) {
    return compactCatalogText(cleaned, maxLength);
  }

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}\n[truncated]` : cleaned;
}

function compactCatalogText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const itemLike = lines.filter((line) => isCatalogItemLine(line));
  const other = lines.filter((line) => !isCatalogItemLine(line)).slice(0, 12);
  const rebuilt = [...other.slice(0, 4), ...itemLike, ...other.slice(4)]
    .join("\n")
    .slice(0, maxLength);

  return `${rebuilt}\n[truncated: catalog lines prioritized]`;
}

function isCatalogCarousel(input: BuildExtractionPromptInput) {
  const haystack = `${input.ocrText} ${input.metadata ? JSON.stringify(input.metadata) : ""}`.toLowerCase();
  return /\b(project ideas?|startup ideas?|app ideas?|saas ideas?|ai project ideas?|100\+|list of ideas?|examples?|directory|collection)\b/.test(haystack);
}

function isCatalogItemLine(line: string) {
  return /^(\d+[\).\-\s:]|[-*\u2022]\s+|[A-Z][A-Za-z0-9 /&+.-]{2,70}\s*[-:])/.test(line) ||
    /\b(app|agent|dashboard|tracker|generator|assistant|platform|tool|bot|project|idea|analyzer|planner|builder)\b/i.test(line);
}

function exampleShape(): RawGroqExtractionJson {
  return {
    contentType: "unknown",
    contentTypeReason: "",
    title: "",
    summary: "",
    confidence: 0,
    keyInsights: [{ text: "", sourceSlideIndex: null, evidenceText: null }],
    actionSteps: [{ text: "", sourceSlideIndex: null, evidenceText: null }],
    concepts: [
      {
        name: "",
        explanation: "",
        whyItMatters: null,
        relatedResources: [],
        sourceSlideIndex: null,
        evidenceText: null,
      },
    ],
    resources: [
      {
        title: "",
        type: "unknown",
        url: null,
        reason: null,
        category: null,
        bestFor: null,
        difficulty: null,
        sourceSlideIndex: null,
        evidenceText: null,
        linkStatus: "missing",
      },
    ],
    catalogType: "unknown",
    catalogItems: [
      {
        title: "",
        description: null,
        category: null,
        difficulty: null,
        techStack: [],
        sourceSlideIndex: null,
        evidenceText: null,
      },
    ],
    opportunities: [
      {
        title: "",
        organization: null,
        deadline: null,
        location: null,
        stipend: null,
        duration: null,
        focus: null,
        eligibility: null,
        format: null,
        applyUrl: null,
        urgency: null,
        notes: null,
        sourceSlideIndex: null,
        evidenceText: null,
      },
    ],
    promptTemplates: [
      {
        title: "",
        purpose: null,
        promptText: "",
        variables: [],
        expectedOutput: null,
        bestUsedFor: null,
        sourceSlideIndex: null,
        evidenceText: null,
      },
    ],
    learningPath: [{ step: "", description: "", sourceSlideIndex: null, evidenceText: null }],
    notes: [],
    extractionWarnings: [],
  };
}
