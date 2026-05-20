import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/multiplayer", "/profile"];

export async function middleware(request: NextRequest) {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.RHYMEGAME_SUPABASE_URL ??
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.RHYMEGAME_SUPABASE_ANON_KEY ??
    "";

  let response = NextResponse.next({ request });
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // /profile/[slug] is public; /profile (exact) is private
  const needsAuth =
    PROTECTED.some(
      (p) => path === p || path.startsWith(`${p}/`),
    ) && !path.startsWith("/profile/");

  if (needsAuth && !user) {
    const loginUrl = new URL("/beta/login", request.url);
    // Store bare path (no basePath) — login + callback re-add /beta as needed.
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
