export type SupabaseBrowserConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url && !anonKey) {
    return null;
  }

  if (!url || !anonKey) {
    throw new Error("Supabase browser configuration is incomplete.");
  }

  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
  };
}
