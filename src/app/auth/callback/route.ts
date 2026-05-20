import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Normalize: ensure /beta prefix exactly once.
  const bare = rawNext.startsWith("/beta") ? rawNext.slice(5) || "/" : rawNext;
  const target = `/beta${bare.startsWith("/") ? bare : `/${bare}`}`.replace(/\/+$/, "") || "/beta";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.url;
      return NextResponse.redirect(new URL(target, base));
    }
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.url;
  return NextResponse.redirect(new URL("/beta/login?error=oauth_failed", base));
}
