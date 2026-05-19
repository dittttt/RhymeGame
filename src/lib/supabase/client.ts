import { createBrowserClient } from "@supabase/ssr";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.RHYMEGAME_SUPABASE_URL ??
  "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.RHYMEGAME_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(url && anonKey);

export function createClient() {
  return createBrowserClient(url, anonKey);
}
