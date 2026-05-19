import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.RHYMEGAME_SUPABASE_URL ??
  "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.RHYMEGAME_SUPABASE_ANON_KEY ??
  "";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — middleware will refresh the session.
        }
      },
    },
  });
}
