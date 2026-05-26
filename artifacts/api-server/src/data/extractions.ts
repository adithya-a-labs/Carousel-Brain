type ExtractionStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "analyzing"
  | "structuring"
  | "complete"
  | "failed";

type ExtractionContentType =
  | "roadmap"
  | "resources"
  | "tutorial"
  | "playbook"
  | "conceptual"
  | "system";

type Slide = {
  id: number;
  gradient: string;
  accent: string;
  heading: string;
  lines: number[];
  caption: string;
};

type Extraction = {
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
  metadata: {
    source: string;
    tags: string[];
    date: string;
    status: ExtractionStatus;
    confidence?: number;
  };
  slides: Slide[];
  blocks: Array<Record<string, unknown> & { id: string; title: string; kind: string }>;
};

type CreateExtractionInput = {
  sourceType?: "upload" | "instagram";
  instagramUrl?: string;
  uploadedFiles?: Array<{
    name?: string;
    size?: number;
    type?: string;
  }>;
};

const slideSet = (theme: "violet" | "blue" | "green" | "amber" | "rose", count: number): Slide[] => {
  const gradients = {
    violet: [
      "linear-gradient(145deg, hsl(248 70% 42%), hsl(270 65% 52%))",
      "linear-gradient(145deg, hsl(270 60% 40%), hsl(300 55% 52%))",
      "linear-gradient(145deg, hsl(220 65% 38%), hsl(240 65% 52%))",
    ],
    blue: [
      "linear-gradient(145deg, hsl(200 70% 32%), hsl(220 76% 48%))",
      "linear-gradient(145deg, hsl(188 70% 30%), hsl(210 76% 46%))",
      "linear-gradient(145deg, hsl(215 72% 34%), hsl(248 70% 52%))",
    ],
    green: [
      "linear-gradient(145deg, hsl(150 58% 30%), hsl(178 58% 42%))",
      "linear-gradient(145deg, hsl(160 55% 32%), hsl(190 60% 44%))",
      "linear-gradient(145deg, hsl(135 48% 30%), hsl(168 56% 42%))",
    ],
    amber: [
      "linear-gradient(145deg, hsl(30 80% 40%), hsl(45 75% 52%))",
      "linear-gradient(145deg, hsl(32 84% 38%), hsl(48 78% 50%))",
      "linear-gradient(145deg, hsl(18 74% 38%), hsl(38 80% 50%))",
    ],
    rose: [
      "linear-gradient(145deg, hsl(330 64% 38%), hsl(358 62% 50%))",
      "linear-gradient(145deg, hsl(340 65% 40%), hsl(360 60% 52%))",
      "linear-gradient(145deg, hsl(310 58% 36%), hsl(338 62% 50%))",
    ],
  }[theme];

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    gradient: gradients[index % gradients.length],
    accent: "rgba(255,255,255,0.13)",
    heading: ["Foundation", "Sequence", "Leverage", "Practice", "Review", "Scale"][index] ?? `Frame ${index + 1}`,
    lines: index % 2 === 0 ? [3, 4, 2] : [4, 3, 3],
    caption: [
      "Extracted signal from the source carousel.",
      "A semantic frame the workspace can render differently.",
      "Structured for future AI-generated blocks.",
    ][index % 3],
  }));
};

const pathColors = [
  { color: "hsl(200 70% 55%)", bg: "hsl(200 70% 55% / 0.08)", border: "hsl(200 70% 55% / 0.2)" },
  { color: "hsl(248 70% 58%)", bg: "hsl(248 70% 58% / 0.08)", border: "hsl(248 70% 58% / 0.2)" },
  { color: "hsl(270 65% 55%)", bg: "hsl(270 65% 55% / 0.08)", border: "hsl(270 65% 55% / 0.2)" },
  { color: "hsl(30 90% 55%)", bg: "hsl(30 90% 55% / 0.08)", border: "hsl(30 90% 55% / 0.2)" },
];

const extractions: Extraction[] = [
  {
    id: "ai-roadmap",
    title: "AI Roadmap for Knowledge Work",
    summary: "A practical sequence for turning AI experiments into durable operating leverage.",
    contentType: "roadmap",
    metadata: { source: "Extracted from strategy carousel", tags: ["Learning", "Career", "Systems"], date: "4 days ago", status: "complete", confidence: 0.94 },
    slides: slideSet("blue", 5),
    blocks: [
      { id: "orientation", kind: "summary", title: "Strategic Orientation", eyebrow: "Roadmap thesis", body: "AI adoption works best when teams start from recurring knowledge workflows, define context boundaries, and scale only after measured pilot lift.", highlights: ["Workflow-first adoption", "Context contracts", "Measured pilot loops"] },
      { id: "roadmap", kind: "roadmap", title: "Adoption Roadmap", stages: [
        { stage: "Map Workflows", description: "Identify repeated knowledge tasks with high decision value.", milestone: "Top 5 leverage map", duration: "Week 1", ...pathColors[0] },
        { stage: "Define Context", description: "Specify inputs, examples, constraints, and review rules.", milestone: "Context contract", duration: "Week 2", ...pathColors[1] },
        { stage: "Run Pilot", description: "Ship a narrow assistant and measure cycle time or quality lift.", milestone: "Pilot scorecard", duration: "Weeks 3-4", ...pathColors[2] },
        { stage: "Scale Governance", description: "Expand only where review paths and ownership are clear.", milestone: "Operating model", duration: "Month 2", ...pathColors[3] },
      ] },
      { id: "decision-points", kind: "timeline", title: "Decision Timeline", events: [
        { label: "Select one workflow", timeframe: "Day 1", description: "Pick a task that repeats often and has a clear success measure." },
        { label: "Instrument the pilot", timeframe: "Week 2", description: "Define baseline time, error rate, or decision latency before automation." },
        { label: "Review expansion", timeframe: "Month 1", description: "Expand only after users trust the output and escalation rules are explicit." },
      ] },
    ],
  },
  {
    id: "top-github-repos",
    title: "Top GitHub Repos for AI Builders",
    summary: "A curated resource map for useful agent, RAG, and evaluation repositories.",
    contentType: "resources",
    metadata: { source: "Extracted from resource carousel", tags: ["Learning", "Systems"], date: "1 week ago", status: "complete", confidence: 0.91 },
    slides: slideSet("green", 6),
    blocks: [
      { id: "resource-map", kind: "summary", title: "Resource Map", body: "This carousel is best understood as a categorized toolkit: agent orchestration, retrieval systems, eval harnesses, and production observability." },
      { id: "repositories", kind: "repoCollection", title: "Repository Cards", repos: [
        { name: "LangGraph", description: "Stateful agent workflows with controllable graph execution.", language: "Python", stars: "9k+", link: "#", color: "hsl(248 70% 58%)", colorBg: "hsl(248 70% 58% / 0.08)" },
        { name: "LlamaIndex", description: "Data connectors and retrieval abstractions for knowledge systems.", language: "Python", stars: "35k+", link: "#", color: "hsl(200 70% 50%)", colorBg: "hsl(200 70% 50% / 0.08)" },
        { name: "OpenAI Evals", description: "Patterns for measuring model behavior and task quality.", language: "Python", stars: "16k+", link: "#", color: "hsl(150 65% 48%)", colorBg: "hsl(150 65% 48% / 0.08)" },
        { name: "DSPy", description: "Programmatic optimization for language model pipelines.", language: "Python", stars: "20k+", link: "#", color: "hsl(30 90% 55%)", colorBg: "hsl(30 90% 55% / 0.08)" },
      ] },
      { id: "tool-groups", kind: "resources", title: "Tool Categories", groups: [
        { category: "Retrieval", items: [
          { title: "Vector DB patterns", description: "Chunking, embeddings, reranking, and freshness checks.", type: "Guide", link: "#", color: "hsl(200 70% 50%)", colorBg: "hsl(200 70% 50% / 0.08)" },
          { title: "RAG evaluation sheet", description: "Track answer quality against source-grounded examples.", type: "Template", link: "#", color: "hsl(248 70% 58%)", colorBg: "hsl(248 70% 58% / 0.08)" },
        ] },
        { category: "Production", items: [
          { title: "Observability checklist", description: "Latency, cost, refusal, and escalation monitoring.", type: "Checklist", link: "#", color: "hsl(30 90% 55%)", colorBg: "hsl(30 90% 55% / 0.08)" },
        ] },
      ] },
    ],
  },
  {
    id: "startup-playbook",
    title: "Startup GTM Playbook",
    summary: "A founder operating system for positioning, experiments, and traction loops.",
    contentType: "playbook",
    metadata: { source: "Extracted from founder carousel", tags: ["Career", "Systems"], date: "2 weeks ago", status: "complete", confidence: 0.9 },
    slides: slideSet("amber", 6),
    blocks: [
      { id: "playbook-frame", kind: "summary", title: "Operating Frame", body: "The carousel is an execution playbook: narrow the audience, sharpen the promise, run weekly distribution experiments, and review traction honestly.", highlights: ["Audience wedge", "Message-market fit", "Weekly traction review"] },
      { id: "execution-system", kind: "checklist", title: "Execution System", items: [
        { text: "Define the painful moment", detail: "Write the exact event that makes a buyer search for a solution." },
        { text: "Build a proof asset", detail: "Create one demo, teardown, or case study that makes the promise concrete." },
        { text: "Run three channels", detail: "Test outbound, community, and content with the same message." },
        { text: "Review signal weekly", detail: "Keep what produces replies, demos, referrals, or qualified waitlist demand." },
      ] },
      { id: "frameworks", kind: "concepts", title: "Playbook Frameworks", clusters: [
        { name: "ICP Wedge", description: "Start with the narrowest group that feels the pain intensely.", ideas: ["Role", "Trigger", "Budget owner"] },
        { name: "Proof Loop", description: "Every claim should create or reuse evidence.", ideas: ["Demo", "Before/after", "Customer quote"] },
        { name: "Distribution Cadence", description: "Consistent weekly shots beat sporadic launches.", ideas: ["Ship", "Measure", "Refine"] },
      ] },
    ],
  },
  {
    id: "productivity-system",
    title: "Atomic Habits - The 1% Rule Explained",
    summary: "How small daily changes compound into massive results over time.",
    contentType: "system",
    metadata: { source: "Extracted from knowledge carousel", tags: ["Productivity", "Psychology"], date: "2 days ago", status: "complete", confidence: 0.96 },
    slides: slideSet("violet", 8),
    blocks: [
      { id: "system-thesis", kind: "summary", title: "System Thesis", body: "Small daily changes compound when they are attached to identity, supported by environment design, and reviewed as part of a repeatable system.", highlights: ["Identity before outcomes", "Environment beats willpower", "Never miss twice"] },
      { id: "habit-system", kind: "checklist", title: "Habit Operating System", items: [
        { text: "Choose one 1% behavior", detail: "Make the first action small enough to complete on a bad day." },
        { text: "Attach it to an anchor", detail: "Place the habit immediately after an existing routine." },
        { text: "Change one cue", detail: "Make the desired behavior visible and the competing behavior harder." },
        { text: "Review the streak weekly", detail: "Look for friction, not moral failure." },
      ] },
      { id: "concept-clusters", kind: "concepts", title: "Concept Clusters", clusters: [
        { name: "Compound Habits", description: "Small behaviors create nonlinear outcomes when repeated over time.", ideas: ["1% better", "Latent potential", "Accumulation"] },
        { name: "Identity-Based Change", description: "Durable behavior follows from becoming the type of person who acts that way.", ideas: ["Belief", "Evidence", "Repetition"] },
        { name: "Environment Design", description: "The system should make good actions obvious and bad actions inconvenient.", ideas: ["Cue", "Friction", "Default"] },
      ] },
    ],
  },
  {
    id: "ml-learning-path",
    title: "Machine Learning Learning Path",
    summary: "A staged route from fundamentals to deployable machine learning projects.",
    contentType: "roadmap",
    metadata: { source: "Extracted from learning carousel", tags: ["Learning", "Growth"], date: "1 month ago", status: "complete", confidence: 0.92 },
    slides: slideSet("rose", 7),
    blocks: [
      { id: "path-overview", kind: "summary", title: "Learning Strategy", body: "The path is not a reading list. It is a sequence of capability milestones: math intuition, model training, evaluation, deployment, and portfolio proof." },
      { id: "learning-roadmap", kind: "roadmap", title: "Learning Roadmap", stages: [
        { stage: "Math Intuition", description: "Learn vectors, gradients, probability, and loss functions through visual examples.", milestone: "Explain gradient descent", duration: "2 weeks", ...pathColors[0] },
        { stage: "Core Models", description: "Train regression, trees, and neural networks on small datasets.", milestone: "Three notebooks", duration: "3 weeks", ...pathColors[1] },
        { stage: "Evaluation", description: "Measure error, leakage, baselines, and model tradeoffs.", milestone: "Model report", duration: "1 week", ...pathColors[2] },
        { stage: "Deployment", description: "Serve one model with a small API and monitoring surface.", milestone: "Live project", duration: "2 weeks", ...pathColors[3] },
      ] },
      { id: "checkpoints", kind: "checklist", title: "Portfolio Checkpoints", items: [
        { text: "Create a clean experiment log", detail: "Track dataset, features, baseline, metric, and result." },
        { text: "Write a model card", detail: "Explain intended use, limitations, and evaluation results." },
        { text: "Ship a small demo", detail: "Make the model accessible through a simple app or API." },
      ] },
    ],
  },
];

const createdExtractions = new Map<string, Extraction>();

const listExtraction = ({ id, title, summary, contentType, metadata }: Extraction) => ({
  id,
  title,
  summary,
  contentType,
  tags: metadata.tags,
  date: metadata.date,
  status: metadata.status,
});

export function getAllExtractions() {
  return [...createdExtractions.values(), ...extractions].map(listExtraction);
}

export function getExtractionById(id: string): Extraction | undefined {
  if (id === "demo") return getExtractionById("productivity-system");
  return createdExtractions.get(id) ?? extractions.find((extraction) => extraction.id === id);
}

export function createMockExtraction(input: CreateExtractionInput) {
  const template =
    input.sourceType === "instagram"
      ? getExtractionById("ai-roadmap")
      : getExtractionById("productivity-system");

  if (!template) {
    throw new Error("Mock extraction template is missing.");
  }

  const id = `mock-${Date.now().toString(36)}`;
  const extraction: Extraction = {
    ...template,
    id,
    title:
      input.sourceType === "instagram"
        ? "AI Roadmap from Instagram Carousel"
        : "Adaptive Knowledge Extraction",
    summary:
      input.sourceType === "instagram"
        ? "A newly created mock extraction job from an Instagram source."
        : "A newly created mock extraction job from uploaded carousel slides.",
    metadata: {
      ...template.metadata,
      source:
        input.sourceType === "instagram"
          ? input.instagramUrl || "Instagram carousel URL"
          : `${input.uploadedFiles?.length ?? 0} uploaded carousel files`,
      date: "Just now",
      status: "complete",
    },
  };

  createdExtractions.set(id, extraction);

  return {
    id,
    status: "queued" as const,
    extraction,
    lifecycle: ["queued", "processing", "analyzing", "structuring", "complete"] as const,
  };
}
