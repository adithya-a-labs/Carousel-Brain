import {
  getSupabaseConfig,
  supabaseErrorMessage,
  supabaseHeaders,
  type SupabaseConfig,
} from "../lib/supabase";
import type { UploadedFile } from "../lib/multipart";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_REMOTE_MEDIA_BYTES = 25 * 1024 * 1024;

type InstagramMediaUpload = {
  index: number;
  contentType: string;
  buffer: Buffer;
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function extensionForContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export function validateUploadFiles(files: UploadedFile[]) {
  if (files.length === 0) {
    throw new Error("At least one carousel image is required.");
  }

  for (const file of files) {
    if (!IMAGE_TYPES.has(file.contentType)) {
      throw new Error(`Unsupported file type for ${file.filename}. Upload PNG, JPG, or WEBP images.`);
    }
  }
}

export async function ensureStorageBucket(config: SupabaseConfig) {
  const response = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: supabaseHeaders(config, "application/json"),
    body: JSON.stringify({
      id: config.bucket,
      name: config.bucket,
      public: false,
    }),
  });

  if (!response.ok && response.status !== 409 && response.status !== 400) {
    throw new Error(await supabaseErrorMessage(response, "Could not ensure Supabase storage bucket"));
  }
}

export async function uploadExtractionSlides(extractionId: string, files: UploadedFile[]) {
  validateUploadFiles(files);

  const config = getSupabaseConfig();
  const uploadedPaths: string[] = [];

  if (!config) {
    return files.map((file, index) => {
      return `extractions/${extractionId}/slides/${String(index + 1).padStart(2, "0")}-${safeFileName(file.filename)}`;
    });
  }

  await ensureStorageBucket(config);

  for (const [index, file] of files.entries()) {
    const path = `extractions/${extractionId}/slides/${String(index + 1).padStart(2, "0")}-${safeFileName(file.filename)}`;
    const response = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${path}`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(config, file.contentType),
        "x-upsert": "true",
      },
      body: file.buffer,
    });

    if (!response.ok) {
      throw new Error(await supabaseErrorMessage(response, `Failed to upload ${file.filename} to Supabase Storage`));
    }

    uploadedPaths.push(path);
  }

  return uploadedPaths;
}

async function uploadObject(path: string, contentType: string, buffer: Buffer) {
  const config = getSupabaseConfig();

  if (!config) {
    return path;
  }

  await ensureStorageBucket(config);

  const response = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${path}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config, contentType),
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(await supabaseErrorMessage(response, "Failed to upload Instagram media to Supabase Storage"));
  }

  return path;
}

export async function downloadInstagramImages(media: Array<{ url: string; type: "image" | "video"; index: number }>) {
  const images: InstagramMediaUpload[] = [];

  for (const item of media.slice(0, 10)) {
    if (item.type !== "image") continue;

    const response = await fetch(item.url, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
        "User-Agent": "CarouselBrain/1.0",
      },
    });

    if (!response.ok) continue;

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (!IMAGE_TYPES.has(contentType)) continue;
    if (contentLength > MAX_REMOTE_MEDIA_BYTES) continue;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_REMOTE_MEDIA_BYTES) continue;

    images.push({
      index: item.index,
      contentType,
      buffer: Buffer.from(arrayBuffer),
    });
  }

  if (images.length === 0) {
    throw new Error("We could not fetch supported images from this Instagram post.");
  }

  return images.slice(0, 10);
}

export async function uploadInstagramImages(extractionId: string, images: InstagramMediaUpload[]) {
  const paths: string[] = [];

  for (const image of images) {
    const ext = extensionForContentType(image.contentType);
    const path = `extractions/${extractionId}/slides/${String(image.index).padStart(2, "0")}-instagram.${ext}`;
    paths.push(await uploadObject(path, image.contentType, image.buffer));
  }

  return paths;
}
