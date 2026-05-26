export type ExtractionContentType =
  | "roadmap"
  | "resources"
  | "tutorial"
  | "playbook"
  | "conceptual"
  | "system";

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
}

export interface ExtractionBlockBase {
  id: string;
  title: string;
  eyebrow?: string;
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
  }>;
}

export interface ConceptBlock extends ExtractionBlockBase {
  kind: "concepts";
  clusters: Array<{
    name: string;
    description: string;
    ideas?: string[];
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

export type ExtractionBlock =
  | SummaryBlock
  | ChecklistBlock
  | ConceptBlock
  | RoadmapBlock
  | TimelineBlock
  | ResourceBlock
  | RepoBlock;

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
  tags: string[];
  date: string;
  status: ExtractionStatus;
}
