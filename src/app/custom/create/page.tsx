"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/beta/api/lobbies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "custom_online",
          name: name.trim() || null,
          visibility,
          max_players: maxPlayers,
        }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) {
        setError(data.error ?? "Failed to create lobby");
        setBusy(false);
        return;
      }
      router.push(`/lobby/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-16 sm:pt-24">
      <p className="chip chip-accent inline-flex">Custom · Create</p>
      <h1 className="mt-3 font-display text-3xl font-bold">Spin up a room</h1>
      <p className="mt-1 text-sm text-white/55">Configure your custom lobby.</p>

      <form onSubmit={create} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-white/55">Room name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            maxLength={40}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-fuchsia-400/60"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-white/55">Max players</span>
          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-xs uppercase tracking-widest text-white/55">Visibility</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["public", "private"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setVisibility(v)}
                className={`rounded-2xl border px-4 py-3 text-sm capitalize ${
                  visibility === v
                    ? "border-orange-300/70 bg-orange-300/15 text-orange-100"
                    : "border-white/10 bg-white/[0.03] hover:border-white/30"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-4 py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create lobby"}
        </button>
      </form>
    </main>
  );
}
