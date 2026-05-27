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
          .map((slide) => `Slide ${slide.slideIndex}\n${slide.text.trim()}`)
          .join("\n\n---\n\n")
      : input.ocrText;
  const metadataPreview = input.metadata ? JSON.stringify(input.metadata).slice(0, 2000) : "{}";

  return [
    {
      role: "system" as const,
      content:
        "You are CarouselBrain's semantic extraction engine. CarouselBrain is not a generic summarizer. It transforms OCR text from educational carousels into structured knowledge that can later drive adaptive interfaces. Return valid JSON only. Do not wrap the JSON in markdown.",
    },
    {
      role: "user" as const,
      content: `Analyze this carousel OCR and produce structured JSON.

Extraction id: ${input.extractionId}
Metadata preview: ${metadataPreview}

The model should identify:
- likely content type
- title
- concise summary
- key insights
- action steps
- concepts
- resources/tools/links if present
- learning path if relevant
- warnings/limitations if relevant

Use this exact JSON shape:
${JSON.stringify(exampleShape(), null, 2)}

Allowed contentType values: roadmap, resources, tutorial, playbook, conceptual, system, unknown.
confidence must be a number from 0 to 1.
Use empty arrays when a field is not present.
Keep the output grounded in the OCR text. OCR may contain noisy text; ignore obvious OCR artifacts where possible.

OCR text:
${slideText}`,
    },
  ];
}

function exampleShape(): RawGroqExtractionJson {
  return {
    contentType: "unknown",
    title: "",
    summary: "",
    confidence: 0,
    keyInsights: [],
    actionSteps: [],
    concepts: [{ name: "", explanation: "" }],
    resources: [{ title: "", url: "", type: "" }],
    learningPath: [{ step: "", description: "" }],
    notes: [],
  };
}
