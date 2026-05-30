import { getAllExtractions } from "../data/extractions";
import { logger } from "../lib/logger";
import { getSupabaseConfig, supabaseErrorMessage, supabaseHeaders } from "../lib/supabase";
import { listCollections, listFavorites } from "./organization";

export type AnalyticsEventInput = {
  eventType: string;
  userId?: string;
  extractionId?: string;
  metadata?: Record<string, unknown>;
};

type AnalyticsEventRecord = {
  id: string;
  event_type: string;
  user_id: string | null;
  extraction_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const memoryEvents: AnalyticsEventRecord[] = [];

export function isAdminAnalyticsEnabled() {
  return process.env.ENABLE_ADMIN_ANALYTICS === "true";
}

export function isValidAdminSecret(value: unknown) {
  const configured = process.env.ADMIN_ANALYTICS_SECRET;
  if (!configured) return true;
  return typeof value === "string" && value === configured;
}

export async function recordAnalyticsEvent(input: AnalyticsEventInput) {
  const eventType = cleanString(input.eventType);
  if (!eventType) return;

  const record: AnalyticsEventRecord = {
    id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    event_type: eventType.slice(0, 80),
    user_id: cleanString(input.userId) || null,
    extraction_id: cleanString(input.extractionId) || null,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  const config = getSupabaseConfig();
  if (!config) {
    memoryEvents.unshift(record);
    return record;
  }

  try {
    const response = await fetch(`${config.url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(config, "application/json"),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(await supabaseErrorMessage(response, "Failed to record analytics event"));
  } catch (error) {
    logger.warn(
      {
        event: "analytics_event_record_failed",
        eventType,
        message: error instanceof Error ? error.message : "Unknown analytics event failure",
      },
      "Analytics event fell back to memory",
    );
    memoryEvents.unshift(record);
  }

  return record;
}

export async function getFounderAnalytics() {
  const [extractions, collections, favorites, events] = await Promise.all([
    getAllExtractions(),
    listCollections(),
    listFavorites(),
    listAnalyticsEvents(),
  ]);

  const now = Date.now();
  const sourceCounts = countBy(extractions, (item) => String(item.sourceType ?? item.searchMatches?.find(() => false) ?? "unknown"));
  const contentCounts = countBy(extractions, (item) => item.libraryType ?? item.contentType ?? "unknown");
  const successful = extractions.filter((item) => item.status === "complete").length;
  const failed = extractions.filter((item) => item.status === "failed").length;
  const totalSlides = sum(extractions.map((item) => item.slideCount ?? 0));
  const catalogItems = sum(extractions.map((item) => item.counts?.catalogItems ?? 0));
  const resources = sum(extractions.map((item) => item.counts?.resources ?? 0));
  const opportunities = sum(extractions.map((item) => item.counts?.opportunities ?? 0));
  const searches = events.filter((event) => event.event_type === "search_performed");
  const searchWithResults = searches.filter((event) => Number(event.metadata.resultCount ?? 0) > 0).length;
  const recentFailures = extractions
    .filter((item) => item.status === "failed" || /failed|missing/i.test(item.searchMatches?.map((match) => match.text).join(" ") ?? ""))
    .slice(0, 8)
    .map((item) => ({ id: item.id, title: item.title, status: item.status }));
  const favoriteCounts = countBy(favorites, (favorite) => favorite.targetType);
  const topCollections = collections
    .slice()
    .sort((a, b) => b.extractionCount - a.extractionCount || a.name.localeCompare(b.name))
    .slice(0, 8);
  const recentSearches = searches.slice(0, 12).map((event) => ({
    term: cleanString(event.metadata.query),
    resultCount: Number(event.metadata.resultCount ?? 0),
    createdAt: event.created_at,
  })).filter((item) => item.term);
  const topSearchTerms = topTerms(searches.map((event) => cleanString(event.metadata.query)), 10);
  const eventCounts = countBy(events, (event) => event.event_type);
  const activeUsers = new Set(events.map((event) => event.user_id).filter(Boolean)).size;

  return {
    generatedAt: new Date().toISOString(),
    access: {
      enabled: isAdminAnalyticsEnabled(),
      secretConfigured: Boolean(process.env.ADMIN_ANALYTICS_SECRET),
    },
    overview: {
      totalExtractions: extractions.length,
      instagramExtractions: sourceCounts.instagram ?? estimateByText(extractions, /instagram/i),
      uploadExtractions: sourceCounts.upload ?? estimateByText(extractions, /upload|uploaded/i),
      successfulExtractions: successful,
      failedExtractions: failed,
      successRate: extractions.length ? Math.round((successful / extractions.length) * 100) : 0,
      averageProcessingTime: null,
      collectionsCreated: collections.length,
      favoritesCreated: favorites.length,
      savedIdeas: favoriteCounts.catalog_item ?? 0,
      savedOpportunities: favoriteCounts.opportunity ?? 0,
      searchQueriesPerformed: searches.length,
    },
    pipeline: {
      ocrSuccessRate: null,
      aiSuccessRate: null,
      normalizationSuccessRate: null,
      linkEnrichmentSuccessRate: null,
      averageSlidesExtracted: average(extractions.map((item) => item.slideCount ?? 0)),
      averageCatalogItemsExtracted: average(extractions.map((item) => item.counts?.catalogItems ?? 0)),
      averageResourcesExtracted: average(extractions.map((item) => item.counts?.resources ?? 0)),
      averageOpportunitiesExtracted: average(extractions.map((item) => item.counts?.opportunities ?? 0)),
      recentFailures,
    },
    contentDistribution: contentCounts,
    collections: {
      total: collections.length,
      averageExtractionsPerCollection: average(collections.map((collection) => collection.extractionCount)),
      topCollections,
      popularNames: topTerms(collections.map((collection) => collection.name), 10),
    },
    favorites: {
      total: favorites.length,
      byType: favoriteCounts,
      topContent: topTerms(favorites.map((favorite) => favorite.itemTitle), 10),
    },
    search: {
      volume: searches.length,
      returningResults: searchWithResults,
      noResults: searches.length - searchWithResults,
      topTerms: topSearchTerms,
      recentSearches,
    },
    retention: {
      returningUsers: activeUsers || null,
      extractionsPerUser: null,
      collectionsPerUser: null,
      favoritesPerUser: null,
      savedIdeasPerUser: null,
      savedOpportunitiesPerUser: null,
      recentActiveUsers: activeUsers ? activeUsers : null,
    },
    intelligence: {
      mostExtractedResources: topMatches(extractions, "resource"),
      mostSavedResources: topTerms(favorites.filter((favorite) => favorite.targetType === "resource").map((favorite) => favorite.itemTitle), 10),
      mostSavedOpportunities: topTerms(favorites.filter((favorite) => favorite.targetType === "opportunity").map((favorite) => favorite.itemTitle), 10),
      mostSavedProjectIdeas: topTerms(favorites.filter((favorite) => favorite.targetType === "catalog_item").map((favorite) => favorite.itemTitle), 10),
      mostCommonConcepts: topMatches(extractions, "concept"),
      mostCommonCategories: topTerms(extractions.flatMap((item) => item.tags ?? []), 10),
    },
    quality: {
      lowQualityExtractions: extractions.filter((item) => /warning|low|incomplete/i.test(item.summary)).slice(0, 8),
      highWarningCountExtractions: [],
      missingOcr: [],
      missingAiOutput: [],
      failedLinkEnrichment: [],
      largeCatalogExtractions: extractions
        .filter((item) => (item.counts?.catalogItems ?? 0) >= 50)
        .map((item) => ({ id: item.id, title: item.title, count: item.counts?.catalogItems ?? 0 })),
    },
    system: {
      backendVersion: process.env.npm_package_version ?? "local",
      lastExtractionTime: newestDate(extractions.map((item) => item.createdAt)),
      supabaseConnected: Boolean(getSupabaseConfig()),
      storageConnected: Boolean(getSupabaseConfig()?.bucket),
      averageExtractionDuration: null,
      recentErrors: events.filter((event) => /failed|error/i.test(event.event_type)).slice(0, 8),
      recentFailures,
      uptimeSeconds: Math.round(process.uptime()),
      serverTime: new Date(now).toISOString(),
    },
    events: {
      counts: eventCounts,
      recent: events.slice(0, 20).map(fromEventRecord),
    },
  };
}

async function listAnalyticsEvents() {
  const config = getSupabaseConfig();
  if (!config) return memoryEvents.slice(0, 500);

  try {
    const response = await fetch(`${config.url}/rest/v1/analytics_events?select=*&order=created_at.desc&limit=500`, {
      headers: supabaseHeaders(config),
    });
    if (!response.ok) throw new Error(await supabaseErrorMessage(response, "Failed to load analytics events"));
    return response.json() as Promise<AnalyticsEventRecord[]>;
  } catch (error) {
    logger.warn(
      {
        event: "analytics_events_load_failed",
        message: error instanceof Error ? error.message : "Unknown analytics load failure",
      },
      "Analytics events fell back to memory",
    );
    return memoryEvents.slice(0, 500);
  }
}

function fromEventRecord(event: AnalyticsEventRecord) {
  return {
    id: event.id,
    eventType: event.event_type,
    userId: event.user_id,
    extractionId: event.extraction_id,
    metadata: event.metadata,
    createdAt: event.created_at,
  };
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = keyFn(item) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function topTerms(values: string[], limit: number) {
  return Object.entries(countBy(values.filter(Boolean), (value) => value.trim()))
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function topMatches(extractions: Awaited<ReturnType<typeof getAllExtractions>>, kind: string) {
  return topTerms(
    extractions.flatMap((item) =>
      (item.searchMatches ?? [])
        .filter((match) => match.kind === kind)
        .map((match) => match.text.split(/[.:-]/)[0]?.trim() ?? match.text),
    ),
    10,
  );
}

function average(values: number[]) {
  const useful = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!useful.length) return null;
  return Number((sum(useful) / useful.length).toFixed(1));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function newestDate(values: Array<string | undefined>) {
  const timestamps = values
    .map((value) => value ? new Date(value).getTime() : 0)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function estimateByText<T extends { title: string; summary: string }>(items: T[], pattern: RegExp) {
  return items.filter((item) => pattern.test(`${item.title} ${item.summary}`)).length;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
