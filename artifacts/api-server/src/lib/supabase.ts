export type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "carouselbrain-uploads";

  if (!url && !serviceRoleKey) {
    return null;
  }

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase configuration is incomplete. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey, bucket };
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return config;
}

export function supabaseHeaders(config: SupabaseConfig, contentType?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    Accept: "application/json",
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export async function supabaseErrorMessage(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `${fallback} (${response.status}).`;
  }

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
      error_description?: string;
    };
    const message = payload.message ?? payload.error_description ?? payload.error;
    return `${fallback} (${response.status})${message ? `: ${message}` : "."}`;
  } catch {
    return `${fallback} (${response.status}).`;
  }
}
