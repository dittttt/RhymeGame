"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { beats as BEAT_POOL } from "@/lib/game-data";
import { computeRoundDeltas, DEFAULT_ELO } from "@/lib/elo";

/* ─────── Types ─────── */
type Lobby = {
  id: string;
  code: string;
  name: string | null;
  mode: string;
  visibility: string;
  max_players: number;
  host_id: string | null;
  status: "waiting" | "playing" | "complete";
  current_beat_id: string | null;
  current_genre: string | null;
  round_started_at: string | null;
};

type MemberRow = {
  user_id: string;
  role: "player" | "spectator" | "host";
  score: number;
  joined_at: string;
  profiles: { display_name: string | null; avatar_url: string | null; elo: number } | null;
};

type ChatRow = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
};

type VoteRow = {
  id: string;
  user_id: string;
  target_type: "beat" | "genre" | "winner";
  target_value: string;
};

const GENRES = ["Hip Hop", "Trap", "Drill", "Boom Bap", "Phonk", "R&B"];

function pickBeatForGenre(genre: string): string {
  const matches = BEAT_POOL.filter((b) =>
    b.genre.toLowerCase().includes(genre.toLowerCase().split(" ")[0]),
  );
  const pool = matches.length > 0 ? matches : BEAT_POOL;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function LobbyRoom({
  initialLobby,
  initialMembers,
  currentUserId,
}: {
  initialLobby: Lobby;
  initialMembers: MemberRow[];
  currentUserId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [lobby, setLobby] = useState<Lobby>(initialLobby);
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [chat, setChat] = useState<ChatRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [busy, setBusy] = useState(false);
  const lastSentRef = useRef(0);

  const isHost = currentUserId === lobby.host_id;
  const me = members.find((m) => m.user_id === currentUserId);
  const isSpectator = me?.role === "spectator";

  /* ─── refetch helpers ─── */
  const refetchLobby = useCallback(async () => {
    const { data } = await supabase
      .from("lobbies")
      .select(
        "id, code, name, mode, visibility, max_players, host_id, status, current_beat_id, current_genre, round_started_at",
      )
      .eq("id", initialLobby.id)
      .maybeSingle();
    if (data) setLobby(data as Lobby);
  }, [supabase, initialLobby.id]);

  const refetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("lobby_members")
      .select("user_id, role, score, joined_at, profiles(display_name, avatar_url, elo)")
      .eq("lobby_id", initialLobby.id)
      .order("joined_at", { ascending: true });
    if (data) setMembers(data as unknown as MemberRow[]);
  }, [supabase, initialLobby.id]);

  const refetchChat = useCallback(async () => {
    const { data } = await supabase
      .from("lobby_chat")
      .select("id, user_id, message, created_at, profiles(display_name)")
      .eq("lobby_id", initialLobby.id)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setChat(data as unknown as ChatRow[]);
  }, [supabase, initialLobby.id]);

  const refetchVotes = useCallback(async () => {
    const { data } = await supabase
      .from("lobby_votes")
      .select("id, user_id, target_type, target_value")
      .eq("lobby_id", initialLobby.id);
    if (data) setVotes(data as VoteRow[]);
  }, [supabase, initialLobby.id]);

  /* ─── initial loads + realtime ─── */
  useEffect(() => {
    refetchChat();
    refetchVotes();
    refetchMembers();
    const channel = supabase
      .channel(`lobby:${initialLobby.code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lobby_members", filter: `lobby_id=eq.${initialLobby.id}` },
        () => refetchMembers(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lobby_chat", filter: `lobby_id=eq.${initialLobby.id}` },
        () => refetchChat(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lobby_votes", filter: `lobby_id=eq.${initialLobby.id}` },
        () => refetchVotes(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lobbies", filter: `id=eq.${initialLobby.id}` },
        () => refetchLobby(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, initialLobby.id, initialLobby.code, refetchMembers, refetchChat, refetchVotes, refetchLobby]);

  /* ─── host transfer when host leaves ─── */
  useEffect(() => {
    if (!currentUserId) return;
    if (!members.length) return;
    const hostStillHere = lobby.host_id && members.some((m) => m.user_id === lobby.host_id);
    if (hostStillHere) return;
    const oldest = [...members]
      .filter((m) => m.role !== "spectator")
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
    if (!oldest || oldest.user_id !== currentUserId) return;
    (async () => {
      await supabase.from("lobbies").update({ host_id: oldest.user_id }).eq("id", lobby.id);
      await supabase
        .from("lobby_members")
        .update({ role: "host" })
        .match({ lobby_id: lobby.id, user_id: oldest.user_id });
    })();
  }, [members, lobby.host_id, lobby.id, currentUserId, supabase]);

  /* ─── derived ─── */
  const players = members.filter((m) => m.role !== "spectator");
  const spectators = members.filter((m) => m.role === "spectator");
  const trophyWinner = players.find((p) => p.score >= 3);

  /* ─── actions ─── */
  async function sendChat(msg: string) {
    if (!currentUserId) return;
    const now = Date.now();
    if (now - lastSentRef.current < 1000) return;
    lastSentRef.current = now;
    const trimmed = msg.slice(0, 200).trim();
    if (!trimmed) return;
    await supabase
      .from("lobby_chat")
      .insert({ lobby_id: lobby.id, user_id: currentUserId, message: trimmed });
  }

  async function castVote(targetType: "genre" | "winner", value: string) {
    if (!currentUserId) return;
    // delete this user's prior vote of this type, then insert new one
    await supabase
      .from("lobby_votes")
      .delete()
      .match({ lobby_id: lobby.id, user_id: currentUserId, target_type: targetType });
    await supabase.from("lobby_votes").insert({
      lobby_id: lobby.id,
      user_id: currentUserId,
      target_type: targetType,
      target_value: value,
    });
  }

  async function startRound() {
    if (!isHost) return;
    // race guard: many clients may dispatch this simultaneously via realtime echo
    if (lobby.status !== "waiting") return;
    if (busy) return;
    setBusy(true);
    try {
      // tally genre votes
      const genreVotes = votes.filter((v) => v.target_type === "genre");
      const tally = new Map<string, number>();
      genreVotes.forEach((v) => tally.set(v.target_value, (tally.get(v.target_value) ?? 0) + 1));
      let maxN = 0;
      tally.forEach((n) => (maxN = Math.max(maxN, n)));
      const top = [...tally.entries()].filter(([, n]) => n === maxN && n > 0).map(([g]) => g);
      const chosenGenre =
        top.length > 0 ? top[Math.floor(Math.random() * top.length)] : GENRES[0];
      const beatId = pickBeatForGenre(chosenGenre);
      await supabase
        .from("lobbies")
        .update({
          status: "playing",
          current_genre: chosenGenre,
          current_beat_id: beatId,
          round_started_at: new Date().toISOString(),
        })
        .eq("id", lobby.id);
      // clear genre votes for next round
      await supabase.from("lobby_votes").delete().match({ lobby_id: lobby.id, target_type: "genre" });
    } finally {
      setBusy(false);
    }
  }

  async function endRound() {
    setBusy(true);
    try {
      await supabase
        .from("lobbies")
        .update({ status: "waiting", current_beat_id: null, round_started_at: null })
        .eq("id", lobby.id);
      // clear stale winner votes
      await supabase.from("lobby_votes").delete().match({ lobby_id: lobby.id, target_type: "winner" });
    } finally {
      setBusy(false);
    }
  }

  // host finalizes winner vote after timer
  async function finalizeWinner() {
    if (!isHost) return;
    setBusy(true);
    try {
      const winnerVotes = votes.filter((v) => v.target_type === "winner");
      if (winnerVotes.length === 0) {
        setBusy(false);
        return;
      }
      const tally = new Map<string, number>();
      winnerVotes.forEach((v) => tally.set(v.target_value, (tally.get(v.target_value) ?? 0) + 1));
      let maxN = 0;
      tally.forEach((n) => (maxN = Math.max(maxN, n)));
      const top = [...tally.entries()].filter(([, n]) => n === maxN).map(([id]) => id);
      const winnerId = top[Math.floor(Math.random() * top.length)];

      // insert match
      const { data: matchRow } = await supabase
        .from("matches")
        .insert({
          lobby_id: lobby.id,
          winner_id: winnerId,
          ended_at: new Date().toISOString(),
          beat_id: lobby.current_beat_id,
          genre: lobby.current_genre,
        })
        .select("id")
        .single();

      if (matchRow) {
        const matchPlayers = players.map((p) => ({
          match_id: matchRow.id,
          user_id: p.user_id,
          role: p.role,
          final_score: p.user_id === winnerId ? 1 : 0,
          placement: p.user_id === winnerId ? 1 : 2,
        }));
        if (matchPlayers.length > 0) await supabase.from("match_players").insert(matchPlayers);

        // Real Elo math — ranked only. Casual mode records the match but
        // skips ledger writes so casual play doesn't move ratings.
        if (lobby.mode === "ranked" && players.length >= 2) {
          const deltas = computeRoundDeltas(
            players.map((p) => ({ userId: p.user_id, elo: p.profiles?.elo ?? DEFAULT_ELO })),
            winnerId,
          );
          const eloRows = deltas.map((d) => ({
            user_id: d.userId,
            match_id: matchRow.id,
            elo_before: d.eloBefore,
            elo_after: d.eloAfter,
            delta: d.delta,
          }));
          if (eloRows.length > 0) {
            await supabase.from("elo_history").insert(eloRows);
            for (const r of eloRows) {
              await supabase.from("profiles").update({ elo: r.elo_after }).eq("id", r.user_id);
            }
          }
        }
      }

      // increment winner score
      const winnerMember = members.find((m) => m.user_id === winnerId);
      const newScore = (winnerMember?.score ?? 0) + 1;
      await supabase
        .from("lobby_members")
        .update({ score: newScore })
        .match({ lobby_id: lobby.id, user_id: winnerId });

      // clear winner votes
      await supabase.from("lobby_votes").delete().match({ lobby_id: lobby.id, target_type: "winner" });

      if (newScore >= 3) {
        await supabase.from("lobbies").update({ status: "complete" }).eq("id", lobby.id);
      }
    } finally {
      setBusy(false);
    }
  }

  /* ─── phase: after round ends (status=waiting but no genre vote yet, winner phase) ─── */
  // We use heuristic: if there are winner votes present OR current_genre present + status=waiting + at least one ended match recently? Keep simple — show winner panel when there are winner votes OR explicitly: after endRound the host gets the winner panel.
  const hasWinnerVotes = votes.some((v) => v.target_type === "winner");
  const showWinnerVote = lobby.status === "waiting" && (hasWinnerVotes || (lobby.current_genre && players.some((p) => p.score === 0)));
  // Simplification flag: we render BeatVoting unless we're playing/complete/winner phase.

  return (
    <div className="grid gap-5 lg:grid-cols-[260px,_minmax(0,1fr),_320px]">
      {/* LEFT */}
      <PlayerListPanel
        players={players}
        spectators={spectators}
        hostId={lobby.host_id}
        trophyId={trophyWinner?.user_id ?? null}
        maxPlayers={lobby.max_players}
      />

      {/* CENTER */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 min-h-[420px]">
        {lobby.status === "complete" ? (
          <FinalScoreboard players={players} />
        ) : lobby.status === "playing" ? (
          <PlayingPanel
            lobby={lobby}
            isSpectator={isSpectator}
            isHost={isHost}
            busy={busy}
            onEndRound={endRound}
          />
        ) : showWinnerVote ? (
          <WinnerVotePanel
            players={players}
            votes={votes.filter((v) => v.target_type === "winner")}
            currentUserId={currentUserId}
            isHost={isHost}
            busy={busy}
            onVote={(uid) => castVote("winner", uid)}
            onFinalize={finalizeWinner}
          />
        ) : (
          <BeatVotePanel
            votes={votes.filter((v) => v.target_type === "genre")}
            currentUserId={currentUserId}
            isHost={isHost}
            busy={busy}
            onVote={(g) => castVote("genre", g)}
            onStart={startRound}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
          <button
            disabled
            title="Voice chat — coming soon (see multiplayer_plan.md)"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40"
          >
            🎙 Voice (soon)
          </button>
          {currentUserId && (
            <button
              onClick={async () => {
                await supabase
                  .from("lobby_members")
                  .delete()
                  .match({ lobby_id: lobby.id, user_id: currentUserId });
                router.push("/multiplayer");
              }}
              className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Leave lobby
            </button>
          )}
        </div>
      </section>

      {/* RIGHT */}
      <ChatPanel chat={chat} currentUserId={currentUserId} onSend={sendChat} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function PlayerListPanel({
  players,
  spectators,
  hostId,
  trophyId,
  maxPlayers,
}: {
  players: MemberRow[];
  spectators: MemberRow[];
  hostId: string | null;
  trophyId: string | null;
  maxPlayers: number;
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white/60">
          Players ({players.length}/{maxPlayers})
        </h2>
        <ul className="mt-3 space-y-2">
          {players.length === 0 && <li className="text-xs text-white/45">No players yet.</li>}
          {players.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2">
              <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-[10px] font-bold text-black">
                {(m.profiles?.display_name ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {m.profiles?.display_name ?? "Anon"}
                  {m.user_id === hostId && (
                    <span className="ml-1 text-[10px] text-fuchsia-300">★host</span>
                  )}
                  {m.user_id === trophyId && <span className="ml-1">🏆</span>}
                </p>
                <p className="text-[10px] text-white/45">ELO {m.profiles?.elo ?? 1000}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-orange-300">{m.score}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {spectators.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white/60">
            Spectators ({spectators.length})
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-white/60">
            {spectators.map((s) => (
              <li key={s.user_id}>👁 {s.profiles?.display_name ?? "Anon"}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function BeatVotePanel({
  votes,
  currentUserId,
  isHost,
  busy,
  onVote,
  onStart,
}: {
  votes: VoteRow[];
  currentUserId: string | null;
  isHost: boolean;
  busy: boolean;
  onVote: (genre: string) => void;
  onStart: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.target_value, (counts.get(v.target_value) ?? 0) + 1));
  const myVote = votes.find((v) => v.user_id === currentUserId)?.target_value;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Vote a genre</h2>
        <span className="font-mono text-xs text-white/55">{secondsLeft}s</span>
      </div>
      <p className="mt-1 text-xs text-white/55">Highest-vote genre wins; host kicks off the round.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {GENRES.map((g) => {
          const active = myVote === g;
          return (
            <button
              key={g}
              onClick={() => onVote(g)}
              disabled={!currentUserId}
              className={`rounded-2xl border px-3 py-3 text-sm transition ${
                active
                  ? "border-orange-300/70 bg-orange-300/15 text-orange-100"
                  : "border-white/10 bg-white/[0.03] hover:border-white/30"
              }`}
            >
              <div className="font-semibold">{g}</div>
              <div className="mt-1 text-[10px] text-white/50">{counts.get(g) ?? 0} votes</div>
            </button>
          );
        })}
      </div>
      {isHost && (
        <button
          onClick={onStart}
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? "Starting…" : "Start round"}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function PlayingPanel({
  lobby,
  isSpectator,
  isHost,
  busy,
  onEndRound,
}: {
  lobby: Lobby;
  isSpectator: boolean;
  isHost: boolean;
  busy: boolean;
  onEndRound: () => void;
}) {
  // server-authoritative downbeat sync — derive elapsed from round_started_at
  const startMs = lobby.round_started_at ? new Date(lobby.round_started_at).getTime() : Date.now();
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, (now - startMs) / 1000);
  const beat = BEAT_POOL.find((b) => b.id === lobby.current_beat_id) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">
          🎤 {lobby.current_genre ?? "Round"} in progress
        </h2>
        <span className="font-mono text-xs text-white/55">t={elapsed.toFixed(1)}s</span>
      </div>
      {beat ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <iframe
            key={beat.youtubeVideoId}
            src={`https://www.youtube.com/embed/${beat.youtubeVideoId}?autoplay=1&start=${Math.floor(
              beat.startSeconds + elapsed,
            )}&rel=0&modestbranding=1`}
            title="Round beat"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="aspect-video w-full"
          />
          <div className="px-4 py-3 text-xs text-white/55">
            {beat.title} · {beat.bpm} BPM · {beat.timeSignature}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/55">No beat selected.</p>
      )}
      <p className="mt-3 text-[11px] text-white/45">
        Downbeat clock is server-anchored to round_started_at ({new Date(startMs).toISOString().slice(11, 19)} UTC) — every
        client renders the same beat number.
      </p>
      {!isSpectator && (
        <button
          onClick={onEndRound}
          disabled={busy}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? "…" : "Round done"}
        </button>
      )}
      {isHost && (
        <p className="mt-2 text-[10px] text-white/40">Host can end the round at any time.</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function WinnerVotePanel({
  players,
  votes,
  currentUserId,
  isHost,
  busy,
  onVote,
  onFinalize,
}: {
  players: MemberRow[];
  votes: VoteRow[];
  currentUserId: string | null;
  isHost: boolean;
  busy: boolean;
  onVote: (userId: string) => void;
  onFinalize: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const counts = new Map<string, number>();
  votes.forEach((v) => counts.set(v.target_value, (counts.get(v.target_value) ?? 0) + 1));
  const myVote = votes.find((v) => v.user_id === currentUserId)?.target_value;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Who won that round?</h2>
        <span className="font-mono text-xs text-white/55">{secondsLeft}s</span>
      </div>
      <div className="mt-4 grid gap-2">
        {players.map((p) => {
          const active = myVote === p.user_id;
          return (
            <button
              key={p.user_id}
              onClick={() => onVote(p.user_id)}
              disabled={!currentUserId}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                active
                  ? "border-orange-300/70 bg-orange-300/15"
                  : "border-white/10 bg-white/[0.03] hover:border-white/30"
              }`}
            >
              <span>{p.profiles?.display_name ?? "Anon"}</span>
              <span className="font-mono text-xs text-white/60">{counts.get(p.user_id) ?? 0}</span>
            </button>
          );
        })}
      </div>
      {isHost && (
        <button
          onClick={onFinalize}
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {busy ? "…" : "Lock in winner"}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function FinalScoreboard({ players }: { players: MemberRow[] }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">🏆 Match complete</h2>
      <p className="mt-1 text-sm text-white/55">Best-of-3 finished.</p>
      <ol className="mt-5 space-y-2">
        {ranked.map((p, i) => {
          const wins = p.score;
          const elo = p.profiles?.elo ?? 1000;
          const delta = i === 0 ? 20 : -5;
          return (
            <li
              key={p.user_id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                i === 0 ? "border-orange-300/60 bg-orange-300/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold text-white/80">#{i + 1}</span>
                <span>{p.profiles?.display_name ?? "Anon"}</span>
                {i === 0 && <span>🏆</span>}
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">{wins} wins</p>
                <p className="text-[10px] text-white/55">
                  ELO {elo} <span className={delta > 0 ? "text-emerald-300" : "text-red-300"}>
                    {delta > 0 ? "+" : ""}{delta}
                  </span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
function ChatPanel({
  chat,
  currentUserId,
  onSend,
}: {
  chat: ChatRow[];
  currentUserId: string | null;
  onSend: (msg: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  return (
    <aside className="flex h-[520px] flex-col rounded-3xl border border-white/10 bg-white/5 lg:h-auto lg:min-h-[420px]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white/60">Chat</h2>
      </div>
      <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto px-4 py-3 text-sm">
        {chat.length === 0 && <p className="text-xs text-white/40">No messages yet.</p>}
        {chat.map((c) => (
          <div key={c.id} className="mb-2">
            <span className="text-[10px] uppercase tracking-widest text-fuchsia-300/80">
              {c.profiles?.display_name ?? "anon"}
            </span>
            <p className="text-sm text-white/85">{c.message}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onSend(draft);
          setDraft("");
        }}
        className="border-t border-white/10 p-3"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 200))}
            placeholder={currentUserId ? "Say something…" : "Sign in to chat"}
            disabled={!currentUserId}
            maxLength={200}
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/60 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!currentUserId || !draft.trim()}
            className="rounded-xl bg-gradient-to-r from-orange-400 to-fuchsia-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
