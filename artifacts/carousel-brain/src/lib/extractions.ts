import type {
  DashboardExtraction,
  Extraction,
  ExtractionStatus,
  FavoriteTargetType,
  KnowledgeCollection,
  KnowledgeFavorite,
} from "@/types/knowledge";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export type CreateExtractionInput = {
  sourceType: "upload" | "instagram";
  instagramUrl?: string;
  uploadedFiles?: File[];
};

export type CreateExtractionResult = {
  id: string;
  status: ExtractionStatus;
  lifecycle: ExtractionStatus[];
  extraction: Extraction;
};

export type RunOcrResult = {
  extractionId: string;
  ocrStatus: "pending" | "processing" | "complete" | "failed";
  aiStatus?: "pending" | "processing" | "complete" | "failed";
  slideCount: number;
  combinedTextPreview: string;
  ai?: {
    aiStatus: "complete";
    contentType: string;
    title: string;
    summaryPreview: string;
    normalized: true;
    blockCount: number;
  };
  aiError?: {
    code: string;
    message: string;
  };
  failedSlideCount?: number;
  slideErrors?: Array<{
    slideIndex: number;
    code: string;
    message: string;
  }>;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> & ApiErrorEnvelope;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "The extraction service could not complete the request.");
  }

  return payload.data;
}

export async function getAllExtractions(): Promise<DashboardExtraction[]> {
  const response = await fetch(apiPath("/extractions"));
  return readJson<DashboardExtraction[]>(response);
}

export async function getExtractionById(id: string | undefined): Promise<Extraction | null> {
  if (!id) return null;

  const response = await fetch(apiPath(`/extractions/${encodeURIComponent(id)}`));

  if (response.status === 404) {
    return null;
  }

  return readJson<Extraction>(response);
}

export async function createExtraction(input: CreateExtractionInput): Promise<CreateExtractionResult> {
  const requestInit: RequestInit =
    input.sourceType === "upload"
      ? {
          method: "POST",
          body: createUploadFormData(input),
        }
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        };

  const response = await fetch(apiPath("/extractions"), requestInit);

  return readJson<CreateExtractionResult>(response);
}

function createUploadFormData(input: CreateExtractionInput) {
  const files = input.uploadedFiles ?? [];

  if (files.length === 0) {
    throw new Error("Choose at least one carousel image before starting extraction.");
  }

  const formData = new FormData();
  formData.append("sourceType", "upload");

  for (const file of files) {
    formData.append("files", file);
  }

  return formData;
}

function apiPath(path: string) {
  return `${API_BASE_URL}/api${path}`;
}

export async function runOcrForExtraction(id: string): Promise<RunOcrResult> {
  const response = await fetch(apiPath(`/extractions/${encodeURIComponent(id)}/ocr`), {
    method: "POST",
  });

  return readJson<RunOcrResult>(response);
}

export async function getFeaturedExtraction(): Promise<Extraction | null> {
  return getExtractionById("productivity-system");
}

export async function getExtractionsByTag(tag: string): Promise<DashboardExtraction[]> {
  const extractions = await getAllExtractions();
  return extractions.filter((extraction) => extraction.tags.includes(tag));
}

export async function getCollections(): Promise<KnowledgeCollection[]> {
  const response = await fetch(apiPath("/collections"));
  return readJson<KnowledgeCollection[]>(response);
}

export async function createCollection(name: string): Promise<KnowledgeCollection> {
  const response = await fetch(apiPath("/collections"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  return readJson<KnowledgeCollection>(response);
}

export async function addExtractionToCollection(collectionId: string, extractionId: string) {
  const response = await fetch(apiPath(`/collections/${encodeURIComponent(collectionId)}/extractions`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ extractionId }),
  });
  return readJson<{ collectionId: string; extractionId: string }>(response);
}

export async function getFavorites(): Promise<KnowledgeFavorite[]> {
  const response = await fetch(apiPath("/favorites"));
  return readJson<KnowledgeFavorite[]>(response);
}

export async function saveFavorite(input: {
  targetType: FavoriteTargetType;
  extractionId: string;
  itemId?: string;
  itemTitle: string;
  itemSummary?: string;
  parentTitle?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}): Promise<KnowledgeFavorite> {
  const response = await fetch(apiPath("/favorites"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return readJson<KnowledgeFavorite>(response);
}
