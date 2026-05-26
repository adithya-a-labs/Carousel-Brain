import { getSupabaseConfig, supabaseErrorMessage, supabaseHeaders } from "../lib/supabase";

type ExtractionRecordInput = {
  id: string;
  sourceType: "upload" | "instagram";
  instagramUrl?: string;
  status: string;
  slideCount: number;
  storagePaths: string[];
  extractionType?: string;
  metadata: Record<string, unknown>;
  payload: Record<string, unknown>;
};

type StoredExtractionRecord = {
  id: string;
  title: string;
  summary: string;
  content_type: string;
  source_type: "upload" | "instagram";
  instagram_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  slide_count: number;
  storage_paths: string[];
  metadata: Record<string, unknown>;
  payload: Record<string, unknown>;
};

const memoryRecords = new Map<string, StoredExtractionRecord>();

function toRecord(input: ExtractionRecordInput): StoredExtractionRecord {
  const now = new Date().toISOString();
  const payloadTitle = typeof input.payload.title === "string" ? input.payload.title : "Untitled extraction";
  const payloadSummary = typeof input.payload.summary === "string" ? input.payload.summary : "";
  const payloadContentType = typeof input.payload.contentType === "string" ? input.payload.contentType : "system";

  return {
    id: input.id,
    title: payloadTitle,
    summary: payloadSummary,
    content_type: payloadContentType,
    source_type: input.sourceType,
    instagram_url: input.instagramUrl ?? null,
    status: input.status,
    created_at: now,
    updated_at: now,
    slide_count: input.slideCount,
    storage_paths: input.storagePaths,
    metadata: {
      ...input.metadata,
      extractionType: input.extractionType,
    },
    payload: input.payload,
  };
}

function fromRecord(record: StoredExtractionRecord) {
  const payloadMetadata =
    record.payload && typeof record.payload.metadata === "object" && record.payload.metadata
      ? (record.payload.metadata as Record<string, unknown>)
      : {};

  return {
    title: record.title,
    summary: record.summary,
    contentType: record.content_type,
    ...record.payload,
    metadata: {
      ...payloadMetadata,
      sourceType: record.source_type,
      instagramUrl: record.instagram_url ?? undefined,
      slideCount: record.slide_count,
      storagePaths: record.storage_paths,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      extractionType:
        typeof record.metadata?.extractionType === "string"
          ? record.metadata.extractionType
          : typeof record.payload?.contentType === "string"
            ? record.payload.contentType
            : undefined,
    },
  };
}

export async function saveExtractionRecord(input: ExtractionRecordInput) {
  const config = getSupabaseConfig();
  const record = toRecord(input);

  if (!config) {
    memoryRecords.set(record.id, record);
    return fromRecord(record);
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?on_conflict=id`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to persist extraction record"));
  }

  const [saved] = (await response.json()) as StoredExtractionRecord[];
  return fromRecord(saved ?? record);
}

export async function listStoredExtractions() {
  const config = getSupabaseConfig();

  if (!config) {
    return Array.from(memoryRecords.values()).map(fromRecord);
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?select=*&order=created_at.desc`, {
    headers: supabaseHeaders(config),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to load extraction records"));
  }

  const records = (await response.json()) as StoredExtractionRecord[];
  return records.map(fromRecord);
}

export async function getStoredExtraction(id: string) {
  const config = getSupabaseConfig();

  if (!config) {
    const record = memoryRecords.get(id);
    return record ? fromRecord(record) : undefined;
  }

  const response = await fetch(`${config.url}/rest/v1/extractions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: supabaseHeaders(config),
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to load extraction record"));
  }

  const [record] = (await response.json()) as StoredExtractionRecord[];
  return record ? fromRecord(record) : undefined;
}
