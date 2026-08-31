const FORCE = process.env.NEXT_PUBLIC_FORCE_DEMO === "true";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  if (FORCE) return false;
  return URL.startsWith("https://") && KEY.length > 20;
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
