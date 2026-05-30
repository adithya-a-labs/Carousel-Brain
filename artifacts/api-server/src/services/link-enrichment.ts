import { logger } from "../lib/logger";
import type { CanonicalExtractionPayload } from "./ai-normalizer";

type SearchCandidate = {
  title: string;
  url: string;
  description?: string;
};

type EnrichmentStatus = "verified" | "suggested" | "not_found" | "skipped";

type LinkEnrichment = {
  enrichedUrl: string | null;
  enrichedLinkLabel: string | null;
  enrichmentConfidence: number | null;
  enrichmentReason: string | null;
  enrichmentSource: "web_search";
  enrichmentStatus: EnrichmentStatus;
};

type EnrichableItem = Record<string, unknown> & {
  title?: string;
  text?: string;
  type?: string;
  category?: string;
  organization?: string;
  evidenceText?: string;
  reason?: string;
  bestFor?: string;
  applyUrl?: string | null;
  url?: string | null;
  link?: string | null;
  linkStatus?: string;
  techStack?: string[];
};

type SearchConfig =
  | {
      provider: "brave";
      apiKey: string;
      endpoint: string;
    }
  | {
      provider: "tavily";
      apiKey: string;
      endpoint: string;
    }
  | {
      provider: "generic";
      apiKey?: string;
      endpoint: string;
    };

const MAX_ITEMS_PER_EXTRACTION = 18;
const MIN_CONFIDENCE = 0.78;
const TRUSTED_HOSTS = [
  "github.com",
  "docs.github.com",
  "openai.com",
  "platform.openai.com",
  "docs.pinecone.io",
  "pinecone.io",
  "supabase.com",
  "docs.cursor.com",
  "cursor.com",
  "huggingface.co",
  "anthropic.com",
  "docs.anthropic.com",
];
const SEO_HOST_PATTERNS = /(medium\.com|dev\.to|hashnode|substack|towardsdatascience|geeksforgeeks|tutorialspoint|wikipedia|reddit|quora)/i;

export async function enrichPayloadLinks(input: {
  extractionId: string;
  payload: CanonicalExtractionPayload;
  context?: {
    title?: string;
    summary?: string;
    contentType?: string;
  };
}): Promise<CanonicalExtractionPayload> {
  const config = getSearchConfig();
  const enrichedAt = new Date().toISOString();

  if (!config) {
    return withMetadata(input.payload, {
      linkEnrichment: {
        status: "skipped",
        reason: "search_provider_not_configured",
        enrichedAt,
      },
    });
  }

  let searched = 0;
  let enriched = 0;
  let skipped = 0;
  let notFound = 0;
  const cache = new Map<string, SearchCandidate[]>();

  const blocks = [];
  for (const block of input.payload.blocks) {
    if (block.kind === "resources") {
      const groups = Array.isArray(block.groups) ? block.groups : [];
      blocks.push({
        ...block,
        groups: await Promise.all(groups.map(async (group) => {
          const items = Array.isArray(group.items) ? group.items : [];
          const enrichedItems = [];
          for (const item of items as EnrichableItem[]) {
            const result = await enrichItemIfUseful({
              item,
              mode: block.title?.toLowerCase().includes("opportun") || item.type === "Opportunity" || Boolean(item.applyUrl)
                ? "opportunity"
                : "resource",
              config,
              context: input.context,
              cache,
              canSearch: searched < MAX_ITEMS_PER_EXTRACTION,
            });
            if (result.searched) searched += 1;
            if (result.status === "enriched") enriched += 1;
            if (result.status === "skipped") skipped += 1;
            if (result.status === "not_found") notFound += 1;
            enrichedItems.push(result.item);
          }
          return { ...group, items: enrichedItems };
        })),
      });
      continue;
    }

    if (block.kind === "catalog_grid") {
      const items = Array.isArray(block.items) ? block.items : [];
      const enrichedItems = [];
      for (const item of items as EnrichableItem[]) {
        const result = await enrichItemIfUseful({
          item,
          mode: "catalog",
          config,
          context: input.context,
          cache,
          canSearch: searched < MAX_ITEMS_PER_EXTRACTION,
        });
        if (result.searched) searched += 1;
        if (result.status === "enriched") enriched += 1;
        if (result.status === "skipped") skipped += 1;
        if (result.status === "not_found") notFound += 1;
        enrichedItems.push(result.item);
      }
      blocks.push({ ...block, items: enrichedItems });
      continue;
    }

    blocks.push(block);
  }

  const payload = withMetadata(
    {
      ...input.payload,
      blocks,
    },
    {
      linkEnrichment: {
        status: "complete",
        provider: config.provider,
        enrichedAt,
        searched,
        enriched,
        skipped,
        notFound,
        minConfidence: MIN_CONFIDENCE,
      },
    },
  );

  logger.info(
    {
      event: "link_enrichment_complete",
      extractionId: input.extractionId,
      provider: config.provider,
      searched,
      enriched,
      skipped,
      notFound,
    },
    "Link enrichment completed",
  );

  return payload;
}

async function enrichItemIfUseful(input: {
  item: EnrichableItem;
  mode: "resource" | "opportunity" | "catalog";
  config: SearchConfig;
  context?: {
    title?: string;
    summary?: string;
    contentType?: string;
  };
  cache: Map<string, SearchCandidate[]>;
  canSearch: boolean;
}): Promise<{
  item: EnrichableItem & Partial<LinkEnrichment>;
  status: "enriched" | "not_found" | "skipped";
  searched: boolean;
}> {
  if (hasOriginalUsableLink(input.item)) {
    return { item: withEnrichment(input.item, skipped("original_link_present")), status: "skipped", searched: false };
  }

  const usefulness = shouldEnrich(input.item, input.mode);
  if (!usefulness.enrich) {
    return { item: withEnrichment(input.item, skipped(usefulness.reason)), status: "skipped", searched: false };
  }

  if (!input.canSearch) {
    return { item: withEnrichment(input.item, skipped("per_extraction_search_limit_reached")), status: "skipped", searched: false };
  }

  const query = buildSearchQuery(input.item, input.mode, input.context);
  if (!query) {
    return { item: withEnrichment(input.item, skipped("insufficient_query_context")), status: "skipped", searched: false };
  }

  const candidates = await searchCandidates(query, input.config, input.cache);
  const best = chooseBestCandidate(input.item, input.mode, candidates);

  if (!best || best.confidence < MIN_CONFIDENCE) {
    return {
      item: withEnrichment(input.item, {
        enrichedUrl: null,
        enrichedLinkLabel: null,
        enrichmentConfidence: best?.confidence ?? null,
        enrichmentReason: best?.reason ?? "No high-confidence official result found.",
        enrichmentSource: "web_search",
        enrichmentStatus: "not_found",
      }),
      status: "not_found",
      searched: true,
    };
  }

  return {
    item: withEnrichment(input.item, {
      enrichedUrl: best.url,
      enrichedLinkLabel: best.label,
      enrichmentConfidence: best.confidence,
      enrichmentReason: best.reason,
      enrichmentSource: "web_search",
      enrichmentStatus: best.confidence >= 0.88 ? "verified" : "suggested",
    }),
    status: "enriched",
    searched: true,
  };
}

function getSearchConfig(): SearchConfig | undefined {
  const explicitEndpoint = process.env.LINK_ENRICHMENT_SEARCH_API_URL?.trim();
  const explicitKey = process.env.LINK_ENRICHMENT_SEARCH_API_KEY?.trim();
  const provider = process.env.LINK_ENRICHMENT_SEARCH_PROVIDER?.trim().toLowerCase();

  if (provider === "generic" && explicitEndpoint) {
    return { provider: "generic", apiKey: explicitKey, endpoint: explicitEndpoint };
  }

  const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim() || (provider === "brave" ? explicitKey : undefined);
  if (braveKey) {
    return {
      provider: "brave",
      apiKey: braveKey,
      endpoint: explicitEndpoint || "https://api.search.brave.com/res/v1/web/search",
    };
  }

  const tavilyKey = process.env.TAVILY_API_KEY?.trim() || (provider === "tavily" ? explicitKey : undefined);
  if (tavilyKey) {
    return {
      provider: "tavily",
      apiKey: tavilyKey,
      endpoint: explicitEndpoint || "https://api.tavily.com/search",
    };
  }

  return undefined;
}

async function searchCandidates(query: string, config: SearchConfig, cache: Map<string, SearchCandidate[]>) {
  const cached = cache.get(query);
  if (cached) return cached;

  let candidates: SearchCandidate[] = [];
  if (config.provider === "brave") {
    const url = new URL(config.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("count", "5");
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": config.apiKey,
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Link enrichment search failed with ${response.status}: ${text.slice(0, 160)}`);
    const payload = safeJson(text);
    const results = asArray(asRecord(payload)?.web && asRecord(asRecord(payload)?.web)?.results);
    candidates = results.map((result) => ({
      title: cleanString(asRecord(result)?.title),
      url: cleanString(asRecord(result)?.url),
      description: cleanString(asRecord(result)?.description),
    }));
  } else if (config.provider === "tavily") {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: 5,
        search_depth: "basic",
        include_answer: false,
      }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Link enrichment search failed with ${response.status}: ${text.slice(0, 160)}`);
    const payload = safeJson(text);
    const results = asArray(asRecord(payload)?.results);
    candidates = results.map((result) => ({
      title: cleanString(asRecord(result)?.title),
      url: cleanString(asRecord(result)?.url),
      description: cleanString(asRecord(result)?.content),
    }));
  } else {
    const url = new URL(config.endpoint);
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Link enrichment search failed with ${response.status}: ${text.slice(0, 160)}`);
    candidates = parseGenericSearchResults(safeJson(text));
  }

  candidates = candidates
    .filter((candidate) => candidate.title && candidate.url && isUsableLink(candidate.url))
    .slice(0, 5);
  cache.set(query, candidates);
  return candidates;
}

function shouldEnrich(item: EnrichableItem, mode: "resource" | "opportunity" | "catalog") {
  const text = itemText(item);
  if (!cleanString(item.title) && !cleanString(item.text)) {
    return { enrich: false, reason: "missing_item_title" };
  }

  if (mode === "opportunity") {
    return { enrich: true, reason: "opportunity_links_improve_application_flow" };
  }

  if (mode === "resource") {
    if (/\b(api|docs?|documentation|github|repo|repository|tool|website|course|book|library|platform|sdk|database|framework)\b/i.test(text)) {
      return { enrich: true, reason: "resource_item_with_actionable_source_context" };
    }
    return { enrich: false, reason: "resource_not_specific_enough_for_safe_link" };
  }

  if (/\b(github|repo|repository|source code|official docs?|documentation|api|tool|library)\b/i.test(text)) {
    return { enrich: true, reason: "catalog_item_mentions_specific_source_or_tool" };
  }

  return { enrich: false, reason: "catalog_item_is_idea_without_explicit_source" };
}

function buildSearchQuery(
  item: EnrichableItem,
  mode: "resource" | "opportunity" | "catalog",
  context?: {
    title?: string;
    summary?: string;
    contentType?: string;
  },
) {
  const title = cleanString(item.title) || cleanString(item.text);
  const type = cleanString(item.type) || cleanString(item.category);
  const organization = cleanString(item.organization);
  const evidence = cleanString(item.evidenceText).slice(0, 120);
  const sourceTitle = cleanString(context?.title);
  const parts = [title];

  if (mode === "opportunity") {
    parts.push(organization, "apply", "official");
  } else if (/github|repo|repository/i.test(`${title} ${type} ${evidence}`)) {
    parts.push("GitHub");
  } else if (/api|docs?|documentation/i.test(`${title} ${type} ${evidence}`)) {
    parts.push("official docs");
  } else {
    parts.push(type, "official");
  }

  if (organization && mode !== "opportunity") parts.push(organization);
  if (sourceTitle && mode === "catalog" && /github|source code|repo/i.test(sourceTitle)) parts.push(sourceTitle);
  if (evidence && mode !== "catalog") parts.push(evidence);

  return compact(parts).join(" ").replace(/\s+/g, " ").slice(0, 220);
}

function chooseBestCandidate(item: EnrichableItem, mode: "resource" | "opportunity" | "catalog", candidates: SearchCandidate[]) {
  const scored = candidates
    .filter((candidate) => !SEO_HOST_PATTERNS.test(hostname(candidate.url)))
    .map((candidate) => scoreCandidate(item, mode, candidate))
    .sort((a, b) => b.confidence - a.confidence);

  return scored[0];
}

function scoreCandidate(item: EnrichableItem, mode: "resource" | "opportunity" | "catalog", candidate: SearchCandidate) {
  const title = cleanString(item.title) || cleanString(item.text);
  const organization = cleanString(item.organization);
  const itemTokens = meaningfulTokens(`${title} ${organization}`);
  const candidateText = `${candidate.title} ${candidate.description ?? ""} ${candidate.url}`.toLowerCase();
  const host = hostname(candidate.url);
  let score = 0.28;
  let reason = "Candidate matched item context.";

  const tokenMatches = itemTokens.filter((token) => candidateText.includes(token)).length;
  score += Math.min(0.32, tokenMatches * 0.08);

  if (TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`))) {
    score += 0.18;
    reason = "Trusted official or developer source matched the item.";
  }

  if (/github|repo|repository/i.test(itemText(item))) {
    const repoMatch = githubRepoMatch(title, candidate.url, candidate.title);
    if (host === "github.com" && repoMatch >= 0.6) {
      score += 0.32;
      reason = "GitHub repository result strongly matched the extracted item.";
    } else if (host !== "github.com") {
      score -= 0.24;
    }
  }

  if (/api|docs?|documentation/i.test(itemText(item)) && /(docs?|developers?|api|reference)/i.test(candidate.url + candidate.title)) {
    score += 0.18;
    reason = "Documentation/API page matched the extracted resource.";
  }

  if (mode === "opportunity") {
    if (organization && candidateText.includes(organization.toLowerCase())) score += 0.2;
    if (/(apply|application|program|fellowship|internship|grant|scholarship)/i.test(candidateText)) score += 0.12;
    if (!organization && itemTokens.length < 2) score -= 0.18;
    reason = "Opportunity result matched organization or application context.";
  }

  if (mode === "catalog" && !/github|repo|repository|source code|docs?|api|tool|library/i.test(itemText(item))) {
    score -= 0.25;
  }

  return {
    url: candidate.url,
    label: labelForCandidate(candidate),
    confidence: clamp01(score),
    reason,
  };
}

function withMetadata(payload: CanonicalExtractionPayload, metadata: Record<string, unknown>): CanonicalExtractionPayload {
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      ...metadata,
    },
  };
}

function withEnrichment(item: EnrichableItem, enrichment: LinkEnrichment): EnrichableItem & LinkEnrichment {
  return {
    ...item,
    ...enrichment,
  };
}

function skipped(reason: string): LinkEnrichment {
  return {
    enrichedUrl: null,
    enrichedLinkLabel: null,
    enrichmentConfidence: null,
    enrichmentReason: reason,
    enrichmentSource: "web_search",
    enrichmentStatus: "skipped",
  };
}

function hasOriginalUsableLink(item: EnrichableItem) {
  return isUsableLink(cleanString(item.applyUrl)) || isUsableLink(cleanString(item.url)) || isUsableLink(cleanString(item.link));
}

function isUsableLink(value: string) {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value) || /^www\.[^\s]+\.[^\s]+/i.test(value);
}

function parseGenericSearchResults(payload: unknown): SearchCandidate[] {
  const record = asRecord(payload);
  const candidates = asArray(record?.results ?? record?.items ?? record?.webPages);
  return candidates.map((candidate) => {
    const result = asRecord(candidate);
    return {
      title: cleanString(result?.title ?? result?.name),
      url: cleanString(result?.url ?? result?.link),
      description: cleanString(result?.description ?? result?.snippet ?? result?.content),
    };
  });
}

function githubRepoMatch(title: string, url: string, candidateTitle: string) {
  const urlMatch = /github\.com\/([^/\s]+)\/([^/\s?#]+)/i.exec(url);
  if (!urlMatch) return 0;
  const repo = `${urlMatch[1]} ${urlMatch[2]}`.toLowerCase();
  const titleTokens = meaningfulTokens(`${title} ${candidateTitle}`);
  if (!titleTokens.length) return 0;
  return titleTokens.filter((token) => repo.includes(token)).length / titleTokens.length;
}

function labelForCandidate(candidate: SearchCandidate) {
  const host = hostname(candidate.url).replace(/^www\./, "");
  if (/docs?|documentation|api/i.test(candidate.title + candidate.url)) return `Docs on ${host}`;
  if (host === "github.com") return "GitHub repository";
  return `Suggested source on ${host}`;
}

function meaningfulTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[@#]+/, ""))
    .filter((token) => token.length >= 3)
    .filter((token) => !["the", "and", "for", "with", "official", "docs", "api", "apply", "resource", "tool"].includes(token))
    .slice(0, 8);
}

function itemText(item: EnrichableItem) {
  return [
    item.title,
    item.text,
    item.type,
    item.category,
    item.organization,
    item.reason,
    item.bestFor,
    item.evidenceText,
    ...(Array.isArray(item.techStack) ? item.techStack : []),
  ].filter(Boolean).join(" ");
}

function hostname(url: string) {
  try {
    return new URL(/^www\./i.test(url) ? `https://${url}` : url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function compact(values: unknown[]) {
  return values.map(cleanString).filter(Boolean);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}
