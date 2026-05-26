import { getSupabaseConfig, supabaseHeaders, type SupabaseConfig } from "../lib/supabase";
import type { UploadedFile } from "../lib/multipart";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
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
    throw new Error(`Could not ensure Supabase storage bucket (${response.status}).`);
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
      throw new Error(`Failed to upload ${file.filename} to Supabase Storage (${response.status}).`);
    }

    uploadedPaths.push(path);
  }

  return uploadedPaths;
}
