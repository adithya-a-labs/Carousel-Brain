import { integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const extractionsTable = pgTable("extractions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  contentType: text("content_type").notNull(),
  sourceType: text("source_type").notNull(),
  instagramUrl: text("instagram_url"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  slideCount: integer("slide_count").notNull().default(0),
  storagePaths: jsonb("storage_paths").$type<string[]>().notNull().default([]),
  ocrText: text("ocr_text"),
  ocrStatus: text("ocr_status").notNull().default("pending"),
  ocrConfidence: real("ocr_confidence"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
});

export const extractionOcrResultsTable = pgTable("extraction_ocr_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  extractionId: text("extraction_id").notNull(),
  slideIndex: integer("slide_index").notNull(),
  storagePath: text("storage_path").notNull(),
  rawText: text("raw_text").notNull(),
  confidence: real("confidence"),
  providerResponse: jsonb("provider_response").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExtractionRecord = typeof extractionsTable.$inferSelect;
export type ExtractionOcrResultRecord = typeof extractionOcrResultsTable.$inferSelect;
