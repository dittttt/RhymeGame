import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LobbyRoom } from "./LobbyRoom";

export const dynamic = "force-dynamic";

type MemberRow = {
  user_id: string;
  role: "player" | "spectator" | "host";
  score: number;
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null; elo: number } | null;
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
    .select(
      "id, code, name, mode, visibility, max_players, host_id, status, current_beat_id, current_genre, round_started_at",
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!lobby) notFound();

  const { data: members } = await supabase
    .from("lobby_members")
    .select("user_id, role, score, joined_at, profiles(display_name, avatar_url, elo)")
    .eq("lobby_id", lobby.id)
    .order("joined_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-join visitors as spectators if not already a member
  if (user && !(members ?? []).some((m) => m.user_id === user.id)) {
    await supabase
      .from("lobby_members")
      .insert({ lobby_id: lobby.id, user_id: user.id, role: "spectator" });
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-accent inline-flex">Lobby · {lobby.mode}</p>
          <h1 className="mt-3 font-display text-3xl font-bold">
            {lobby.name ?? `Room ${lobby.code}`}
          </h1>
          <p className="mt-1 font-mono text-sm uppercase tracking-[0.3em] text-white/50">
            {lobby.code} · {lobby.visibility} · status {lobby.status}
          </p>
        </div>
      </div>

      <LobbyRoom
        initialLobby={lobby as Parameters<typeof LobbyRoom>[0]["initialLobby"]}
        initialMembers={(members ?? []) as unknown as MemberRow[]}
        currentUserId={user?.id ?? null}
      />
    </main>
  );
}
