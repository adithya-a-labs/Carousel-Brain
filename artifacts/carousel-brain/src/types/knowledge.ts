export type ExtractionContentType =
  | "roadmap"
  | "resources"
  | "opportunities"
  | "tutorial"
  | "playbook"
  | "conceptual"
  | "system"
  | "unknown";

export type LibraryContentType =
  | "resources"
  | "opportunities"
  | "playbook"
  | "roadmap"
  | "catalog"
  | "prompts";

export type ExtractionStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "analyzing"
  | "structuring"
  | "complete"
  | "failed";

export interface Slide {
  id: number;
  gradient: string;
  accent: string;
  heading: string;
  lines: number[];
  caption: string;
}

export interface ExtractionMetadata {
  source: string;
  tags: string[];
  date: string;
  status: ExtractionStatus;
  confidence?: number;
  sourceType?: "upload" | "instagram" | "mock";
  instagramUrl?: string;
  slideCount?: number;
  storagePaths?: string[];
  createdAt?: string;
  updatedAt?: string;
  extractionType?: string;
  sourceUrl?: string;
  username?: string;
  caption?: string;
  provider?: string;
  actorId?: string;
  shortcode?: string;
}

export interface ExtractionBlockBase {
  id: string;
  title: string;
  eyebrow?: string;
  type?: string;
  sourceSlideIndex?: number | null;
  evidenceText?: string | null;
  trust?: {
    confidence?: number;
    evidenceCount: number;
    grounded: boolean;
  };
}

export interface SummaryBlock extends ExtractionBlockBase {
  kind: "summary";
  body: string;
  highlights?: string[];
}

export interface ChecklistBlock extends ExtractionBlockBase {
  kind: "checklist";
  items: Array<{
    text: string;
    detail?: string;
    promptText?: string;
    purpose?: string;
    expectedOutput?: string;
    bestUsedFor?: string;
    variables?: string[];
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
}

export interface ConceptBlock extends ExtractionBlockBase {
  kind: "concepts";
  clusters: Array<{
    name: string;
    description: string;
    ideas?: string[];
    whyItMatters?: string;
    relatedResources?: string[];
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
  }>;
}

export interface RoadmapBlock extends ExtractionBlockBase {
  kind: "roadmap";
  stages: Array<{
    stage: string;
    description: string;
    milestone?: string;
    duration?: string;
    color: string;
    bg: string;
    border: string;
  }>;
}

export interface TimelineBlock extends ExtractionBlockBase {
  kind: "timeline";
  events: Array<{
    label: string;
    description: string;
    timeframe?: string;
  }>;
}

export interface ResourceBlock extends ExtractionBlockBase {
  kind: "resources";
  groups: Array<{
    category: string;
    items: Array<{
      title: string;
      description?: string;
      type: string;
      link: string;
      url?: string | null;
      category?: string;
      reason?: string;
      bestFor?: string;
      difficulty?: string;
      linkStatus?: "explicit" | "incomplete" | "missing" | "uncertain";
      sourceSlideIndex?: number | null;
      evidenceText?: string | null;
      organization?: string;
      deadline?: string;
      stipend?: string;
      location?: string;
      duration?: string;
      focus?: string;
      eligibility?: string;
      format?: string;
      urgency?: string;
      applyUrl?: string | null;
      notes?: string;
      color: string;
      colorBg: string;
    }>;
  }>;
}

export interface RepoBlock extends ExtractionBlockBase {
  kind: "repoCollection";
  repos: Array<{
    name: string;
    description: string;
    language?: string;
    stars?: string;
    link: string;
    color: string;
    colorBg: string;
  }>;
}

export interface CatalogBlock extends ExtractionBlockBase {
  kind: "catalog_grid";
  catalogType?: "project_ideas" | "startup_ideas" | "resources" | "tools" | "examples" | "unknown";
  items: Array<{
    title: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
    techStack?: string[] | null;
    sourceSlideIndex?: number | null;
    evidenceText?: string | null;
    color?: string;
    colorBg?: string;
  }>;
}

export type ExtractionBlock =
  | SummaryBlock
  | ChecklistBlock
  | ConceptBlock
  | RoadmapBlock
  | TimelineBlock
  | ResourceBlock
  | RepoBlock
  | CatalogBlock;

export type CanonicalBlockType =
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

export interface CanonicalExtractionPayload {
  version: "v1";
  generatedFrom: "ai_raw_output";
  contentType: ExtractionContentType;
  title: string;
  summary: string;
  confidence?: number;
  blocks: ExtractionBlock[];
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
  metadata?: Record<string, unknown>;
}

export interface Extraction {
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
  metadata: ExtractionMetadata;
  slides: Slide[];
  blocks: ExtractionBlock[];
}

export interface DashboardExtraction {
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
  libraryType?: LibraryContentType;
  tags: string[];
  date: string;
  status: ExtractionStatus;
  createdAt?: string;
  slideCount?: number;
  itemCount?: number;
  blockKinds?: string[];
  counts?: {
    resources?: number;
    opportunities?: number;
    actionSteps?: number;
    concepts?: number;
    roadmapStages?: number;
    promptTemplates?: number;
    catalogItems?: number;
  };
}
