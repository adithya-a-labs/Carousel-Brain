-- CarouselBrain Founder Analytics
-- Run in Supabase SQL Editor after Phase 6F migrations.

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  extraction_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_extraction_id
  ON analytics_events(extraction_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created
  ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON analytics_events TO postgres;
GRANT SELECT, INSERT ON analytics_events TO authenticated;
GRANT INSERT ON analytics_events TO anon;
