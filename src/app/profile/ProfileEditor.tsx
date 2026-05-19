"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GENRES = ["Hip Hop", "Trap", "Boom Bap", "Lo-Fi", "Drill", "Jazz Rap", "R&B", "Cloud", "Phonk"];

export function ProfileEditor({
  userId,
  displayName: initialName,
  favGenres: initialGenres,
}: {
  userId: string;
  displayName: string;
  favGenres: string[];
}) {
  const [name, setName] = useState(initialName);
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function toggle(g: string) {
    setGenres((curr) => (curr.includes(g) ? curr.filter((x) => x !== g) : [...curr, g]));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, fav_genres: genres })
      .eq("id", userId);
    setBusy(false);
    setMsg(error ? `Error: ${error.message}` : "Saved.");
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold">Edit profile</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-white/45">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/60"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-white/45">Favourite genres</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const on = genres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle(g)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    on
                      ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {msg && <span className="text-xs text-white/60">{msg}</span>}
        </div>
      </div>
    </section>
  );
}
