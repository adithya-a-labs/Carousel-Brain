-- CarouselBrain Phase 4: OCR.Space persistence
-- Run in Supabase SQL Editor before invoking POST /api/extractions/:id/ocr

ALTER TABLE extractions
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ocr_confidence REAL;

CREATE TABLE IF NOT EXISTS extraction_ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id TEXT NOT NULL REFERENCES extractions(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  confidence REAL,
  provider_response JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (extraction_id, slide_index)
);

CREATE INDEX IF NOT EXISTS idx_extraction_ocr_results_extraction_slide
  ON extraction_ocr_results(extraction_id, slide_index);

ALTER TABLE extraction_ocr_results ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON extraction_ocr_results TO postgres;
GRANT SELECT, INSERT, UPDATE ON extraction_ocr_results TO authenticated;
GRANT SELECT ON extraction_ocr_results TO anon;

COMMENT ON COLUMN extractions.ocr_text IS 'Combined OCR text from source slide images, ordered by slide_index';
COMMENT ON COLUMN extractions.ocr_status IS 'OCR lifecycle: pending, processing, complete, failed';
COMMENT ON COLUMN extractions.ocr_confidence IS 'Average OCR confidence across slide results when provider supplies confidence';
COMMENT ON TABLE extraction_ocr_results IS 'Per-slide OCR.Space results for CarouselBrain extraction source images';
