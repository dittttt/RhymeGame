"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModeCard({
  mode,
  title,
  desc,
  accent,
  iconEmoji,
}: {
  mode: "casual" | "ranked" | "spectate";
  title: string;
  desc: string;
  accent: string;
  iconEmoji: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/beta/api/lobbies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, visibility: "public" }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) {
        setError(data.error ?? "Failed");
        setBusy(false);
        if (res.status === 401) router.push("/login");
        return;
      }
      router.push(`/lobby/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-6 text-left transition hover:border-white/20 disabled:opacity-50`}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-white/10 text-2xl">{iconEmoji}</div>
      <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-white/65">{desc}</p>
      <span className="mt-4 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
        {busy ? "Creating…" : "Create & join"}
      </span>
      {error && <p className="mt-2 text-[10px] text-red-300">{error}</p>}
    </button>
  );
}
