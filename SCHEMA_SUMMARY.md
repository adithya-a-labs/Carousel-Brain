# CarouselBrain Phase 2: Database Schema — Executive Summary

## What's Included

This package contains the **minimal, production-ready Supabase database schema** for CarouselBrain Phase 2.

### Documents

1. **PHASE2_DATABASE_SCHEMA.md** — Complete design document
   - Architecture overview
   - Full table schema with detailed column explanations
   - JSONB field rationale
   - Query patterns for dashboard, search, filtering
   - Scalability path to Phase 3+ 
   - Monitoring & maintenance queries

2. **migrations/001_phase2_schema.sql** — Ready-to-deploy SQL
   - Enum types
   - Extractions table with constraints
   - Indexes for all common queries
   - Triggers for auto-updated_at
   - Views for dashboard & recent extractions
   - RLS stub for Phase 3 auth

3. **IMPLEMENTATION_GUIDE.md** — Step-by-step integration
   - Supabase setup (SQL + Storage)
   - Service layer TypeScript code (drop-in ready)
   - Frontend integration examples
   - Data model alignment
   - Testing queries
   - Phase 3/4 migration paths

4. **lib/api-spec/types.ts** — Complete TypeScript types
   - Application types (Slide, Block variants, Extraction)
   - Database types (StoredExtractionRecord)
   - API request/response types
   - Type guards & transformation helpers
   - Ready to import and use

---

## Quick Start (5 minutes)

### 1. Deploy Schema
```bash
# Copy migrations/001_phase2_schema.sql
# Go to Supabase Dashboard > SQL Editor
# Paste and Run
```

### 2. Create Storage Bucket
```bash
# Supabase Dashboard > Storage
# New Bucket: "carouselbrain" (private, 50MB limit, PNG/JPG/WEBP only)
```

### 3. Set Environment
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
SUPABASE_STORAGE_BUCKET=carouselbrain
```

### 4. Copy Service Code
Use code from IMPLEMENTATION_GUIDE.md section "Service Layer Implementation"
Replace current extraction-records.ts with Supabase-aware version

---

## Core Design Decisions

### ✅ One Table: `extractions`

**Why not separate slides/blocks tables?**

1. **Polymorphic blocks**: 7 different block structures (summary, roadmap, checklist, concepts, timeline, resources, repoCollection) — no single normalized schema
2. **No block-level queries in Phase 2**: Full extraction needed for ResultPage rendering
3. **No aggregations yet**: Dashboard queries just list extractions, not blocks
4. **Simpler code**: Single row fetch = simpler app logic
5. **Ready to normalize**: When Phase 4 adds semantic search, split to `extraction_blocks` + `block_embeddings` (zero breaking changes with JSONB)

### ✅ JSONB for Adaptive Structure

```json
payload: {
  "slides": [...],
  "blocks": [
    { "kind": "summary", "body": "..." },
    { "kind": "roadmap", "stages": [...] },
    { "kind": "concepts", "clusters": [...] }
  ]
}
```

Flexible, extensible, future-proof.

### ✅ Soft Deletes + Partial Indexes

- `deleted_at` column, `WHERE deleted_at IS NULL` in all indexes
- Preserves storage references for cleanup
- Enables recovery workflows in Phase 3
- Better than hard delete + cascade

### ✅ Enum Columns (Not Text)

```sql
content_type extraction_content_type NOT NULL
status extraction_status NOT NULL
source_type extraction_source_type NOT NULL
```

Type-safe, indexed, database constraints enforce valid values.

### ✅ Storage Paths Array (Not JSONB)

```sql
storage_paths TEXT[] NOT NULL DEFAULT '{}' 
```

Native array type:
- Supports `@>` containment for cleanup queries
- Better performance than JSON arrays
- Simpler in application code

---

## Query Examples

All important queries included in PHASE2_DATABASE_SCHEMA.md:

1. **List Recent** (DashboardPage)
```sql
SELECT id, title, summary, content_type, status, created_at
FROM extractions
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

2. **Get Full** (ResultPage)
```sql
SELECT * FROM extractions
WHERE id = $1 AND deleted_at IS NULL;
```

3. **Search** (Dashboard search box)
```sql
WHERE (title ILIKE $1 OR summary ILIKE $1) AND deleted_at IS NULL
```

4. **Filter by Tag**
```sql
WHERE metadata->'tags' @> '"Learning"'::jsonb AND deleted_at IS NULL
```

5. **Update Status** (Lifecycle)
```sql
UPDATE extractions
SET status = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;
```

---

## Index Strategy

| Index | Use Case | Priority |
|-------|----------|----------|
| `(status, created_at DESC)` | Dashboard filter + list | **Critical** |
| `(created_at DESC)` | Recent extractions | **High** |
| `(source_type)` | Filter upload vs instagram | High |
| `(content_type)` | Filter by knowledge type | High |
| `metadata->'tags' (GIN)` | Tag filtering | Medium |

All indexes include `WHERE deleted_at IS NULL` (partial index = smaller, faster).

---

## Data Model Alignment

| Layer | Location | Format |
|-------|----------|--------|
| **Frontend** | `artifacts/carousel-brain` | TypeScript types + camelCase |
| **API** | REST endpoints | JSON with camelCase |
| **Database** | Supabase PostgreSQL | snake_case columns |
| **Types Repo** | `lib/api-spec/types.ts` | Single source of truth |

Transformation happens at service layer (see IMPLEMENTATION_GUIDE.md).

---

## Scalability Path

### Phase 2 (Now)
- Single `extractions` table with JSONB payload
- Simple list/get queries
- Supabase Storage for images
- Memory fallback for dev

### Phase 3 (Auth + Multi-User)
Add:
- `user_id UUID REFERENCES auth.users(id)`
- RLS policies (stub template already in SQL)
- User-scoped queries

No schema breaking changes.

### Phase 4 (Semantic Search + OCR)
Add:
- `CREATE TABLE block_embeddings` (vector search)
- `CREATE TABLE ocr_results` (OCR data)

Keep existing `extractions` table unchanged.

### Phase 5+ (Collaboration, Versioning)
Add:
- `extraction_versions` (audit trail)
- `shared_extractions` (permissions)

Original table remains stable.

---

## What This Does NOT Include

❌ **No user authentication** (Phase 3)
❌ **No OCR/Groq** (Phase 4 backend service)
❌ **No vector embeddings** (Phase 4)
❌ **No semantic search** (Phase 4)
❌ **No queues/workers** (Phase 4 async processing)
❌ **No caching layer** (Phase 3)
❌ **No enterprise features** (future)

This is **purely data persistence** for extraction lifecycle + adaptive rendering.

---

## Testing Checklist

- [ ] Run migrations/001_phase2_schema.sql in Supabase
- [ ] Create carouselbrain storage bucket
- [ ] INSERT test record into extractions
- [ ] SELECT with all filter conditions
- [ ] Verify indexes are being used (EXPLAIN ANALYZE)
- [ ] Test JSONB queries (metadata->'tags' @>)
- [ ] Test storage path array operations
- [ ] Verify updated_at trigger works
- [ ] Test soft delete (set deleted_at, verify WHERE clause excludes)
- [ ] Verify RLS is enabled (policies added in Phase 3)

---

## Integration Points

### Backend Service (`artifacts/api-server`)
- Update `src/services/extraction-records.ts` with Supabase code
- Update `src/lib/supabase.ts` config
- Update `src/routes/extractions.ts` API handler

### Frontend (`artifacts/carousel-brain`)
- Update `src/lib/extractions.ts` query functions
- No type changes needed (use types from lib/api-spec/types.ts)

### Shared Types (`lib/api-spec`)
- Use `types.ts` for all TypeScript definitions
- Eliminates duplication
- Single source of truth

---

## Monitoring & Health

Key metrics to track post-deployment:

```sql
-- Extraction distribution
SELECT content_type, COUNT(*) FROM extractions 
WHERE deleted_at IS NULL GROUP BY content_type;

-- Processing success rate
SELECT status, ROUND(100*COUNT(*)/SUM(COUNT(*)) OVER(), 2) as pct
FROM extractions WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Storage usage
SELECT SUM(ARRAY_LENGTH(storage_paths, 1)) as total_slides,
       ROUND(AVG(pg_column_size(payload))/1024.0, 2) as avg_payload_kb
FROM extractions;

-- Index performance
SELECT indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes WHERE relname = 'extractions'
ORDER BY idx_scan DESC;
```

---

## Support & Debugging

### Common Issues

**Q: JSONB tag filtering not working?**
A: Use `metadata->'tags' @> '"tag"'::jsonb` not `?` operator

**Q: Slow dashboard queries?**
A: Check `EXPLAIN ANALYZE` plan, verify indexes created, consider pre-aggregation view

**Q: Storage paths not tracked?**
A: Ensure `uploadExtractionSlides()` populates `storage_paths` array before save

**Q: Deleted extractions still showing?**
A: Verify all queries include `WHERE deleted_at IS NULL`

---

## Files Delivered

```
CarouselBrain/
├── PHASE2_DATABASE_SCHEMA.md          ← Full design document (read first)
├── IMPLEMENTATION_GUIDE.md             ← Integration walkthrough
├── lib/api-spec/types.ts              ← Shared TypeScript types
├── migrations/
│   └── 001_phase2_schema.sql           ← Deploy this to Supabase
└── [Your service layer code]
    └── src/services/extraction-records.ts  ← Update with provided code
```

---

## Next Steps

1. **Read**: PHASE2_DATABASE_SCHEMA.md (architecture, design rationale)
2. **Deploy**: migrations/001_phase2_schema.sql (10 seconds in Supabase)
3. **Setup**: Storage bucket + .env variables
4. **Integrate**: Copy service code from IMPLEMENTATION_GUIDE.md
5. **Test**: Run queries from testing section
6. **Monitor**: Track metrics from monitoring section

---

## Design Philosophy

> **Minimal + Correct**
> 
> No hallucinated infrastructure.
> Only what's needed for Phase 2.
> Clean path to Phase 3+.
> Type-safe throughout.
> Ready for production.

---

**Database schema complete. Ready to build Phase 2 backend.**
