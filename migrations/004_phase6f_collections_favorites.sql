-- CarouselBrain Phase 6F: Collections and Favorites
-- Run in Supabase SQL Editor after the extraction schema migrations.

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_extractions (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  extraction_id TEXT NOT NULL REFERENCES extractions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, extraction_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('extraction', 'resource', 'opportunity', 'catalog_item')),
  extraction_id TEXT NOT NULL REFERENCES extractions(id) ON DELETE CASCADE,
  item_id TEXT,
  item_title TEXT NOT NULL,
  item_summary TEXT,
  parent_title TEXT,
  status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_type, extraction_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_extractions_extraction_id
  ON collection_extractions(extraction_id);

CREATE INDEX IF NOT EXISTS idx_favorites_target_type_created
  ON favorites(target_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_extraction_id
  ON favorites(extraction_id);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON collections TO postgres;
GRANT ALL PRIVILEGES ON collection_extractions TO postgres;
GRANT ALL PRIVILEGES ON favorites TO postgres;

GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO authenticated;
GRANT SELECT, INSERT, DELETE ON collection_extractions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated;

GRANT SELECT ON collections TO anon;
GRANT SELECT ON collection_extractions TO anon;
GRANT SELECT ON favorites TO anon;
