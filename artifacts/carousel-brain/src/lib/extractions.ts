import type { DashboardExtraction, Extraction, ExtractionStatus } from "@/types/knowledge";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type CreateExtractionInput = {
  sourceType: "upload" | "instagram";
  instagramUrl?: string;
  uploadedFiles?: Array<{
    name?: string;
    size?: number;
    type?: string;
  }>;
};

export type CreateExtractionResult = {
  id: string;
  status: ExtractionStatus;
  lifecycle: ExtractionStatus[];
  extraction: Extraction;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> & ApiErrorEnvelope;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "The extraction service could not complete the request.");
  }

  return payload.data;
}

export async function getAllExtractions(): Promise<DashboardExtraction[]> {
  const response = await fetch("/api/extractions");
  return readJson<DashboardExtraction[]>(response);
}

export async function getExtractionById(id: string | undefined): Promise<Extraction | null> {
  if (!id) return null;

  const response = await fetch(`/api/extractions/${encodeURIComponent(id)}`);

  if (response.status === 404) {
    return null;
  }

  return readJson<Extraction>(response);
}

export async function createExtraction(input: CreateExtractionInput): Promise<CreateExtractionResult> {
  const response = await fetch("/api/extractions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<CreateExtractionResult>(response);
}

export async function getFeaturedExtraction(): Promise<Extraction | null> {
  return getExtractionById("productivity-system");
}

export async function getExtractionsByTag(tag: string): Promise<DashboardExtraction[]> {
  const extractions = await getAllExtractions();
  return extractions.filter((extraction) => extraction.tags.includes(tag));
}
