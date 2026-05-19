import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RefreshButton } from "./RefreshButton";

export const dynamic = "force-dynamic";

type Lobby = {
  id: string;
  code: string;
  name: string | null;
  current_genre: string | null;
  min_elo: number;
  max_players: number;
  status: string;
};

export default async function FindLobbiesPage() {
  const supabase = await createClient();
  const { data: lobbies } = await supabase
    .from("lobbies")
    .select("id, code, name, current_genre, min_elo, max_players, status")
    .eq("visibility", "public")
    .eq("status", "waiting")
    .limit(50);

  // Counts per lobby
  const counts = new Map<string, { players: number; spectators: number }>();
  if (lobbies && lobbies.length > 0) {
    const ids = lobbies.map((l) => l.id);
    const { data: members } = await supabase
      .from("lobby_members")
      .select("lobby_id, role")
      .in("lobby_id", ids);
    (members ?? []).forEach((m) => {
      const c = counts.get(m.lobby_id) ?? { players: 0, spectators: 0 };
      if (m.role === "spectator") c.spectators++;
      else c.players++;
      counts.set(m.lobby_id, c);
    });
  }

  const rows = (lobbies ?? []) as Lobby[];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-accent inline-flex">Custom · Find</p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Public lobbies</h1>
          <p className="mt-1 text-sm text-white/55">Pick one and jump in.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link
            href="/custom/join"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Join by code
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-white/55">
            No public lobbies. Create one!
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Players</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Min ELO</th>
                <th className="px-4 py-3">Spec</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const c = counts.get(l.id) ?? { players: 0, spectators: 0 };
                return (
                  <tr key={l.id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium">{l.name ?? `Room ${l.code}`}</td>
                    <td className="px-4 py-3">
                      {c.players}/{l.max_players}
                    </td>
                    <td className="px-4 py-3 text-white/70">{l.current_genre ?? "—"}</td>
                    <td className="px-4 py-3 text-white/70">{l.min_elo || "—"}</td>
                    <td className="px-4 py-3 text-white/70">{c.spectators}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300">
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/lobby/${l.code}`}
                        className="rounded-lg bg-gradient-to-r from-orange-400 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
                      >
                        Join
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
