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

function getApifyConfig(): ApifyConfig {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_INSTAGRAM_ACTOR_ID;

  if (!token || !actorId) {
    throw new Error("Instagram provider is not configured. Set APIFY_TOKEN and APIFY_INSTAGRAM_ACTOR_ID.");
  }

  return { token, actorId };
}

export function validateInstagramUrl(instagramUrl: string) {
  let parsed: URL;

  try {
    parsed = new URL(instagramUrl);
  } catch {
    throw new Error("Paste a valid Instagram carousel URL.");
  }

  if (parsed.protocol !== "https:" || !INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Paste a valid Instagram carousel URL.");
  }

  if (!/^\/(p|reel|tv)\//i.test(parsed.pathname)) {
    throw new Error("Paste a valid Instagram carousel URL.");
  }

  return parsed.toString();
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

function normalizeApifyResults(sourceUrl: string, items: unknown[]): InstagramMediaResult {
  const records = items.filter(isRecord);
  const primary = records[0] ?? {};
  const media: InstagramMediaItem[] = [];

  for (const record of records) {
    collectFromRecord(record, media);
  }

  const normalized = media.slice(0, 10).map((item, index) => ({
    ...item,
    index: index + 1,
  }));

  if (normalized.length === 0) {
    throw new Error("We could not find downloadable carousel images for this Instagram post.");
  }

  return {
    sourceUrl,
    caption: textField(primary, ["caption", "description", "text", "alt"]),
    username: textField(primary, ["ownerUsername", "username", "owner", "profileName", "userFullName"]),
    media: normalized,
    providerMetadata: {
      provider: "apify",
      itemCount: records.length,
      actorFields: Object.keys(primary).slice(0, 30),
    },
  };
}

export async function fetchInstagramMedia(instagramUrl: string): Promise<InstagramMediaResult> {
  const sourceUrl = validateInstagramUrl(instagramUrl);
  const config = getApifyConfig();
  const actorId = encodeURIComponent(config.actorId.replace(/\//g, "~"));
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?timeout=120`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      directUrls: [sourceUrl],
      startUrls: [{ url: sourceUrl }],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Instagram provider could not fetch this post (${response.status}).`);
  }

  const items = (await response.json()) as unknown;
  if (!Array.isArray(items)) {
    throw new Error("Instagram provider returned an unexpected response.");
  }

  return normalizeApifyResults(sourceUrl, items);
}
