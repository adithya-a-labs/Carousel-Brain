import { logger } from "../lib/logger";

export type InstagramMediaItem = {
  url: string;
  type: "image" | "video";
  index: number;
};

export type InstagramMediaResult = {
  sourceUrl: string;
  caption?: string;
  username?: string;
  media: InstagramMediaItem[];
  providerMetadata?: Record<string, unknown>;
};

type ApifyConfig = {
  token: string;
  actorId: string;
};

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const BODY_PREVIEW_LIMIT = 1500;

export class InstagramProviderError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "InstagramProviderError";
    this.code = code;
    this.details = details;
  }
}

export function getInstagramProviderDiagnostics() {
  return {
    apifyTokenExists: Boolean(process.env.APIFY_TOKEN),
    apifyActorId: process.env.APIFY_INSTAGRAM_ACTOR_ID ?? null,
  };
}

function getApifyConfig(): ApifyConfig {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_INSTAGRAM_ACTOR_ID;

  if (!token || !actorId) {
    throw new InstagramProviderError(
      "INSTAGRAM_PROVIDER_NOT_CONFIGURED",
      "Instagram provider is not configured. Set APIFY_TOKEN and APIFY_INSTAGRAM_ACTOR_ID.",
      getInstagramProviderDiagnostics(),
    );
  }

  return { token, actorId };
}

export function normalizeInstagramUrl(instagramUrl: string) {
  let parsed: URL;
  const rawUrl = instagramUrl;
  const trimmedUrl = instagramUrl.trim();

  try {
    parsed = new URL(trimmedUrl);
  } catch {
    throw new InstagramProviderError("INVALID_INSTAGRAM_URL", "The Instagram URL format is not supported.", {
      branch: "url_parse_failed",
      rawUrl,
      normalizedUrl: trimmedUrl,
    });
  }

  parsed.hash = "";
  parsed.search = "";

  const normalizedPathname = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`;
  parsed.pathname = normalizedPathname;

  return parsed.toString();
}

export function validateInstagramUrl(instagramUrl: string) {
  const normalizedUrl = normalizeInstagramUrl(instagramUrl);
  const parsed = new URL(normalizedUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol !== "https:") {
    throw new InstagramProviderError("INVALID_INSTAGRAM_URL", "The Instagram URL format is not supported.", {
      branch: "invalid_protocol",
      normalizedUrl,
      protocol: parsed.protocol,
    });
  }

  if (!INSTAGRAM_HOSTS.has(hostname)) {
    throw new InstagramProviderError("INVALID_INSTAGRAM_URL", "The Instagram URL format is not supported.", {
      branch: "invalid_hostname",
      normalizedUrl,
      hostname,
    });
  }

  if (!/^\/(p|reel|tv)\//i.test(parsed.pathname)) {
    throw new InstagramProviderError("INVALID_INSTAGRAM_URL", "The Instagram URL format is not supported.", {
      branch: "unsupported_path",
      normalizedUrl,
      pathname: parsed.pathname,
    });
  }

  return normalizedUrl;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function pushMedia(media: InstagramMediaItem[], url: unknown, type: "image" | "video" = "image") {
  if (typeof url !== "string" || !url.trim()) return;
  if (media.some((item) => item.url === url)) return;
  media.push({ url, type, index: media.length + 1 });
}

function mediaTypeFromActorValue(value: unknown): "image" | "video" {
  const mediaType = typeof value === "string" ? value.toLowerCase() : "";

  if (["photo", "image", "picture"].includes(mediaType)) return "image";
  if (["video", "reel", "reels", "igtv"].includes(mediaType)) return "video";
  if (mediaType.includes("video") || mediaType.includes("reel")) return "video";

  return "image";
}

function collectIgviewOwnerRecord(record: Record<string, unknown>, media: InstagramMediaItem[]) {
  const url = record.download_url ?? record.thumbnail_url;
  pushMedia(media, url, mediaTypeFromActorValue(record.media_type));
}

function isIgviewOwnerRecord(record: Record<string, unknown>) {
  return (
    "download_url" in record ||
    "thumbnail_url" in record ||
    "media_type" in record ||
    "shortcode" in record
  );
}

function collectFromRecord(record: Record<string, unknown>, media: InstagramMediaItem[]) {
  pushMedia(media, record.displayUrl);
  pushMedia(media, record.display_url);
  pushMedia(media, record.imageUrl);
  pushMedia(media, record.image_url);
  pushMedia(media, record.thumbnailUrl);
  pushMedia(media, record.thumbnail_url);
  pushMedia(media, record.url, textField(record, ["type", "mediaType"])?.toLowerCase().includes("video") ? "video" : "image");
  pushMedia(media, record.videoUrl, "video");
  pushMedia(media, record.video_url, "video");

  for (const key of ["images", "childPosts", "carouselMedia", "carousel_media", "sidecarChildren", "latestPosts"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          pushMedia(media, item);
        } else if (isRecord(item)) {
          collectFromRecord(item, media);
        }
      }
    }
  }
}

function safePreview(value: unknown) {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === "string" && nestedValue.length > 300) {
      return `${nestedValue.slice(0, 300)}...`;
    }
    return nestedValue;
  })?.slice(0, BODY_PREVIEW_LIMIT);
}

function sourceLooksCarousel(records: Array<Record<string, unknown>>, normalizedCount: number) {
  if (records.length > 1) return true;
  if (normalizedCount > 1) return true;

  return records.some((record) => {
    const mediaType = textField(record, ["media_type", "type", "mediaType"])?.toLowerCase() ?? "";
    const title = textField(record, ["title", "caption", "description"])?.toLowerCase() ?? "";
    return mediaType.includes("carousel") || title.includes("carousel");
  });
}

function normalizeApifyResults(sourceUrl: string, items: unknown[], actorId: string): InstagramMediaResult {
  const records = items.filter(isRecord);
  const primary = records[0] ?? {};
  const media: InstagramMediaItem[] = [];
  const actorSpecificRecords = records.filter(isIgviewOwnerRecord);
  const parsingStrategies = [
    "igview-owner top-level dataset items: download_url",
    "igview-owner top-level dataset items: thumbnail_url",
    "displayUrl",
    "display_url",
    "imageUrl",
    "image_url",
    "thumbnailUrl",
    "thumbnail_url",
    "url",
    "videoUrl",
    "video_url",
    "images",
    "childPosts",
    "carouselMedia",
    "carousel_media",
    "sidecarChildren",
    "latestPosts",
  ];

  logger.info(
    {
      event: "instagram_provider_normalize_start",
      sourceUrl,
      resultCount: items.length,
      recordCount: records.length,
      primaryKeys: Object.keys(primary).slice(0, 40),
      parsingStrategies,
      actorSpecificRecordCount: actorSpecificRecords.length,
    },
    "Normalizing Instagram provider response",
  );

  const providerError = records.find((record) => record.error === true);
  if (providerError) {
    logger.warn(
      {
        event: "instagram_provider_dataset_error",
        sourceUrl,
        resultCount: items.length,
        providerMessage: textField(providerError, ["message", "errorMessage", "error"]),
        providerPreview: safePreview(providerError),
      },
      "Instagram provider returned an error dataset item",
    );
    throw new InstagramProviderError(
      "INSTAGRAM_PROVIDER_DATASET_ERROR",
      textField(providerError, ["message", "errorMessage", "error"]) ??
        "Instagram provider returned an error dataset item.",
      {
        normalizedUrl: sourceUrl,
        resultCount: items.length,
        providerPreview: safePreview(providerError),
      },
    );
  }

  if (actorSpecificRecords.length > 0) {
    for (const record of actorSpecificRecords) {
      collectIgviewOwnerRecord(record, media);
    }
  } else {
    for (const record of records) {
      collectFromRecord(record, media);
    }
  }

  const normalized = media.slice(0, 10).map((item, index) => ({
    ...item,
    index: index + 1,
  }));
  const imageCount = normalized.filter((item) => item.type === "image").length;

  if (normalized.length === 0) {
    logger.warn(
      {
        event: "instagram_provider_no_media",
        sourceUrl,
        resultCount: items.length,
        recordCount: records.length,
        parsingStrategies,
        providerPreview: safePreview(items),
      },
      "No carousel media extracted from provider response",
    );
    throw new InstagramProviderError(
      "INSTAGRAM_MEDIA_NOT_FOUND",
      "No carousel media extracted from provider response.",
      {
        normalizedUrl: sourceUrl,
        resultCount: items.length,
        recordCount: records.length,
        parsingStrategies,
        providerPreview: safePreview(items),
      },
    );
  }

  if (imageCount === 0) {
    logger.warn(
      {
        event: "instagram_provider_no_image_media",
        sourceUrl,
        resultCount: items.length,
        recordCount: records.length,
        videoCount: normalized.filter((item) => item.type === "video").length,
        providerPreview: safePreview(items),
      },
      "No image media extracted from provider response",
    );
    throw new InstagramProviderError("NO_IMAGE_MEDIA_FOUND", "No image media found for this Instagram post.", {
      normalizedUrl: sourceUrl,
      resultCount: items.length,
      recordCount: records.length,
      mediaCount: normalized.length,
      providerPreview: safePreview(items),
    });
  }

  if (normalized.length === 1 && sourceLooksCarousel(records, normalized.length)) {
    logger.warn(
      {
        event: "instagram_provider_single_media_for_carousel_like_source",
        sourceUrl,
        resultCount: items.length,
        recordCount: records.length,
        mediaCount: normalized.length,
        shortcode: textField(primary, ["shortcode"]),
      },
      "Only one media item extracted from a carousel-like provider response",
    );
  }

  logger.info(
    {
      event: "instagram_provider_normalize_success",
      sourceUrl,
      mediaCount: normalized.length,
      imageCount,
      videoCount: normalized.filter((item) => item.type === "video").length,
      actorSpecificRecordCount: actorSpecificRecords.length,
    },
    "Instagram provider response normalized",
  );

  return {
    sourceUrl: textField(primary, ["source_url", "input_url", "sourceUrl", "url"]) ?? sourceUrl,
    caption: textField(primary, ["title", "caption", "description", "text", "alt"]),
    username: textField(primary, ["ownerUsername", "username", "owner", "profileName", "userFullName"]),
    media: normalized,
    providerMetadata: {
      provider: "apify",
      actorId,
      itemCount: records.length,
      actorFields: Object.keys(primary).slice(0, 30),
      shortcode: textField(primary, ["shortcode"]),
    },
  };
}

export async function fetchInstagramMedia(instagramUrl: string): Promise<InstagramMediaResult> {
  const sourceUrl = validateInstagramUrl(instagramUrl);
  const config = getApifyConfig();
  const actorId = encodeURIComponent(config.actorId.replace(/\//g, "~"));
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?timeout=120`;

  logger.info(
    {
      event: "instagram_apify_request_start",
      sourceUrl,
      apifyTokenExists: true,
      apifyActorId: config.actorId,
    },
    "Starting Apify Instagram request",
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      instagram_urls: [sourceUrl],
      url: sourceUrl,
      input_url: sourceUrl,
      directUrls: [sourceUrl],
      startUrls: [{ url: sourceUrl }],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
    }),
  });

  const responseBody = await response.text();

  logger.info(
    {
      event: "instagram_apify_request_end",
      sourceUrl,
      apifyActorId: config.actorId,
      status: response.status,
      ok: response.ok,
      bodyPreview: responseBody.slice(0, BODY_PREVIEW_LIMIT),
    },
    "Finished Apify Instagram request",
  );

  if (!response.ok) {
    throw new InstagramProviderError(
      "INSTAGRAM_PROVIDER_REQUEST_FAILED",
      `Instagram provider could not fetch this post (${response.status}).`,
      {
        normalizedUrl: sourceUrl,
        status: response.status,
        responsePreview: responseBody.slice(0, BODY_PREVIEW_LIMIT),
        apifyActorId: config.actorId,
      },
    );
  }

  let items: unknown;
  try {
    items = JSON.parse(responseBody) as unknown;
  } catch {
    throw new InstagramProviderError("INSTAGRAM_PROVIDER_BAD_JSON", "Instagram provider returned invalid JSON.", {
      normalizedUrl: sourceUrl,
      responsePreview: responseBody.slice(0, BODY_PREVIEW_LIMIT),
    });
  }

  if (!Array.isArray(items)) {
    logger.warn(
      {
        event: "instagram_provider_unexpected_shape",
        sourceUrl,
        responsePreview: safePreview(items),
      },
      "Instagram provider returned an unexpected response shape",
    );
    throw new InstagramProviderError(
      "INSTAGRAM_PROVIDER_UNEXPECTED_RESPONSE",
      "Instagram provider returned an unexpected response.",
      {
        normalizedUrl: sourceUrl,
        responsePreview: safePreview(items),
      },
    );
  }

  return normalizeApifyResults(sourceUrl, items, config.actorId);
}
