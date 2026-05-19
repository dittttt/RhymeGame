"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinByCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Code is too short.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("lobbies")
      .select("code")
      .eq("code", c)
      .maybeSingle();
    setBusy(false);
    if (err || !data) {
      setError("Lobby not found.");
      return;
    }
    router.push(`/lobby/${data.code}`);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-16 sm:pt-24">
      <p className="chip chip-accent inline-flex">Custom · Join</p>
      <h1 className="mt-3 font-display text-3xl font-bold">Got a code?</h1>
      <p className="mt-1 text-sm text-white/55">Enter the 6-char lobby code.</p>

      <form onSubmit={go} className="mt-6 space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center font-mono text-2xl uppercase tracking-[0.4em] outline-none focus:border-fuchsia-400/60"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Looking…" : "Join lobby"}
        </button>
      </form>
    </main>
  );
}
