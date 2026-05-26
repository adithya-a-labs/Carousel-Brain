# CarouselBrain Phase 2 Database Schema Design

## Architecture Overview

CarouselBrain Phase 2 requires a minimal, composable database for:
- **Extraction persistence**: Store uploaded carousel data with adaptive block rendering
- **Image storage**: Supabase Storage bucket for carousel slide images  
- **Lifecycle tracking**: Monitor extraction status through processing pipeline
- **Dashboard queries**: Efficient filtering and listing

**Design Philosophy:**
- No hallucinated enterprise infrastructure
- Only what's needed for current scope (no OCR, Groq, vector DB, auth, semantic search, queues)
- JSONB for polymorphic adaptive blocks (no premature normalization)
- Simple, flat schema that scales to near-future phases

---

## Table Schema

### 1. `extractions` — Core extraction records

**Purpose:** Persist uploaded carousel extractions with full payload and metadata.

```sql
CREATE TABLE extractions (
  -- Identity
  id TEXT PRIMARY KEY,
  
  -- Core content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'roadmap', 'resources', 'tutorial', 'playbook', 'conceptual', 'system'
  )),
  
  -- Lifecycle
  status TEXT NOT NULL CHECK (status IN (
    'queued', 'uploading', 'processing', 'analyzing', 'structuring', 'complete', 'failed'
  )) DEFAULT 'queued',
  
  -- Source metadata
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'instagram')),
  instagram_url TEXT,
  
  -- Adaptive structure (full extraction payload: slides + blocks)
  payload JSONB NOT NULL,
  
  -- Metadata (tags, confidence, source attribution, extraction notes)
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Storage references
  slide_count INTEGER NOT NULL DEFAULT 0,
  storage_paths TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Soft delete support (for Phase 3 auth + bulk operations)
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common queries
CREATE INDEX idx_extractions_status_created 
  ON extractions(status, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_created_desc 
  ON extractions(created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_source_type 
  ON extractions(source_type) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_content_type 
  ON extractions(content_type) 
  WHERE deleted_at IS NULL;

-- JSONB index for tag filtering in metadata
CREATE INDEX idx_extractions_metadata_tags 
  ON extractions USING GIN (metadata->'tags');

-- Enable RLS for future auth phase (columns defined, policy added in Phase 3)
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
```

**Column Details:**

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | TEXT | Primary key | UUID or nanoid format, set by application |
| `title` | TEXT | Extraction title | e.g., "AI Roadmap for Knowledge Work" |
| `summary` | TEXT | 1-2 sentence summary | Displayed in dashboard cards |
| `content_type` | ENUM | Classification | Used for rendering templates & filtering |
| `status` | ENUM | Lifecycle state | Tracks processing progress |
| `source_type` | ENUM | Origin | "upload" or "instagram" for filtering |
| `instagram_url` | TEXT | Instagram link | Nullable, only for instagram sourced |
| `payload` | JSONB | Full extraction | Complete Extraction object: {id, title, summary, contentType, slides[], blocks[]} |
| `metadata` | JSONB | Tags, confidence, notes | {source, tags[], date, confidence, extractionType, sourceNotes} |
| `slide_count` | INT | Number of slides | Cached from payload.slides.length for dashboard |
| `storage_paths` | TEXT[] | S3/Supabase paths | Array of slide image paths for cleanup |
| `created_at` | TIMESTAMP | Created date | For listing/sorting |
| `updated_at` | TIMESTAMP | Last modified | For tracking changes |
| `deleted_at` | TIMESTAMP | Soft delete | NULL = active, set on deletion |

**Payload Structure (JSONB):**
```json
{
  "id": "ai-roadmap-001",
  "title": "AI Roadmap for Knowledge Work",
  "summary": "A practical sequence...",
  "contentType": "roadmap",
  "slides": [
    {
      "id": 1,
      "gradient": "linear-gradient(145deg, ...)",
      "accent": "rgba(255,255,255,0.13)",
      "heading": "Foundation",
      "lines": [3, 4, 2],
      "caption": "Extracted signal from source..."
    }
  ],
  "blocks": [
    {
      "id": "orientation",
      "kind": "summary",
      "title": "Strategic Orientation",
      "eyebrow": "Roadmap thesis",
      "body": "AI adoption works best...",
      "highlights": ["Workflow-first adoption", ...]
    },
    {
      "id": "roadmap",
      "kind": "roadmap",
      "title": "Adoption Roadmap",
      "stages": [
        {
          "stage": "Map Workflows",
          "description": "Identify repeated...",
          "milestone": "Top 5 leverage map",
          "duration": "Week 1",
          "color": "hsl(...)",
          "bg": "hsl(...)",
          "border": "hsl(...)"
        }
      ]
    }
  ]
}
```

**Metadata Structure (JSONB):**
```json
{
  "source": "Extracted from strategy carousel",
  "tags": ["Learning", "Career", "Systems"],
  "date": "4 days ago",
  "confidence": 0.94,
  "extractionType": "manual_carousel",
  "sourceNotes": "Instagram carousel @username"
}
```

---

## Storage Bucket Structure

**Bucket:** `carouselbrain` (public: false)

**Path Convention:**
```
extractions/
├── {extractionId}/
│   ├── slides/
│   │   ├── 01-carousel-slide-1.jpg
│   │   ├── 02-carousel-slide-2.png
│   │   └── ...
│   ├── metadata.json  (optional, for future indexing)
│   └── thumbnail.jpg  (optional, future caching)
```

**Naming Rules:**
- Slides: `{index:2d}-{sanitized-filename}`
- Sanitization: Replace non-alphanumeric with `-`, max 255 chars
- Types: PNG, JPG, WEBP only
- Max per extraction: 10 slides (enforced in app)

---

## Access Patterns & Query Examples

### 1. List Recent Extractions (Dashboard)
```sql
SELECT id, title, summary, content_type, status, created_at,
       metadata->'tags' as tags,
       jsonb_array_length(payload->'slides') as slide_count
FROM extractions
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### 2. Get Extraction by ID (ResultPage)
```sql
SELECT * FROM extractions
WHERE id = $1 AND deleted_at IS NULL;
```

### 3. Filter by Content Type
```sql
SELECT id, title, summary, content_type, created_at
FROM extractions
WHERE content_type = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 4. Filter by Tag (Search)
```sql
SELECT id, title, summary, created_at
FROM extractions
WHERE metadata->'tags' ? $1 AND deleted_at IS NULL
ORDER BY created_at DESC;
```
Note: `?` operator checks if array contains string

### 5. Search by Title/Summary
```sql
SELECT id, title, summary, created_at
FROM extractions
WHERE (title ILIKE $1 OR summary ILIKE $1) AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 6. Count by Status
```sql
SELECT status, COUNT(*) as count
FROM extractions
WHERE deleted_at IS NULL
GROUP BY status;
```

### 7. Lifecycle State Transitions
```sql
UPDATE extractions
SET status = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;
```

---

## JSONB Field Usage Rationale

### Why JSONB for `payload`?

1. **Polymorphic blocks**: No single schema fits all block kinds (summary, roadmap, checklist, concepts, etc.)
2. **Adaptive rendering**: Frontend renders blocks based on `kind` field, structure varies
3. **Future extensibility**: New block types can be added without schema migration
4. **No premature normalization**: Blocks don't need individual rows until Phase 4+ (semantic search, advanced analytics)

### When to Normalize (Future Phases)

**Phase 3+:** If you need:
- Full-text search across block content
- Block-level permissions
- Block versioning/audit trail
- Reusable block library

Then create:
```sql
CREATE TABLE extraction_blocks (
  id UUID PRIMARY KEY,
  extraction_id TEXT REFERENCES extractions(id),
  block_kind TEXT,
  block_data JSONB,
  created_at TIMESTAMP
);
```

**Phase 4+:** If you add embeddings/semantic search:
```sql
CREATE TABLE block_embeddings (
  id UUID PRIMARY KEY,
  block_id UUID REFERENCES extraction_blocks(id),
  embedding vector(1536),  -- pgvector extension
  created_at TIMESTAMP
);
```

---

## Normalization vs Flexible Fields

### ✅ Normalized (Strict Columns)
- `id`, `title`, `summary` → Direct columns (all extractions have these)
- `content_type`, `status`, `source_type` → ENUM columns (high-cardinality filtering)
- `created_at`, `updated_at` → Timestamps (always needed)

### ⚠️ Semi-Flexible (JSONB)
- `metadata` → Tags, confidence, source (varies by extraction)
- `payload` → Full extraction object (avoids multi-table joins for ResultPage)

### ❌ Not Needed Yet
- `extraction_blocks` table (blocks are part of payload)
- `slides` table (minimal structure, quick rendering from JSONB)
- `tags` lookup table (no normalized tag system yet)

---

## Scalability & Future Phases

### Phase 2 (Current)
- Single `extractions` table with JSONB payload
- Supabase Storage for images
- Simple list/get queries

### Phase 3 (Auth + Multi-User)
Add:
```sql
ALTER TABLE extractions ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_extractions_user_created ON extractions(user_id, created_at DESC);
```
Add RLS policies (stub already in place).

### Phase 4 (Semantic Search + OCR)
Add:
```sql
CREATE TABLE block_embeddings (
  id UUID PRIMARY KEY,
  block_kind TEXT,
  block_content_summary TEXT,
  embedding vector(1536),
  created_at TIMESTAMP
);
CREATE INDEX idx_embeddings_search ON block_embeddings USING ivfflat(embedding);
```

### Phase 5 (Collaborative Editing)
Add versioning:
```sql
CREATE TABLE extraction_versions (
  id UUID PRIMARY KEY,
  extraction_id TEXT REFERENCES extractions(id),
  payload JSONB,
  changed_by UUID,
  created_at TIMESTAMP
);
```

---

## Indexes Summary

| Index | Columns | Use Case | Notes |
|-------|---------|----------|-------|
| `idx_extractions_status_created` | (status, created_at DESC) | Dashboard list, filter by status | Partial: deleted_at IS NULL |
| `idx_extractions_created_desc` | (created_at DESC) | Recent extractions | Partial: deleted_at IS NULL |
| `idx_extractions_source_type` | (source_type) | Filter upload vs instagram | Partial: deleted_at IS NULL |
| `idx_extractions_content_type` | (content_type) | Filter by knowledge type | Partial: deleted_at IS NULL |
| `idx_extractions_metadata_tags` | metadata->'tags' (GIN) | Tag-based filtering | Supports `metadata->'tags' ? 'tag'` |

**No index needed for:**
- `id` (primary key auto-indexed)
- Search queries (can use simple ILIKE initially, add full-text search in Phase 4)

---

## Storage Bucket Configuration

```typescript
// Supabase Storage Configuration
const bucket = {
  id: "carouselbrain",
  name: "carouselbrain",
  public: false,  // Private bucket, serve via signed URLs
  file_size_limit: 52428800,  // 50MB per file
  allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
};
```

**Lifecycle Rules (Optional, add in Phase 3+):**
```sql
-- Auto-delete failed extraction files after 7 days
-- (implement via cron job or cleanup service)
DELETE FROM storage.objects 
WHERE bucket_id = 'carouselbrain'
  AND name LIKE 'extractions/%'
  AND created_at < NOW() - INTERVAL '7 days'
  AND EXISTS (
    SELECT 1 FROM extractions e 
    WHERE e.status = 'failed' 
    AND e.storage_paths @> ARRAY[storage.objects.name]
  );
```

---

## SQL Migration Script (Ready for Supabase)

```sql
-- Phase 2 Schema for CarouselBrain
-- Deployed to Supabase PostgreSQL

-- Enable extensions (if needed for future phases)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE extraction_content_type AS ENUM (
  'roadmap', 'resources', 'tutorial', 'playbook', 'conceptual', 'system'
);

CREATE TYPE extraction_status AS ENUM (
  'queued', 'uploading', 'processing', 'analyzing', 'structuring', 'complete', 'failed'
);

CREATE TYPE extraction_source_type AS ENUM (
  'upload', 'instagram'
);

-- Main extractions table
CREATE TABLE extractions (
  id TEXT PRIMARY KEY,
  
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content_type extraction_content_type NOT NULL,
  
  status extraction_status NOT NULL DEFAULT 'queued',
  
  source_type extraction_source_type NOT NULL,
  instagram_url TEXT,
  
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  slide_count INTEGER NOT NULL DEFAULT 0,
  storage_paths TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT instagram_url_source_check CHECK (
    (source_type = 'instagram' AND instagram_url IS NOT NULL) OR
    source_type = 'upload'
  )
);

-- Indexes
CREATE INDEX idx_extractions_status_created 
  ON extractions(status, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_created_desc 
  ON extractions(created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_source_type 
  ON extractions(source_type) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_content_type 
  ON extractions(content_type) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_extractions_metadata_tags 
  ON extractions USING GIN (metadata->'tags');

-- Enable RLS (policies added in Phase 3)
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_extractions_updated_at
BEFORE UPDATE ON extractions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Grant default permissions (Phase 2: service role only)
GRANT ALL PRIVILEGES ON extractions TO postgres, authenticated, anon;
```

---

## Implementation Checklist

### ✅ Phase 2 Setup (This Sprint)

- [ ] Run migration SQL in Supabase console
- [ ] Configure storage bucket `carouselbrain`
- [ ] Update `extraction-records.ts` service to use Supabase table
- [ ] Add index creation for dashboard queries
- [ ] Test extraction save/load flow
- [ ] Verify storage paths on upload
- [ ] Add soft-delete handling in dashboard filters

### ⏳ Phase 3 (Auth & Multi-User)
- [ ] Add `user_id` column and foreign key
- [ ] Create RLS policies (stub template ready)
- [ ] Add user_id to indexes for performance

### 🚀 Phase 4+ (Semantic Search, OCR)
- [ ] Create `block_embeddings` table
- [ ] Add pgvector extension
- [ ] Implement text-to-embedding pipeline
- [ ] Create semantic search endpoint

---

## Monitoring & Maintenance

### Key Metrics to Track (Phase 3+)
```sql
-- Extraction distribution by content type
SELECT content_type, COUNT(*) as count 
FROM extractions WHERE deleted_at IS NULL 
GROUP BY content_type;

-- Average extraction size (JSONB payload)
SELECT 
  AVG(pg_column_size(payload)) as avg_bytes,
  MAX(pg_column_size(payload)) as max_bytes
FROM extractions;

-- Storage usage
SELECT 
  SUM(pg_column_size(storage_paths)) as total_paths_bytes,
  COUNT(*) as total_files
FROM extractions
WHERE storage_paths != '{}';

-- Extraction success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM extractions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

---

## Design Decisions & Trade-offs

### Decision: JSONB Payload vs. Normalized Blocks Table

**Choice:** JSONB Payload

**Rationale:**
- Blocks are polymorphic (7 different structures)
- No queries on individual blocks yet
- Full extraction needed for ResultPage rendering
- Reduces join complexity for simple get-by-id

**Trade-off:**
- ✅ Simpler schema, fewer migrations
- ✅ Faster ResultPage queries (single row fetch)
- ❌ Can't easily query "all summaries" across extractions (Phase 4 fix)
- ❌ Block versioning harder (Phase 5 feature)

**Revert Decision If:**
- Phase 4 requires full-text search across blocks
- Phase 5 needs block-level audit trail

---

### Decision: Array Type for storage_paths vs. JSON

**Choice:** TEXT[] (PostgreSQL array type)

**Rationale:**
- Native type, better performance than JSON array
- Supports `@>` containment operator for cleanup queries
- Simpler to use in application code

**Alternative Considered:** Store as JSONB array
- ❌ Slower for large file lists
- ❌ More verbose queries

---

### Decision: Soft Deletes (deleted_at) vs. Hard Deletes

**Choice:** Soft Deletes

**Rationale:**
- Preserves storage references for cleanup
- Enables user recovery workflows (Phase 3)
- Maintains audit trail for compliance
- Easier than hard delete + cascade

**Indexes use `WHERE deleted_at IS NULL`** to exclude deleted rows from most queries.

---

## Appendix: Example Application Code

### Service: Save Extraction
```typescript
// services/extraction-records.ts
export async function saveExtractionRecord(input: ExtractionRecordInput) {
  const config = requireSupabaseConfig();
  
  const response = await fetch(`${config.url}/rest/v1/extractions`, {
    method: "POST",
    headers: supabaseHeaders(config, "application/json"),
    body: JSON.stringify({
      id: input.id,
      title: input.metadata.title,
      summary: input.metadata.summary,
      content_type: input.contentType,
      status: input.status,
      source_type: input.sourceType,
      instagram_url: input.instagramUrl ?? null,
      payload: input.payload,  // Full extraction object
      metadata: {
        source: input.metadata.source,
        tags: input.metadata.tags,
        confidence: input.metadata.confidence,
        extractionType: input.extractionType,
      },
      slide_count: input.slideCount,
      storage_paths: input.storagePaths,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save extraction (${response.status})`);
  }
  
  return await response.json();
}
```

### Query: Get Extraction by ID
```typescript
export async function getExtractionById(id: string) {
  const config = requireSupabaseConfig();
  
  const response = await fetch(
    `${config.url}/rest/v1/extractions?id=eq.${id}`,
    { headers: supabaseHeaders(config) }
  );
  
  const data = await response.json();
  if (!data.length) return null;
  
  // Transform camelCase to match frontend types
  return transformDatabaseRecord(data[0]);
}
```

### Query: List Extractions (Dashboard)
```typescript
export async function listExtractions(limit = 20, offset = 0) {
  const config = requireSupabaseConfig();
  
  const response = await fetch(
    `${config.url}/rest/v1/extractions?` +
    `select=id,title,summary,content_type,status,created_at,metadata,slide_count` +
    `&order=created_at.desc` +
    `&limit=${limit}&offset=${offset}`,
    { headers: supabaseHeaders(config) }
  );
  
  return response.json();
}
```

---

**Ready to deploy. No speculative infrastructure. Clean, minimal, scalable foundation for Phase 2 and beyond.**
