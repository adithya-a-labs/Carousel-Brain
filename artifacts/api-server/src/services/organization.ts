import { logger } from "../lib/logger";
import { getSupabaseConfig, supabaseErrorMessage, supabaseHeaders } from "../lib/supabase";

export type CollectionRecord = {
  id: string;
  name: string;
  createdAt: string;
  extractionCount: number;
  extractionIds: string[];
};

export type FavoriteTargetType = "extraction" | "resource" | "opportunity" | "catalog_item";

export type FavoriteRecord = {
  id: string;
  targetType: FavoriteTargetType;
  extractionId: string;
  itemId?: string;
  itemTitle: string;
  itemSummary?: string;
  parentTitle?: string;
  status?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type FavoriteInput = {
  targetType: FavoriteTargetType;
  extractionId: string;
  itemId?: string;
  itemTitle: string;
  itemSummary?: string;
  parentTitle?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

type CollectionDbRecord = {
  id: string;
  name: string;
  created_at: string;
};

type CollectionExtractionDbRecord = {
  collection_id: string;
  extraction_id: string;
  created_at: string;
};

type FavoriteDbRecord = {
  id: string;
  target_type: FavoriteTargetType;
  extraction_id: string;
  item_id: string | null;
  item_title: string;
  item_summary: string | null;
  parent_title: string | null;
  status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const memoryCollections = new Map<string, CollectionDbRecord>();
const memoryMemberships = new Map<string, CollectionExtractionDbRecord>();
const memoryFavorites = new Map<string, FavoriteDbRecord>();

export async function listCollections(): Promise<CollectionRecord[]> {
  const config = getSupabaseConfig();
  if (!config) return listMemoryCollections();

  try {
    const [collections, memberships] = await Promise.all([
      supabaseGet<CollectionDbRecord[]>("/rest/v1/collections?select=*&order=name.asc"),
      supabaseGet<CollectionExtractionDbRecord[]>("/rest/v1/collection_extractions?select=*"),
    ]);
    return hydrateCollections(collections, memberships);
  } catch (error) {
    logFallback("collections_list_failed", error);
    return listMemoryCollections();
  }
}

export async function createCollection(name: string): Promise<CollectionRecord> {
  const normalizedName = normalizeName(name);
  if (!normalizedName) throw new Error("Collection name is required.");

  const existing = (await listCollections()).find((collection) => collection.name.toLowerCase() === normalizedName.toLowerCase());
  if (existing) return existing;

  const record: CollectionDbRecord = {
    id: `col-${Date.now().toString(36)}-${slug(normalizedName)}`,
    name: normalizedName,
    created_at: new Date().toISOString(),
  };

  const config = getSupabaseConfig();
  if (!config) {
    memoryCollections.set(record.id, record);
    return fromCollectionRecord(record, []);
  }

  try {
    const saved = await supabasePost<CollectionDbRecord[]>("/rest/v1/collections?on_conflict=name", record);
    const collection = saved[0] ?? record;
    return fromCollectionRecord(collection, []);
  } catch (error) {
    logFallback("collection_create_failed", error);
    memoryCollections.set(record.id, record);
    return fromCollectionRecord(record, []);
  }
}

export async function addExtractionToCollection(collectionId: string, extractionId: string) {
  if (!collectionId || !extractionId) throw new Error("collectionId and extractionId are required.");

  const record: CollectionExtractionDbRecord = {
    collection_id: collectionId,
    extraction_id: extractionId,
    created_at: new Date().toISOString(),
  };
  const key = membershipKey(collectionId, extractionId);
  const config = getSupabaseConfig();
  if (!config) {
    memoryMemberships.set(key, record);
    return record;
  }

  try {
    const saved = await supabasePost<CollectionExtractionDbRecord[]>("/rest/v1/collection_extractions?on_conflict=collection_id,extraction_id", record);
    return saved[0] ?? record;
  } catch (error) {
    logFallback("collection_membership_save_failed", error);
    memoryMemberships.set(key, record);
    return record;
  }
}

export async function listFavorites(): Promise<FavoriteRecord[]> {
  const config = getSupabaseConfig();
  if (!config) return Array.from(memoryFavorites.values()).map(fromFavoriteRecord);

  try {
    const records = await supabaseGet<FavoriteDbRecord[]>("/rest/v1/favorites?select=*&order=created_at.desc");
    return records.map(fromFavoriteRecord);
  } catch (error) {
    logFallback("favorites_list_failed", error);
    return Array.from(memoryFavorites.values()).map(fromFavoriteRecord);
  }
}

export async function saveFavorite(input: FavoriteInput): Promise<FavoriteRecord> {
  const itemTitle = normalizeName(input.itemTitle);
  if (!itemTitle) throw new Error("Favorite item title is required.");
  if (!input.extractionId) throw new Error("Favorite extraction id is required.");

  const record: FavoriteDbRecord = {
    id: favoriteId(input),
    target_type: input.targetType,
    extraction_id: input.extractionId,
    item_id: input.itemId ?? null,
    item_title: itemTitle,
    item_summary: input.itemSummary?.trim() || null,
    parent_title: input.parentTitle?.trim() || null,
    status: input.status?.trim() || (input.targetType === "opportunity" ? "Interested" : null),
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  const config = getSupabaseConfig();
  if (!config) {
    memoryFavorites.set(record.id, record);
    return fromFavoriteRecord(record);
  }

  try {
    const saved = await supabasePost<FavoriteDbRecord[]>("/rest/v1/favorites?on_conflict=target_type,extraction_id,item_id", record);
    return fromFavoriteRecord(saved[0] ?? record);
  } catch (error) {
    logFallback("favorite_save_failed", error);
    memoryFavorites.set(record.id, record);
    return fromFavoriteRecord(record);
  }
}

export async function deleteFavorite(id: string) {
  if (!id) throw new Error("Favorite id is required.");
  const config = getSupabaseConfig();
  memoryFavorites.delete(id);
  if (!config) return;

  try {
    await supabaseDelete(`/rest/v1/favorites?id=eq.${encodeURIComponent(id)}`);
  } catch (error) {
    logFallback("favorite_delete_failed", error);
  }
}

function listMemoryCollections() {
  return hydrateCollections(Array.from(memoryCollections.values()), Array.from(memoryMemberships.values()));
}

function hydrateCollections(collections: CollectionDbRecord[], memberships: CollectionExtractionDbRecord[]) {
  return collections.map((collection) => {
    const extractionIds = memberships
      .filter((membership) => membership.collection_id === collection.id)
      .map((membership) => membership.extraction_id);
    return fromCollectionRecord(collection, extractionIds);
  });
}

function fromCollectionRecord(record: CollectionDbRecord, extractionIds: string[]): CollectionRecord {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.created_at,
    extractionCount: extractionIds.length,
    extractionIds,
  };
}

function fromFavoriteRecord(record: FavoriteDbRecord): FavoriteRecord {
  return {
    id: record.id,
    targetType: record.target_type,
    extractionId: record.extraction_id,
    itemId: record.item_id ?? undefined,
    itemTitle: record.item_title,
    itemSummary: record.item_summary ?? undefined,
    parentTitle: record.parent_title ?? undefined,
    status: record.status ?? undefined,
    metadata: record.metadata ?? {},
    createdAt: record.created_at,
  };
}

async function supabaseGet<T>(path: string): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(`${config.url}${path}`, {
    headers: supabaseHeaders(config),
  });
  if (!response.ok) throw new Error(await supabaseErrorMessage(response, "Supabase organization read failed"));
  return response.json() as Promise<T>;
}

async function supabasePost<T>(path: string, body: unknown): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(`${config.url}${path}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config, "application/json"),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await supabaseErrorMessage(response, "Supabase organization write failed"));
  return response.json() as Promise<T>;
}

async function supabaseDelete(path: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const response = await fetch(`${config.url}${path}`, {
    method: "DELETE",
    headers: {
      ...supabaseHeaders(config),
      Prefer: "return=minimal",
    },
  });
  if (!response.ok) throw new Error(await supabaseErrorMessage(response, "Supabase organization delete failed"));
}

function favoriteId(input: FavoriteInput) {
  return `fav-${input.targetType}-${input.extractionId}-${slug(input.itemId || input.itemTitle)}`;
}

function membershipKey(collectionId: string, extractionId: string) {
  return `${collectionId}:${extractionId}`;
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "item";
}

function logFallback(event: string, error: unknown) {
  logger.warn(
    {
      event,
      message: error instanceof Error ? error.message : "Unknown organization persistence error",
    },
    "Organization persistence fell back to memory",
  );
}
