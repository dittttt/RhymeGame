import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeaveButton } from "./LeaveButton";

type Member = {
  user_id: string;
  role: string;
  score: number;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: lobby } = await supabase
    .from("lobbies")
    .select("id, code, name, mode, max_players, current_genre, status, host_id")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!lobby) notFound();

  const { data: members } = await supabase
    .from("lobby_members")
    .select("user_id, role, score, profiles(display_name, avatar_url)")
    .eq("lobby_id", lobby.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const memberList = (members ?? []) as unknown as Member[];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-accent inline-flex">Lobby · {lobby.mode}</p>
          <h1 className="mt-3 font-display text-3xl font-bold">
            {lobby.name ?? `Room ${lobby.code}`}
          </h1>
          <p className="mt-1 font-mono text-sm uppercase tracking-[0.3em] text-white/50">
            {lobby.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && <LeaveButton lobbyId={lobby.id} userId={user.id} />}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Players ({memberList.length}/{lobby.max_players})</h2>
          {memberList.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">Nobody here yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {memberList.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-xs font-bold text-black">
                      {(m.profiles?.display_name ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.profiles?.display_name ?? "Anon"}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/45">{m.role}</p>
                    </div>
                  </div>
                  <span className="text-sm text-white/60">{m.score}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-lg font-bold">Room info</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/50">Mode</dt>
              <dd>{lobby.mode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Status</dt>
              <dd>{lobby.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Genre</dt>
              <dd>{lobby.current_genre ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-6 rounded-2xl bg-fuchsia-500/10 p-3 text-xs text-fuchsia-200">
            Coming in Phase 4: chat, voting, gameplay sync.
          </p>
        </aside>
      </div>
    </main>
  );
}
