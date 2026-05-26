import type { Extraction, LearningPathStep, Resource, Slide } from "@/types/knowledge";

const habitSlides: Slide[] = [
  {
    id: 1,
    gradient: "linear-gradient(145deg, hsl(248 70% 42%), hsl(270 65% 52%))",
    accent: "rgba(255,255,255,0.15)",
    heading: "The 1% Rule",
    lines: [3, 4, 2],
    caption: "Small daily improvements compound into remarkable results.",
  },
  {
    id: 2,
    gradient: "linear-gradient(145deg, hsl(200 70% 38%), hsl(220 70% 50%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Compound Interest",
    lines: [4, 3, 3],
    caption: "37x better in one year - the math of consistent habits.",
  },
  {
    id: 3,
    gradient: "linear-gradient(145deg, hsl(270 60% 40%), hsl(300 55% 52%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Identity Change",
    lines: [3, 4, 2],
    caption: "The deepest layer of lasting behavior change.",
  },
  {
    id: 4,
    gradient: "linear-gradient(145deg, hsl(160 55% 32%), hsl(190 60% 44%))",
    accent: "rgba(255,255,255,0.14)",
    heading: "Systems vs Goals",
    lines: [4, 3, 3],
    caption: "Winners and losers have the same goals. Focus on systems.",
  },
  {
    id: 5,
    gradient: "linear-gradient(145deg, hsl(30 80% 40%), hsl(45 75% 52%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Environment Design",
    lines: [3, 3, 4],
    caption: "Your environment shapes your habits more than willpower.",
  },
  {
    id: 6,
    gradient: "linear-gradient(145deg, hsl(340 65% 40%), hsl(360 60% 52%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Two-Minute Rule",
    lines: [4, 2, 3],
    caption: "Make it so easy you cannot say no. Start impossibly small.",
  },
  {
    id: 7,
    gradient: "linear-gradient(145deg, hsl(220 65% 38%), hsl(240 65% 52%))",
    accent: "rgba(255,255,255,0.14)",
    heading: "Habit Stacking",
    lines: [3, 4, 2],
    caption: "Attach new habits to existing anchors in your routine.",
  },
  {
    id: 8,
    gradient: "linear-gradient(145deg, hsl(280 55% 38%), hsl(310 55% 52%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Never Miss Twice",
    lines: [2, 4, 3],
    caption: "Missing once is an accident. Missing twice is a new habit.",
  },
];

const roadmapSlides: Slide[] = [
  {
    id: 1,
    gradient: "linear-gradient(145deg, hsl(215 72% 34%), hsl(248 70% 52%))",
    accent: "rgba(255,255,255,0.14)",
    heading: "AI Strategy",
    lines: [4, 3, 2],
    caption: "Start with workflows, not tools.",
  },
  {
    id: 2,
    gradient: "linear-gradient(145deg, hsl(188 70% 32%), hsl(210 76% 48%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Use Case Stack",
    lines: [3, 4, 3],
    caption: "Classify ideas by leverage, risk, and data readiness.",
  },
  {
    id: 3,
    gradient: "linear-gradient(145deg, hsl(150 58% 30%), hsl(178 58% 42%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Data Contracts",
    lines: [4, 2, 4],
    caption: "Reliable AI starts with reliable context boundaries.",
  },
  {
    id: 4,
    gradient: "linear-gradient(145deg, hsl(32 84% 38%), hsl(48 78% 50%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Pilot Loop",
    lines: [3, 3, 4],
    caption: "Ship narrow pilots, measure lift, then widen adoption.",
  },
  {
    id: 5,
    gradient: "linear-gradient(145deg, hsl(330 64% 38%), hsl(358 62% 50%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Governance",
    lines: [4, 3, 3],
    caption: "Define review points before automation expands.",
  },
];

const deepWorkSlides: Slide[] = [
  {
    id: 1,
    gradient: "linear-gradient(145deg, hsl(200 70% 30%), hsl(220 76% 46%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Attention Budget",
    lines: [3, 4, 2],
    caption: "Deep work begins with protecting your best cognitive hours.",
  },
  {
    id: 2,
    gradient: "linear-gradient(145deg, hsl(258 62% 36%), hsl(282 58% 48%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Ritual Design",
    lines: [4, 3, 3],
    caption: "Repeatable cues make focus easier to enter.",
  },
  {
    id: 3,
    gradient: "linear-gradient(145deg, hsl(158 54% 31%), hsl(188 58% 42%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Shutdown",
    lines: [3, 3, 4],
    caption: "A clean end protects tomorrow's focus.",
  },
];

const defaultResources: Resource[] = [
  { title: "Source Notes", type: "Brief", color: "hsl(248 70% 58%)", colorBg: "hsl(248 70% 58% / 0.08)", link: "#" },
  { title: "Practice Template", type: "Template", color: "hsl(200 70% 50%)", colorBg: "hsl(200 70% 50% / 0.08)", link: "#" },
  { title: "Reflection Prompts", type: "Guide", color: "hsl(270 65% 55%)", colorBg: "hsl(270 65% 55% / 0.08)", link: "#" },
  { title: "Further Reading", type: "Library", color: "hsl(30 90% 55%)", colorBg: "hsl(30 90% 55% / 0.08)", link: "#" },
];

const defaultPath: LearningPathStep[] = [
  { stage: "Beginner", desc: "Builds a working vocabulary and identifies where the idea applies in daily decisions.", color: "hsl(200 70% 55%)", bg: "hsl(200 70% 55% / 0.08)", border: "hsl(200 70% 55% / 0.2)" },
  { stage: "Practitioner", desc: "Turns the core idea into a repeatable system with cues, constraints, and feedback.", color: "hsl(248 70% 58%)", bg: "hsl(248 70% 58% / 0.08)", border: "hsl(248 70% 58% / 0.2)" },
  { stage: "Expert", desc: "Applies the idea fluidly across contexts and improves the system through review.", color: "hsl(270 65% 55%)", bg: "hsl(270 65% 55% / 0.08)", border: "hsl(270 65% 55% / 0.2)" },
];

export const extractions: Extraction[] = [
  {
    id: "productivity-system",
    title: "Atomic Habits - The 1% Rule Explained",
    summary: "How small daily changes compound into massive results over time.",
    source: "Extracted from knowledge carousel",
    tags: ["Productivity", "Psychology"],
    date: "2 days ago",
    status: "Extracted",
    overview:
      "The core thesis is that small, incremental daily changes compound over time into meaningful transformation. People often overestimate a single defining moment and underestimate the value of a well-designed daily system.",
    insights: [
      { text: "Habits are the compound interest of self-improvement. Their effects multiply as you repeat them." },
      { text: "Goals define the desired result, but systems define the process that repeatedly creates progress." },
      { text: "Durable behavior change is identity change. A habit sticks when it becomes part of how you see yourself." },
      { text: "Environment design reduces reliance on willpower by making the desired behavior obvious and available." },
    ],
    actionSteps: [
      { text: "Identify one tiny habit you can improve by 1% today." },
      { text: "Audit your current daily system before setting another distant goal." },
      { text: "Reframe one goal into an identity statement: I am the type of person who does this." },
      { text: "Change one environmental cue so the next good action is easier to start." },
    ],
    concepts: [
      { name: "Compound Interest of Habits", desc: "A small positive change repeated over time creates nonlinear results. The same pattern works in reverse when small negative behaviors accumulate." },
      { name: "Plateau of Latent Potential", desc: "Early effort can feel invisible because progress is being stored until it crosses a visible threshold." },
      { name: "Identity-Based Habits", desc: "Outcomes are what you get, processes are what you do, and identity is what you believe. Lasting habits start at the identity layer." },
    ],
    resources: [
      { title: "Atomic Habits", type: "Book", color: "hsl(248 70% 58%)", colorBg: "hsl(248 70% 58% / 0.08)", link: "#" },
      { title: "Habit Tracker Template", type: "Template", color: "hsl(200 70% 50%)", colorBg: "hsl(200 70% 50% / 0.08)", link: "#" },
      { title: "James Clear Newsletter", type: "Newsletter", color: "hsl(270 65% 55%)", colorBg: "hsl(270 65% 55% / 0.08)", link: "#" },
      { title: "Weekly Review Prompts", type: "Guide", color: "hsl(30 90% 55%)", colorBg: "hsl(30 90% 55% / 0.08)", link: "#" },
    ],
    path: [
      { stage: "Beginner", desc: "Focuses on setting goals and trying to force behavior change through motivation.", color: "hsl(200 70% 55%)", bg: "hsl(200 70% 55% / 0.08)", border: "hsl(200 70% 55% / 0.2)" },
      { stage: "Practitioner", desc: "Shifts focus to systems and environment design so habits become easier to execute.", color: "hsl(248 70% 58%)", bg: "hsl(248 70% 58% / 0.08)", border: "hsl(248 70% 58% / 0.2)" },
      { stage: "Expert", desc: "Internalizes habits as identity until execution becomes natural and self-reinforcing.", color: "hsl(270 65% 55%)", bg: "hsl(270 65% 55% / 0.08)", border: "hsl(270 65% 55% / 0.2)" },
    ],
    slides: habitSlides,
  },
  {
    id: "ai-roadmap",
    title: "AI Roadmap for Knowledge Work",
    summary: "A practical sequence for turning AI experiments into durable operating leverage.",
    source: "Extracted from strategy carousel",
    tags: ["Learning", "Career", "Systems"],
    date: "4 days ago",
    status: "Extracted",
    overview:
      "This extraction frames AI adoption as a knowledge transformation system: choose valuable workflows, define the context AI needs, pilot with narrow success metrics, and only then scale the operating model.",
    insights: [
      { text: "The strongest AI opportunities start from repeated workflows, not from a list of available models." },
      { text: "Context quality is the main constraint. Teams need clear inputs, data boundaries, and review rules." },
      { text: "Pilots should measure a visible operational lift such as cycle time, accuracy, or decision latency." },
      { text: "Governance is a product design concern because unclear review points create adoption drag." },
    ],
    actionSteps: [
      { text: "List five recurring knowledge workflows and rank them by frequency and decision value." },
      { text: "Pick one workflow and write the exact context packet an AI assistant would need." },
      { text: "Define one pilot metric before building the first prototype." },
      { text: "Create a review checkpoint for outputs that affect customers, money, or policy." },
    ],
    concepts: [
      { name: "Workflow-First Adoption", desc: "AI creates leverage when it is attached to a recurring job with a clear before-and-after state." },
      { name: "Context Contract", desc: "A shared definition of the inputs, constraints, examples, and review expectations needed for reliable AI output." },
      { name: "Pilot Expansion Loop", desc: "A narrow use case proves lift, earns trust, and provides the evidence needed to scale into adjacent workflows." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: roadmapSlides,
  },
  {
    id: "deep-work",
    title: "The Art of Deep Work",
    summary: "Strategies to focus without distraction in a noisy world.",
    source: "Extracted from focus carousel",
    tags: ["Productivity", "Career"],
    date: "1 week ago",
    status: "Extracted",
    overview:
      "Deep work is the capacity to create high-value output by protecting attention, reducing switching costs, and building reliable rituals around cognitively demanding tasks.",
    insights: [
      { text: "Attention is a scarce input, so the highest-value work needs reserved time before the day fragments." },
      { text: "Focus improves when the start conditions are scripted: place, duration, objective, and shutdown rule." },
      { text: "Shallow work becomes dangerous when it controls the schedule instead of being contained by it." },
    ],
    actionSteps: [
      { text: "Block one 90-minute deep work session before opening reactive channels." },
      { text: "Write a clear finish line for the session before starting." },
      { text: "Batch low-value messages into two planned windows." },
    ],
    concepts: [
      { name: "Attention Residue", desc: "A piece of attention remains attached to the previous task after switching, lowering depth on the next task." },
      { name: "Focus Ritual", desc: "A repeatable setup that lowers friction and signals the brain that deep work is beginning." },
      { name: "Shutdown Complete", desc: "A deliberate end-of-day review that closes loops and protects recovery." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: deepWorkSlides,
  },
  {
    id: "mental-models",
    title: "Mental Models for Clear Thinking",
    summary: "Core frameworks to make better decisions in complex situations.",
    source: "Extracted from decision carousel",
    tags: ["Philosophy", "Learning"],
    date: "2 weeks ago",
    status: "Extracted",
    overview:
      "Mental models help compress complexity into useful frames. The goal is not to memorize frameworks, but to select the right lens for the decision in front of you.",
    insights: [
      { text: "A good model reduces noise without pretending the world is simpler than it is." },
      { text: "Inversion is powerful because avoiding obvious failure is often easier than designing perfection." },
      { text: "Second-order thinking asks what happens after the immediate outcome." },
    ],
    actionSteps: [
      { text: "Before one decision today, ask what would make this fail." },
      { text: "Write the second-order consequence of your preferred option." },
      { text: "Name the assumption that would change your decision if false." },
    ],
    concepts: [
      { name: "Inversion", desc: "Solve the problem backward by identifying what would guarantee failure and then avoiding it." },
      { name: "Second-Order Thinking", desc: "Look beyond the immediate result to the chain of reactions that follows." },
      { name: "Circle of Competence", desc: "Understand where your knowledge is strong enough to act and where you need outside expertise." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: roadmapSlides,
  },
  {
    id: "stoic-practices",
    title: "Stoic Philosophy: Daily Practices",
    summary: "Ancient wisdom applied to modern daily anxieties.",
    source: "Extracted from reflection carousel",
    tags: ["Philosophy", "Mindset"],
    date: "3 weeks ago",
    status: "Extracted",
    overview:
      "Stoic practice turns attention toward what can be controlled: judgment, action, and response. It is a practical operating system for steadier thinking under pressure.",
    insights: [
      { text: "Separate events from the interpretation you add to them." },
      { text: "Control is clearest at the level of attention, intention, and action." },
      { text: "Premeditation reduces shock by rehearsing difficulty before it arrives." },
    ],
    actionSteps: [
      { text: "Write down one concern and separate facts from interpretation." },
      { text: "Choose one response that remains fully within your control." },
      { text: "End the day with a short review of judgment, action, and restraint." },
    ],
    concepts: [
      { name: "Dichotomy of Control", desc: "Divide life into what is yours to influence and what is not, then invest energy accordingly." },
      { name: "Premeditatio Malorum", desc: "Briefly imagining obstacles can make real obstacles less destabilizing." },
      { name: "Virtue as Practice", desc: "Character is trained through repeated choices, not abstract belief." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: habitSlides,
  },
  {
    id: "second-brain",
    title: "Building a Second Brain - PARA Method",
    summary: "Organize your digital life for optimal creative output.",
    source: "Extracted from systems carousel",
    tags: ["Productivity", "Systems"],
    date: "1 month ago",
    status: "Extracted",
    overview:
      "The PARA method organizes information by actionability: projects, areas, resources, and archives. Its value is retrieval speed and creative reuse, not perfect filing.",
    insights: [
      { text: "Information is useful when it can reappear at the moment of action." },
      { text: "Projects deserve the most visible space because they create current outcomes." },
      { text: "Archiving reduces clutter without forcing premature deletion." },
    ],
    actionSteps: [
      { text: "Create four top-level spaces: Projects, Areas, Resources, and Archive." },
      { text: "Move current work into Projects before organizing reference material." },
      { text: "Schedule a weekly reset to archive stale project notes." },
    ],
    concepts: [
      { name: "PARA", desc: "A four-part structure that organizes information by how soon and how directly it supports action." },
      { name: "Progressive Summarization", desc: "Layered highlighting that makes notes easier to scan and reuse later." },
      { name: "Intermediate Packets", desc: "Small reusable units of work that can combine into larger creative outputs." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: roadmapSlides,
  },
  {
    id: "compound-learning",
    title: "How Compound Learning Works",
    summary: "The mathematics of consistent daily learning.",
    source: "Extracted from learning carousel",
    tags: ["Learning", "Growth"],
    date: "1 month ago",
    status: "Extracted",
    overview:
      "Compound learning turns small, repeated study into durable understanding by combining retrieval, spaced repetition, and deliberate application.",
    insights: [
      { text: "Learning compounds when ideas are repeatedly retrieved and connected to prior knowledge." },
      { text: "Short daily sessions beat occasional cramming because memory benefits from spacing." },
      { text: "Application reveals whether knowledge is usable or merely familiar." },
    ],
    actionSteps: [
      { text: "Choose one concept and retrieve it from memory before reviewing notes." },
      { text: "Schedule two spaced reviews this week." },
      { text: "Apply the idea in a small public or practical artifact." },
    ],
    concepts: [
      { name: "Spaced Repetition", desc: "Reviews are timed to occur as memory begins to fade, strengthening long-term retention." },
      { name: "Retrieval Practice", desc: "Trying to recall information builds memory more effectively than rereading." },
      { name: "Transfer", desc: "Knowledge becomes powerful when it can move from one context to another." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: deepWorkSlides,
  },
  {
    id: "feynman-technique",
    title: "The Feynman Technique",
    summary: "Learn anything deeply by explaining it simply.",
    source: "Extracted from study carousel",
    tags: ["Learning", "Productivity"],
    date: "2 months ago",
    status: "Extracted",
    overview:
      "The Feynman Technique tests understanding by forcing clarity. If you cannot explain an idea simply, you have found the next place to study.",
    insights: [
      { text: "Simple explanations expose hidden gaps faster than passive review." },
      { text: "Teaching language should remove jargon before it adds sophistication." },
      { text: "The loop is explain, find gaps, study, and explain again." },
    ],
    actionSteps: [
      { text: "Pick one concept and explain it in plain language in five sentences." },
      { text: "Circle any sentence that hides behind jargon." },
      { text: "Return to the source only for the gaps you found." },
    ],
    concepts: [
      { name: "Plain-Language Test", desc: "A concept is understood when it can be explained clearly without relying on specialized terms." },
      { name: "Gap Discovery", desc: "The act of explaining reveals missing links that rereading can hide." },
      { name: "Iterative Simplification", desc: "Each pass removes ambiguity and increases usable understanding." },
    ],
    resources: defaultResources,
    path: defaultPath,
    slides: habitSlides,
  },
];

export const extractionById = new Map(extractions.map((extraction) => [extraction.id, extraction]));

export const dashboardExtractions = extractions.map(({ id, title, summary, tags, date, status }) => ({
  id,
  title,
  summary,
  tags,
  date,
  status,
}));

export function getExtractionById(id: string | undefined): Extraction | undefined {
  if (!id) return undefined;
  if (id === "demo") return extractionById.get("productivity-system");
  return extractionById.get(id);
}
