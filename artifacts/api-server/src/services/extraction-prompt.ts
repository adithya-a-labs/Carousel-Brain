import type { RawGroqExtractionJson } from "./groq-provider";

type BuildExtractionPromptInput = {
  extractionId: string;
  ocrText: string;
  slideTexts?: Array<{ slideIndex: number; text: string }>;
  metadata?: Record<string, unknown>;
};

export function buildStructuredExtractionPrompt(input: BuildExtractionPromptInput) {
  const slideText =
    input.slideTexts && input.slideTexts.length > 0
      ? input.slideTexts
          .map((slide) => `Slide ${slide.slideIndex}\n${compactText(slide.text, 700)}`)
          .join("\n\n---\n\n")
          .slice(0, 7000)
      : compactText(input.ocrText, 7000);
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
- resources for websites/tools/repos/books/courses/platforms/link lists/resource directories.
- opportunities for internships/fellowships/programs/grants/scholarships/deadlines/stipends/applications/open calls.
- tutorial for step-by-step implementation.
- playbook for advice/strategy/heuristics/prompts/repeatable practices/CS or career advice.
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
- Resources: title, type repo|website|tool|course|program|prompt|unknown, url/null, reason, sourceSlideIndex, evidenceText, linkStatus.
- GitHub repos: preserve visible names exactly; do not invent github.com links.
- Opportunities: populate opportunities with title, organization, deadline, location, stipend, duration, focus, applyUrl, notes; null if missing.
- Prompts/templates: populate promptTemplates; preserve actual prompt text; capture variables/placeholders.
- Action steps: only real instructions. CS advice should include concrete "DO THIS" actions when visible.
- Learning path: only real learning/progression sequence. Empty for resources, opportunities, prompt collections, CS advice, GitHub profile rewrites, numbered prompt/action steps, and OCR-noise stages.
- If the OCR contains unrelated code/editor text like "Stage 4 - Backend", "Deploy", "Cursor", "TypeScript", or UI fragments that do not match the carousel topic, treat it as OCR noise.

Few-shot patterns:
- If OCR is a list of developer websites with no visible URLs, choose resources, create one resource per visible site, set url null, linkStatus missing, and keep learningPath empty.
- If OCR is a list of programs with deadlines, stipends, or locations, choose opportunities, create one opportunity per visible program, set missing fields null, and keep learningPath empty.
- If OCR contains copyable prompt text, choose playbook or system, extract only promptTemplates whose promptText appears in OCR, and keep learningPath empty unless it is also a real curriculum.

Return JSON only. No markdown, comments, or prose outside JSON. confidence is 0..1. Use empty arrays when absent.

OCR text:
${slideText}`,
    },
  ];
}

function compactText(value: string, maxLength: number) {
  const cleaned = value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}\n[truncated]` : cleaned;
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
    concepts: [{ name: "", explanation: "", sourceSlideIndex: null, evidenceText: null }],
    resources: [
      {
        title: "",
        type: "unknown",
        url: null,
        reason: null,
        sourceSlideIndex: null,
        evidenceText: null,
        linkStatus: "missing",
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
        applyUrl: null,
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
        sourceSlideIndex: null,
        evidenceText: null,
      },
    ],
    learningPath: [{ step: "", description: "", sourceSlideIndex: null, evidenceText: null }],
    notes: [],
    extractionWarnings: [],
  };
}
