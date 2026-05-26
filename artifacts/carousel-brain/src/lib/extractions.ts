import { extractionById, extractions } from "@/mocks/extractions";
import type { DashboardExtraction, Extraction } from "@/types/knowledge";

function toDashboardExtraction({
  id,
  title,
  summary,
  contentType,
  metadata,
}: Extraction): DashboardExtraction {
  return {
    id,
    title,
    summary,
    contentType,
    tags: metadata.tags,
    date: metadata.date,
    status: metadata.status,
  };
}

export function getAllExtractions(): DashboardExtraction[] {
  return extractions.map(toDashboardExtraction);
}

export function getExtractionById(id: string | undefined): Extraction | undefined {
  if (!id) return undefined;
  if (id === "demo") return extractionById.get("productivity-system");
  return extractionById.get(id);
}

export function getFeaturedExtraction(): Extraction | undefined {
  return getExtractionById("productivity-system");
}

export function getExtractionsByTag(tag: string): DashboardExtraction[] {
  return getAllExtractions().filter((extraction) => extraction.tags.includes(tag));
}
