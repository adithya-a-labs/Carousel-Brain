# Phase 2 Schema Implementation Guide

## Quick Start

### 1. Deploy Schema
```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Paste contents of migrations/001_phase2_schema.sql
# 4. Click "Run"
```

### 2. Create Storage Bucket
```bash
# In Supabase Dashboard:
# 1. Go to Storage
# 2. Click "New bucket"
# 3. Name: carouselbrain
# 4. Public: OFF
# 5. File size limit: 52,428,800 (50MB)
# 6. Allowed MIME types: image/png, image/jpeg, image/webp
```

### 3. Set Environment Variables
```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=carouselbrain
```

---

## Service Layer Implementation

### Update: `lib/api-server/src/services/extraction-records.ts`

**Current Status:** Working with memory storage

**Phase 2 Update:**

```typescript
import { getSupabaseConfig, supabaseHeaders } from "../lib/supabase";
import type { Extraction, ExtractionBlock, Slide } from "@/types/knowledge";

// Input type for saving extractions
type ExtractionRecordInput = {
  id: string;
  title: string;
  summary: string;
  contentType: "roadmap" | "resources" | "tutorial" | "playbook" | "conceptual" | "system";
  status: "queued" | "uploading" | "processing" | "analyzing" | "structuring" | "complete" | "failed";
  sourceType: "upload" | "instagram";
  instagramUrl?: string;
  slideCount: number;
  storagePaths: string[];
  extractionType?: string;
  metadata: {
    source: string;
    tags: string[];
    confidence?: number;
    sourceNotes?: string;
  };
  payload: {
    id: string;
    title: string;
    summary: string;
    contentType: string;
    slides: Slide[];
    blocks: ExtractionBlock[];
  };
};

// Database record (snake_case)
type StoredExtractionRecord = {
  id: string;
  title: string;
  summary: string;
  content_type: string;
  status: string;
  source_type: string;
  instagram_url: string | null;
  slide_count: number;
  storage_paths: string[];
  extraction_type: string | null;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// Fallback memory storage (for when Supabase is not configured)
const memoryRecords = new Map<string, StoredExtractionRecord>();

/**
 * Save extraction record to Supabase
 * Falls back to memory if not configured
 */
export async function saveExtractionRecord(input: ExtractionRecordInput) {
  const config = getSupabaseConfig();
  
  const record: StoredExtractionRecord = {
    id: input.id,
    title: input.title,
    summary: input.summary,
    content_type: input.contentType,
    status: input.status,
    source_type: input.sourceType,
    instagram_url: input.instagramUrl ?? null,
    slide_count: input.slideCount,
    storage_paths: input.storagePaths,
    extraction_type: input.extractionType ?? null,
    payload: input.payload,
    metadata: input.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  if (!config) {
    // Fallback: store in memory
    memoryRecords.set(record.id, record);
    return transformRecord(record);
  }

  try {
    const response = await fetch(`${config.url}/rest/v1/extractions`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(config, "application/json"),
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Failed to save extraction (${response.status})`);
    }

    const [saved] = (await response.json()) as StoredExtractionRecord[];
    return transformRecord(saved ?? record);
  } catch (error) {
    console.error("Error saving extraction:", error);
    // Fallback to memory on error
    memoryRecords.set(record.id, record);
    return transformRecord(record);
  }
}

/**
 * Get extraction by ID
 */
export async function getExtractionById(id: string): Promise<Extraction | null> {
  const config = getSupabaseConfig();

  if (!config) {
    const record = memoryRecords.get(id);
    return record ? transformRecord(record) : null;
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(id)}&deleted_at=is.null`,
      { headers: supabaseHeaders(config) }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch extraction (${response.status})`);
    }

    const records = (await response.json()) as StoredExtractionRecord[];
    return records.length > 0 ? transformRecord(records[0]) : null;
  } catch (error) {
    console.error("Error fetching extraction:", error);
    return null;
  }
}

/**
 * List extractions with pagination
 */
export async function listExtractions(limit = 20, offset = 0) {
  const config = getSupabaseConfig();

  if (!config) {
    // Memory fallback: return sorted list
    const records = Array.from(memoryRecords.values())
      .filter(r => !r.deleted_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);
    return records.map(transformRecord);
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/extractions?` +
      `select=id,title,summary,content_type,status,created_at,metadata,slide_count&` +
      `deleted_at=is.null&` +
      `order=created_at.desc&` +
      `limit=${limit}&offset=${offset}`,
      { headers: supabaseHeaders(config) }
    );

    if (!response.ok) {
      throw new Error(`Failed to list extractions (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing extractions:", error);
    return [];
  }
}

/**
 * Search extractions by title or summary
 */
export async function searchExtractions(query: string) {
  const config = getSupabaseConfig();
  const searchQuery = `%${query}%`;

  if (!config) {
    // Memory fallback
    return Array.from(memoryRecords.values())
      .filter(r => 
        !r.deleted_at && (
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.summary.toLowerCase().includes(query.toLowerCase())
        )
      )
      .map(transformRecord);
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/extractions?` +
      `select=id,title,summary,content_type,status,created_at&` +
      `or=(title.ilike.${encodeURIComponent(searchQuery)},summary.ilike.${encodeURIComponent(searchQuery)})&` +
      `deleted_at=is.null&` +
      `order=created_at.desc`,
      { headers: supabaseHeaders(config) }
    );

    if (!response.ok) {
      throw new Error(`Failed to search extractions (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching extractions:", error);
    return [];
  }
}

/**
 * Filter extractions by tag
 */
export async function filterByTag(tag: string) {
  const config = getSupabaseConfig();

  if (!config) {
    // Memory fallback
    return Array.from(memoryRecords.values())
      .filter(r => 
        !r.deleted_at && 
        Array.isArray(r.metadata.tags) && 
        (r.metadata.tags as string[]).includes(tag)
      )
      .map(transformRecord);
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/extractions?` +
      `select=id,title,summary,content_type,status,created_at&` +
      `metadata->>tags.cs.["${tag}"]&` +
      `deleted_at=is.null&` +
      `order=created_at.desc`,
      { headers: supabaseHeaders(config) }
    );

    if (!response.ok) {
      throw new Error(`Failed to filter by tag (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error filtering by tag:", error);
    return [];
  }
}

/**
 * Update extraction status
 */
export async function updateExtractionStatus(id: string, status: string) {
  const config = getSupabaseConfig();

  if (!config) {
    const record = memoryRecords.get(id);
    if (record) {
      record.status = status;
      record.updated_at = new Date().toISOString();
    }
    return record ? transformRecord(record) : null;
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          ...supabaseHeaders(config, "application/json"),
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update status (${response.status})`);
    }

    const [updated] = (await response.json()) as StoredExtractionRecord[];
    return updated ? transformRecord(updated) : null;
  } catch (error) {
    console.error("Error updating status:", error);
    return null;
  }
}

/**
 * Transform database record (snake_case) to application format (camelCase)
 */
function transformRecord(record: StoredExtractionRecord): Extraction {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    contentType: record.content_type as any,
    metadata: {
      source: (record.metadata as any)?.source ?? "Unknown",
      tags: (record.metadata as any)?.tags ?? [],
      date: new Date(record.created_at).toLocaleDateString(),
      status: record.status as any,
      confidence: (record.metadata as any)?.confidence,
      sourceType: record.source_type as any,
      instagramUrl: record.instagram_url ?? undefined,
      slideCount: record.slide_count,
      storagePaths: record.storage_paths,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      extractionType: record.extraction_type ?? undefined,
    },
    ...(record.payload as any),
  };
}
```

---

## Frontend Integration

### Update: `artifacts/carousel-brain/src/lib/extractions.ts`

```typescript
import type { CreateExtractionInput, Extraction } from "@/types/knowledge";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001/api";

/**
 * Get all extractions for dashboard
 */
export async function getAllExtractions(): Promise<Extraction[]> {
  try {
    const response = await fetch(`${API_BASE}/extractions`);
    if (!response.ok) throw new Error("Failed to fetch extractions");
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching extractions:", error);
    return [];
  }
}

/**
 * Get single extraction by ID
 */
export async function getExtractionById(id: string): Promise<Extraction | null> {
  try {
    const response = await fetch(`${API_BASE}/extractions/${id}`);
    if (!response.ok) return null;
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching extraction:", error);
    return null;
  }
}

/**
 * Create new extraction (handles upload or Instagram link)
 */
export async function createExtraction(input: CreateExtractionInput) {
  try {
    const formData = new FormData();
    formData.append("sourceType", input.sourceType || "upload");
    
    if (input.sourceType === "instagram" && input.instagramUrl) {
      formData.append("instagramUrl", input.instagramUrl);
    }
    
    if (input.uploadedFiles) {
      input.uploadedFiles.forEach((file) => {
        formData.append("uploads", file);
      });
    }

    const response = await fetch(`${API_BASE}/extractions`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to create extraction");
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating extraction:", error);
    throw error;
  }
}

/**
 * Search extractions
 */
export async function searchExtractions(query: string): Promise<Extraction[]> {
  try {
    const response = await fetch(
      `${API_BASE}/extractions?search=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Search failed");
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching:", error);
    return [];
  }
}
```

---

## Data Model Alignment

### Current Extraction Type (Phase 1)
```typescript
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
    sourceType?: "upload" | "instagram" | "mock";
    instagramUrl?: string;
    slideCount?: number;
    storagePaths?: string[];
    createdAt?: string;
    updatedAt?: string;
    extractionType?: string;
  };
  slides: Slide[];
  blocks: ExtractionBlock[];
};
```

### Database Schema (Phase 2)
```sql
-- Flat structure in extractions table
id TEXT PRIMARY KEY
title TEXT
summary TEXT
content_type ENUM
status ENUM
source_type ENUM
instagram_url TEXT (nullable)
payload JSONB  -- Contains full extraction (slides, blocks)
metadata JSONB -- Contains tags, confidence, source
slide_count INT
storage_paths TEXT[]
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP
```

**Mapping:**
- `extraction.id` → `extractions.id`
- `extraction.title` → `extractions.title`
- `extraction.summary` → `extractions.summary`
- `extraction.contentType` → `extractions.content_type`
- `extraction.metadata.status` → `extractions.status`
- `extraction.metadata.sourceType` → `extractions.source_type`
- `extraction.metadata.tags` → `extractions.metadata->'tags'`
- `extraction.metadata.confidence` → `extractions.metadata->>'confidence'`
- `extraction.slides + extraction.blocks` → `extractions.payload`

---

## Testing the Schema

### 1. Test INSERT
```sql
INSERT INTO extractions (
  id,
  title,
  summary,
  content_type,
  status,
  source_type,
  payload,
  metadata,
  slide_count,
  storage_paths
) VALUES (
  'test-001',
  'Test Extraction',
  'A test extraction for schema validation',
  'roadmap',
  'complete',
  'upload',
  '{"id":"test-001","title":"Test","slides":[],"blocks":[],"contentType":"roadmap"}'::jsonb,
  '{"source":"Test","tags":["test"],"confidence":0.95}'::jsonb,
  0,
  ARRAY[]::text[]
);
```

### 2. Test SELECT
```sql
SELECT id, title, status, created_at 
FROM extractions 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC;
```

### 3. Test JSONB Query
```sql
SELECT id, title, metadata->'tags' as tags
FROM extractions
WHERE metadata->'tags' @> '"test"'::jsonb;
```

### 4. Test UPDATE
```sql
UPDATE extractions
SET status = 'complete'
WHERE id = 'test-001';
```

---

## Monitoring & Debugging

### Check Table Size
```sql
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'extractions';
```

### Check Index Usage
```sql
SELECT 
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'extractions'
ORDER BY idx_scan DESC;
```

### Count Extractions by Status
```sql
SELECT status, COUNT(*) as count
FROM extractions
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;
```

### Average Payload Size
```sql
SELECT 
  AVG(pg_column_size(payload)) as avg_bytes,
  MAX(pg_column_size(payload)) as max_bytes,
  MIN(pg_column_size(payload)) as min_bytes
FROM extractions
WHERE deleted_at IS NULL;
```

---

## Phase 2 → Phase 3 Migration Path

### Phase 3: Add User Ownership
```sql
-- Add user_id column
ALTER TABLE extractions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for user queries
CREATE INDEX idx_extractions_user_created 
  ON extractions(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Create RLS policy
CREATE POLICY "Users can view their own extractions"
  ON extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON extractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extractions"
  ON extractions FOR UPDATE
  USING (auth.uid() = user_id);
```

### Phase 4: Add Vector Search (when needed)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE block_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id TEXT REFERENCES extractions(id),
  block_kind TEXT,
  block_content TEXT,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index
CREATE INDEX idx_block_embeddings_search 
  ON block_embeddings USING ivfflat(embedding vector_cosine_ops);
```

---

## Troubleshooting

### Issue: JSONB `?` operator not working
**Solution:** Use explicit JSONB operators:
```sql
-- ✅ Correct
WHERE metadata->'tags' @> '"Learning"'::jsonb

-- ❌ Wrong
WHERE metadata->'tags' ? 'Learning'
```

### Issue: Slow list queries
**Solution:** Check if indexes are being used:
```sql
EXPLAIN ANALYZE
SELECT * FROM extractions 
WHERE status = 'complete' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### Issue: Storage path tracking
**Solution:** Verify `storage_paths` array:
```sql
SELECT id, storage_paths, ARRAY_LENGTH(storage_paths, 1) as count
FROM extractions
WHERE slide_count > 0;
```

---

**Ready to deploy. Phase 2 database foundation complete.**
