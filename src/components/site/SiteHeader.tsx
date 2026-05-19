"use client";

import Link from "next/link";
import { Music2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0612]/70 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-orange-400/60 to-fuchsia-500/60" />
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-900/30">
            <Music2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-none tracking-tight sm:text-xl">
              Rhyme Game
            </p>
            <p className="mt-1 truncate text-[0.6rem] uppercase tracking-[0.32em] text-white/45 sm:text-[0.65rem]">
              Beta · Freestyle to the Beat
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <Link href="/" className="rounded-full px-3 py-1.5 text-white/70 hover:bg-white/5 hover:text-white">
            Home
          </Link>
          <Link href="/about" className="hidden rounded-full px-3 py-1.5 text-white/70 hover:bg-white/5 hover:text-white sm:inline-block">
            About
          </Link>
          <Link href="/credits" className="hidden rounded-full px-3 py-1.5 text-white/70 hover:bg-white/5 hover:text-white sm:inline-block">
            Credits
          </Link>
          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 sm:text-sm"
            >
              <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-[10px] font-bold text-black">
                {(user.email ?? "U")[0].toUpperCase()}
              </span>
              <span className="hidden max-w-[140px] truncate sm:inline">
                {user.email}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <Sparkles className="size-3.5" /> Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
