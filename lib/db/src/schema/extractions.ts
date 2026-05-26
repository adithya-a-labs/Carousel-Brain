import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const extractionsTable = pgTable("extractions", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  instagramUrl: text("instagram_url"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  slideCount: integer("slide_count").notNull().default(0),
  storagePaths: jsonb("storage_paths").$type<string[]>().notNull().default([]),
  extractionType: text("extraction_type"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
});

export type ExtractionRecord = typeof extractionsTable.$inferSelect;
