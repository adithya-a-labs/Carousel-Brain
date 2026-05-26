-- CarouselBrain Phase 2: Supabase Database Schema
-- Ready for deployment in Supabase SQL Editor
-- Run this entire script in your Supabase project

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE extraction_content_type AS ENUM (
  'roadmap',
  'resources',
  'tutorial',
  'playbook',
  'conceptual',
  'system'
);

CREATE TYPE extraction_status AS ENUM (
  'queued',
  'uploading',
  'processing',
  'analyzing',
  'structuring',
  'complete',
  'failed'
);

CREATE TYPE extraction_source_type AS ENUM (
  'upload',
  'instagram'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MAIN TABLE: extractions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE extractions (
  -- Identity & Core Content
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  
  -- Classification
  content_type extraction_content_type NOT NULL,
  status extraction_status NOT NULL DEFAULT 'queued',
  
  -- Source tracking
  source_type extraction_source_type NOT NULL,
  instagram_url TEXT,
  
  -- Data storage (JSONB for flexibility)
  -- payload: Full Extraction object (slides + blocks)
  -- metadata: Tags, confidence, source attribution, notes
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Storage references
  slide_count INTEGER NOT NULL DEFAULT 0,
  storage_paths TEXT[] NOT NULL DEFAULT '{}',
  
  -- Lifecycle tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraint: instagram_url required only for instagram source
  CONSTRAINT instagram_url_required CHECK (
    (source_type = 'instagram' AND instagram_url IS NOT NULL) OR
    source_type = 'upload'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard: List recent extractions with status filter
CREATE INDEX idx_extractions_status_created 
  ON extractions(status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Recent extractions (DashboardPage)
CREATE INDEX idx_extractions_created_desc 
  ON extractions(created_at DESC)
  WHERE deleted_at IS NULL;

-- Filter by source type (upload vs instagram)
CREATE INDEX idx_extractions_source_type 
  ON extractions(source_type)
  WHERE deleted_at IS NULL;

-- Filter by content type (roadmap, tutorial, etc.)
CREATE INDEX idx_extractions_content_type 
  ON extractions(content_type)
  WHERE deleted_at IS NULL;

-- Tag-based filtering (metadata->'tags' ? 'tag_name')
CREATE INDEX idx_extractions_metadata_tags 
  ON extractions USING GIN (metadata->'tags');

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (Stub for Phase 3 Auth)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- Phase 2: No RLS policies (public access to demo data)
-- Phase 3: Add user_id column and user-based RLS policies

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update updated_at timestamp
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Phase 2: Allow service role full access (for backend operations)
-- Phase 3: Restrict with RLS policies for authenticated/anonymous roles

GRANT ALL PRIVILEGES ON extractions TO postgres;

-- Allow authenticated users to read (will be restricted by RLS in Phase 3)
GRANT SELECT, INSERT, UPDATE ON extractions TO authenticated;

-- Allow anonymous users to read demo data (will be restricted by RLS)
GRANT SELECT ON extractions TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS (Optional, add as needed for Phase 3+)
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard view: Extraction summary for listing
CREATE VIEW extractions_dashboard AS
SELECT 
  id,
  title,
  summary,
  content_type,
  status,
  created_at,
  updated_at,
  source_type,
  slide_count,
  metadata->'tags' as tags,
  metadata->>'source' as source,
  (metadata->>'confidence')::FLOAT as confidence
FROM extractions
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Recent extractions view (Phase 2)
CREATE VIEW extractions_recent AS
SELECT 
  id,
  title,
  summary,
  content_type,
  created_at,
  status
FROM extractions
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMENTS (Documentation)
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE extractions IS 'CarouselBrain extractions: Uploaded carousel data with adaptive block rendering';

COMMENT ON COLUMN extractions.id IS 'Unique identifier (UUID or nanoid format)';
COMMENT ON COLUMN extractions.title IS 'Extraction title shown in dashboard';
COMMENT ON COLUMN extractions.summary IS 'Short description (1-2 sentences)';
COMMENT ON COLUMN extractions.content_type IS 'Knowledge type: roadmap, resources, tutorial, playbook, conceptual, system';
COMMENT ON COLUMN extractions.status IS 'Processing lifecycle: queued → uploading → processing → analyzing → structuring → complete/failed';
COMMENT ON COLUMN extractions.source_type IS 'Origin: upload (user files) or instagram (carousel link)';
COMMENT ON COLUMN extractions.instagram_url IS 'Instagram carousel URL (instagram.com/p/... or /reel/...)';
COMMENT ON COLUMN extractions.payload IS 'Full extraction object: {id, title, summary, contentType, slides[], blocks[]}';
COMMENT ON COLUMN extractions.metadata IS 'Tags, confidence, source attribution: {source, tags[], date, confidence, extractionType, sourceNotes}';
COMMENT ON COLUMN extractions.slide_count IS 'Number of carousel slides (cached from payload.slides.length)';
COMMENT ON COLUMN extractions.storage_paths IS 'Array of S3/Supabase paths to uploaded slide images: ["extractions/{id}/slides/01-...jpg", ...]';
COMMENT ON COLUMN extractions.created_at IS 'Extraction creation timestamp (UTC)';
COMMENT ON COLUMN extractions.updated_at IS 'Last modification timestamp (auto-updated on each change)';
COMMENT ON COLUMN extractions.deleted_at IS 'Soft delete timestamp (NULL = active, non-NULL = deleted)';

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (Run after deployment)
-- ─────────────────────────────────────────────────────────────────────────────

-- Check table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'extractions' ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'extractions' ORDER BY indexname;

-- Check triggers
-- SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers 
-- WHERE event_object_table = 'extractions';
