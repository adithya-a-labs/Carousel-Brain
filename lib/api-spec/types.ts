// CarouselBrain Phase 2: TypeScript Types for Database Layer

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * APPLICATION TYPES (Frontend & Backend)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Content classification
export type ExtractionContentType =
  | "roadmap"
  | "resources"
  | "opportunities"
  | "tutorial"
  | "playbook"
  | "conceptual"
  | "system"
  | "unknown";

// Processing lifecycle states
export type ExtractionStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "analyzing"
  | "structuring"
  | "complete"
  | "failed";

// Data source
export type ExtractionSourceType = "upload" | "instagram" | "mock";

/**
 * Slide object for carousel visualization
 */
export interface Slide {
  id: number;
  gradient: string;           // CSS linear-gradient
  accent: string;             // CSS color for decorations
  heading: string;            // Main heading
  lines: number[];            // Array of line counts for mock content
  caption: string;            // Description/caption
}

/**
 * Extraction metadata (tagged, attributed)
 */
export interface ExtractionMetadata {
  source: string;             // Source attribution ("Extracted from strategy carousel")
  tags: string[];             // Knowledge tags (["Learning", "Systems", "Career"])
  date: string;               // Display date ("4 days ago")
  status: ExtractionStatus;   // Current lifecycle state
  confidence?: number;        // Extraction confidence (0-1)
  sourceType?: ExtractionSourceType;
  instagramUrl?: string;      // If sourced from Instagram
  slideCount?: number;        // Number of carousel slides
  storagePaths?: string[];    // S3/Supabase storage paths for slides
  createdAt?: string;         // ISO timestamp
  updatedAt?: string;         // ISO timestamp
  extractionType?: string;    // Extraction method/type
}

/**
 * Adaptive block base interface
 */
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

export interface LinkEnrichmentFields {
  enrichedUrl?: string | null;
  enrichedLinkLabel?: string | null;
  enrichmentConfidence?: number | null;
  enrichmentReason?: string | null;
  enrichmentSource?: "web_search" | string;
  enrichmentStatus?: "verified" | "suggested" | "not_found" | "skipped";
}

// ─────────────────────────────────────────────────────────────────────────────
// Block Types (Polymorphic)
// ─────────────────────────────────────────────────────────────────────────────

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
  } & LinkEnrichmentFields>;
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
    } & LinkEnrichmentFields>;
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
  } & LinkEnrichmentFields>;
}

// Union of all block types (discriminated by `kind`)
export type ExtractionBlock =
  | SummaryBlock
  | ChecklistBlock
  | ConceptBlock
  | RoadmapBlock
  | TimelineBlock
  | ResourceBlock
  | RepoBlock
  | CatalogBlock;

/**
 * Complete Extraction object (Full knowledge item with all blocks & slides)
 */
export interface Extraction {
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
  metadata: ExtractionMetadata;
  slides: Slide[];
  blocks: ExtractionBlock[];
}

/**
 * Simplified extraction for dashboard listing
 * (No full payload, just summary info)
 */
export interface DashboardExtraction {
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
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
  searchMatches?: Array<{
    id: string;
    kind:
      | "title"
      | "summary"
      | "resource"
      | "catalog"
      | "opportunity"
      | "prompt"
      | "action"
      | "concept"
      | "roadmap"
      | "note";
    label: string;
    text: string;
    sourceSlideIndex?: number | null;
  }>;
}

/**
 * Input type for creating new extraction
 */
export interface CreateExtractionInput {
  sourceType?: ExtractionSourceType;
  instagramUrl?: string;
  uploadedFiles?: UploadedFile[];
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE TYPES (Supabase schema)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Extraction record as stored in Supabase (snake_case columns)
 */
export interface StoredExtractionRecord {
  // Identifiers & core content
  id: string;
  title: string;
  summary: string;

  // Classification (enum columns)
  content_type: ExtractionContentType;
  status: ExtractionStatus;
  source_type: ExtractionSourceType;

  // Source tracking
  instagram_url: string | null;

  // Data payload (JSONB columns)
  payload: {
    id: string;
    title: string;
    summary: string;
    contentType: ExtractionContentType;
    slides: Slide[];
    blocks: ExtractionBlock[];
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
  };

  metadata: {
    source: string;
    tags: string[];
    date?: string;
    confidence?: number;
    extractionType?: string;
    sourceNotes?: string;
  };

  // Storage references
  slide_count: number;
  storage_paths: string[];

  // Lifecycle tracking
  created_at: string;     // ISO timestamp (UTC)
  updated_at: string;     // ISO timestamp (UTC)
  deleted_at: string | null;  // ISO timestamp (NULL = active)
}

/**
 * Input type for saving extraction to database
 * (Combines application data with Supabase-specific fields)
 */
export interface ExtractionRecordInput {
  // Core data
  id: string;
  title: string;
  summary: string;
  contentType: ExtractionContentType;
  status: ExtractionStatus;
  sourceType: ExtractionSourceType;
  instagramUrl?: string;

  // Extracted structure
  slideCount: number;
  storagePaths: string[];
  extractionType?: string;

  // Metadata
  metadata: {
    source: string;
    tags: string[];
    confidence?: number;
    sourceNotes?: string;
  };

  // Full payload
  payload: Extraction;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVICE LAYER TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Supabase API client configuration
 */
export interface SupabaseConfig {
  url: string;                    // https://xxx.supabase.co
  serviceRoleKey: string;         // Service role API key
  bucket: string;                 // Storage bucket name
}

/**
 * Upload file metadata (from multipart parsing)
 */
export interface ParsedUploadFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
  size: number;
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Batch operation results
 */
export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * API REQUEST/RESPONSE TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * POST /api/extractions - Create extraction
 */
export interface CreateExtractionRequest {
  sourceType: ExtractionSourceType;
  instagramUrl?: string;
  uploadedFiles?: UploadedFile[];
}

export interface CreateExtractionResponse {
  id: string;
  status: ExtractionStatus;
  lifecycle: {
    current: ExtractionStatus;
    transitions: ExtractionStatus[];
  };
  extraction: Extraction;
  createdAt: string;
}

/**
 * GET /api/extractions/:id - Get extraction by ID
 */
export interface GetExtractionResponse {
  data: Extraction;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/extractions - List extractions
 */
export interface ListExtractionsResponse {
  data: DashboardExtraction[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * PATCH /api/extractions/:id - Update extraction
 */
export interface UpdateExtractionRequest {
  status?: ExtractionStatus;
  metadata?: Partial<ExtractionMetadata>;
  title?: string;
  summary?: string;
}

export interface UpdateExtractionResponse {
  id: string;
  updated: boolean;
  updatedAt: string;
}

/**
 * DELETE /api/extractions/:id - Delete extraction (soft delete)
 */
export interface DeleteExtractionResponse {
  id: string;
  deleted: boolean;
  deletedAt: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILTER & QUERY TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Dashboard filter options
 */
export interface ExtractionFilter {
  status?: ExtractionStatus[];
  contentType?: ExtractionContentType[];
  sourceType?: ExtractionSourceType[];
  tags?: string[];
  search?: string;
  dateRange?: {
    from: string;  // ISO date
    to: string;    // ISO date
  };
}

/**
 * Query pagination
 */
export interface PaginationOptions {
  limit?: number;   // Default: 20, Max: 100
  offset?: number;  // Default: 0
}

/**
 * Query sort options
 */
export interface SortOptions {
  sortBy?: "created_at" | "updated_at" | "title" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Complete query options
 */
export interface QueryOptions extends PaginationOptions, SortOptions {
  filter?: ExtractionFilter;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TRANSFORMATION HELPERS
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Transform database record to application format
 */
export function transformDatabaseRecord(
  record: StoredExtractionRecord
): Extraction {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    contentType: record.content_type,
    metadata: {
      source: record.metadata.source,
      tags: record.metadata.tags,
      date: record.metadata.date || "",
      status: record.status,
      confidence: record.metadata.confidence,
      sourceType: record.source_type,
      instagramUrl: record.instagram_url ?? undefined,
      slideCount: record.slide_count,
      storagePaths: record.storage_paths,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      extractionType: record.metadata.extractionType,
    },
    slides: record.payload.slides,
    blocks: record.payload.blocks,
  };
}

/**
 * Transform application data to database format
 */
export function transformToDatabase(
  extraction: Extraction,
  sourceType: ExtractionSourceType,
  instagramUrl?: string,
  storagePaths: string[] = []
): StoredExtractionRecord {
  return {
    id: extraction.id,
    title: extraction.title,
    summary: extraction.summary,
    content_type: extraction.contentType,
    status: extraction.metadata.status,
    source_type: sourceType,
    instagram_url: instagramUrl ?? null,
    payload: {
      id: extraction.id,
      title: extraction.title,
      summary: extraction.summary,
      contentType: extraction.contentType,
      slides: extraction.slides,
      blocks: extraction.blocks,
    },
    metadata: {
      source: extraction.metadata.source,
      tags: extraction.metadata.tags,
      confidence: extraction.metadata.confidence,
      extractionType: extraction.metadata.extractionType,
    },
    slide_count: extraction.slides.length,
    storage_paths: storagePaths,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

/**
 * Create dashboard extraction from stored record
 */
export function toDashboardExtraction(
  record: StoredExtractionRecord
): DashboardExtraction {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    contentType: record.content_type,
    tags: record.metadata.tags,
    date: record.metadata.date || new Date(record.created_at).toLocaleDateString(),
    status: record.status,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TYPE GUARDS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function isSummaryBlock(block: ExtractionBlock): block is SummaryBlock {
  return block.kind === "summary";
}

export function isChecklistBlock(block: ExtractionBlock): block is ChecklistBlock {
  return block.kind === "checklist";
}

export function isConceptBlock(block: ExtractionBlock): block is ConceptBlock {
  return block.kind === "concepts";
}

export function isRoadmapBlock(block: ExtractionBlock): block is RoadmapBlock {
  return block.kind === "roadmap";
}

export function isTimelineBlock(block: ExtractionBlock): block is TimelineBlock {
  return block.kind === "timeline";
}

export function isResourceBlock(block: ExtractionBlock): block is ResourceBlock {
  return block.kind === "resources";
}

export function isRepoBlock(block: ExtractionBlock): block is RepoBlock {
  return block.kind === "repoCollection";
}

export function isCatalogBlock(block: ExtractionBlock): block is CatalogBlock {
  return block.kind === "catalog_grid";
}

export function isValidExtractionStatus(value: unknown): value is ExtractionStatus {
  const validStatuses: ExtractionStatus[] = [
    "queued",
    "uploading",
    "processing",
    "analyzing",
    "structuring",
    "complete",
    "failed",
  ];
  return validStatuses.includes(value as ExtractionStatus);
}

export function isValidContentType(value: unknown): value is ExtractionContentType {
  const validTypes: ExtractionContentType[] = [
    "roadmap",
    "resources",
    "opportunities",
    "tutorial",
    "playbook",
    "conceptual",
    "system",
    "unknown",
  ];
  return validTypes.includes(value as ExtractionContentType);
}

export function isValidSourceType(value: unknown): value is ExtractionSourceType {
  const validTypes: ExtractionSourceType[] = ["upload", "instagram", "mock"];
  return validTypes.includes(value as ExtractionSourceType);
}
