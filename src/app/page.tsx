"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Search,
  SkipForward,
  Sparkles,
  Users,
} from "lucide-react";
import {
  defaultRoundSeconds,
  rhymeModes,
  rhymeWords,
  shuffle,
  type Beat,
  type RhymeMode,
  type RhymeWord,
} from "@/lib/game-data";
import { getBeatClock, secondsPerBeat, VISIBLE_BARS } from "@/lib/beat-clock";
import { useYouTubePlayer } from "@/lib/use-youtube-player";
import { WORDLISTS, type WordlistId } from "@/lib/wordlists";
import { RHYME_PATTERNS, type RhymePattern } from "@/lib/rhyme-patterns";

const RAP_GENRE_CHIPS: string[] = [
  "Trap",
  "Boom Bap",
  "Old School",
  "Dreamville",
  "Drill",
  "UK Drill",
  "Lo-Fi Hip Hop",
  "Jazz Rap",
  "Conscious",
  "G-Funk",
  "West Coast",
  "East Coast",
  "Memphis",
  "Phonk",
  "Cloud Rap",
  "Rage",
  "Hyperpop Rap",
  "Plugg",
  "Soul Sample",
  "Afro Trap",
];

type Stage = "picker" | "play";

type SearchResult = {
  youtubeVideoId: string;
  title: string;
  channel: string;
  sourceUrl: string;
  thumbnailUrl?: string | null;
  bpm?: number | null;
  timeSignature?: Beat["timeSignature"];
  timeSignatureAssumed?: boolean;
  metadataSource?: Beat["metadataSource"];
  metadataConfidence?: Beat["metadataConfidence"];
  metadataNotes?: string;
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("picker");
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [mode] = useState<RhymeMode>(rhymeModes[0]);
  const [difficulty, setDifficulty] =
    useState<RhymeWord["difficulty"]>("beginner");
  const [wordlistId, setWordlistId] = useState<WordlistId>("basic");
  const [pattern, setPattern] = useState<RhymePattern>("AABB");
  const [roundSeconds, setRoundSeconds] = useState(defaultRoundSeconds);
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState(
    "Search YouTube or tap a genre chip to grab a beat.",
  );
  const [searching, setSearching] = useState(false);

  async function searchYouTube(overrideQuery?: string) {
    const q = (overrideQuery ?? youtubeQuery).trim();
    if (!q) return;
    setSearching(true);
    setSearchStatus("Searching YouTube…");
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(q)}`,
      );
      const data = (await response.json()) as {
        error?: string;
        note?: string;
        items?: SearchResult[];
      };
      // Keep only results whose title/description contains BPM info
      // (the API already filters with strict=true by default, but we
      // re-enforce here in case it ever loosens).
      const filtered = (data.items ?? []).filter(
        (item) => item.bpm != null && item.bpm > 0,
      );
      setYoutubeResults(filtered);
      setSearchStatus(
        data.error ??
          `${data.note ? `${data.note} ` : ""}Found ${filtered.length} beats with parseable BPM.`,
      );
    } finally {
      setSearching(false);
    }
  }

  function onChipClick(label: string) {
    // Don't prefill the input; fire the search directly with the
    // canonical `<GENRE> type beat` query.
    void searchYouTube(`${label} type beat`);
  }

  function selectYouTubeResult(result: SearchResult) {
    const parsedBpm = result.bpm ?? 90;
    const parsedTimeSignature = result.timeSignature ?? "4/4";

    setSelectedBeat({
      id: result.youtubeVideoId,
      youtubeVideoId: result.youtubeVideoId,
      title: result.title,
      channel: result.channel,
      sourceUrl: result.sourceUrl,
      genre: "Hip hop",
      style: "Freestyle Type Beat",
      mood: "User selected",
      bpm: parsedBpm,
      timeSignature: parsedTimeSignature,
      startSeconds: 0,
      durationSeconds: roundSeconds,
      metadataSource: result.metadataSource ?? "youtube_description",
      metadataConfidence:
        result.metadataConfidence ?? (result.bpm ? "parsed" : "assumed"),
      metadataNotes: result.metadataNotes,
    });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <BackgroundOrbs />
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <TopBar
          stage={stage}
          selectedBeat={selectedBeat}
          onBack={() => setStage("picker")}
        />

        <div className="mt-5 flex-1 sm:mt-6">
          {stage === "picker" ? (
            <BeatPickerScreen
              selectedBeat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              wordlistId={wordlistId}
              pattern={pattern}
              roundSeconds={roundSeconds}
              numPlayers={numPlayers}
              youtubeQuery={youtubeQuery}
              youtubeResults={youtubeResults}
              searchStatus={searchStatus}
              searching={searching}
              onDifficultyChange={setDifficulty}
              onWordlistChange={setWordlistId}
              onPatternChange={setPattern}
              onRoundSecondsChange={setRoundSeconds}
              onNumPlayersChange={setNumPlayers}
              onYoutubeQueryChange={setYoutubeQuery}
              onSearchYouTube={searchYouTube}
              onChipClick={onChipClick}
              onSelectYouTubeResult={selectYouTubeResult}
              onPlay={() => selectedBeat && setStage("play")}
            />
          ) : selectedBeat ? (
            <GameScreen
              beat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              wordlistId={wordlistId}
              pattern={pattern}
              roundSeconds={roundSeconds}
              numPlayers={numPlayers}
              onExit={() => setStage("picker")}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* TOP BAR                                                              */
/* ──────────────────────────────────────────────────────────────────── */

function TopBar({
  stage,
  selectedBeat,
  onBack,
}: {
  stage: Stage;
  selectedBeat: Beat | null;
  onBack: () => void;
}) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {stage === "play" ? (
          <button
            onClick={onBack}
            className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
            aria-label="Back to beat picker"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-900/30">
            <Music2 className="size-6" />
          </div>
        )}
        <div>
          <p className="font-display text-lg font-bold leading-none tracking-tight sm:text-xl">
            RhymeGame
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.28em] text-white/45 sm:text-[0.65rem] sm:tracking-[0.32em]">
            {stage === "play" && selectedBeat
              ? `${selectedBeat.bpm} BPM · ${selectedBeat.timeSignature}`
              : "freestyle to the beat"}
          </p>
        </div>
      </div>
      <div className="chip hidden sm:inline-flex">
        <Users className="size-3.5" /> No typing — rhyme out loud
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* BACKGROUND                                                           */
/* ──────────────────────────────────────────────────────────────────── */

function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0a0612]" />
      <div className="pointer-events-none fixed -left-32 top-[-10%] -z-10 size-[640px] rounded-full bg-orange-500/15 blur-[140px]" />
      <div className="pointer-events-none fixed -right-32 top-[20%] -z-10 size-[720px] rounded-full bg-fuchsia-500/20 blur-[160px]" />
      <div className="pointer-events-none fixed bottom-[-20%] left-1/3 -z-10 size-[600px] rounded-full bg-sky-500/10 blur-[150px]" />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* PICKER SCREEN                                                        */
/* ──────────────────────────────────────────────────────────────────── */

function BeatPickerScreen(props: {
  selectedBeat: Beat | null;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  wordlistId: WordlistId;
  pattern: RhymePattern;
  roundSeconds: number;
  numPlayers: number;
  youtubeQuery: string;
  youtubeResults: SearchResult[];
  searchStatus: string;
  searching: boolean;
  onDifficultyChange: (difficulty: RhymeWord["difficulty"]) => void;
  onWordlistChange: (id: WordlistId) => void;
  onPatternChange: (p: RhymePattern) => void;
  onRoundSecondsChange: (seconds: number) => void;
  onNumPlayersChange: (n: number) => void;
  onYoutubeQueryChange: (query: string) => void;
  onSearchYouTube: (overrideQuery?: string) => void;
  onChipClick: (label: string) => void;
  onSelectYouTubeResult: (result: SearchResult) => void;
  onPlay: () => void;
}) {
  const {
    selectedBeat,
    mode,
    difficulty,
    wordlistId,
    pattern,
    roundSeconds,
    numPlayers,
    youtubeQuery,
    youtubeResults,
    searchStatus,
    searching,
    onDifficultyChange,
    onWordlistChange,
    onPatternChange,
    onRoundSecondsChange,
    onNumPlayersChange,
    onYoutubeQueryChange,
    onSearchYouTube,
    onChipClick,
    onSelectYouTubeResult,
    onPlay,
  } = props;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,_1.4fr)_minmax(300px,_0.9fr)] lg:gap-6">
      {/* LEFT: BEAT BROWSER */}
      <div className="space-y-5 sm:space-y-6">
        {/* Hero */}
        <header className="glass rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-7 lg:p-8">
          <p className="chip chip-accent">
            <Sparkles className="size-3.5" /> Step 1
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            Pick your beat
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
            Search YouTube for any instrumental, or tap a genre chip to grab one
            instantly. We only keep results with a BPM in the title or
            description so the game stays in pocket.
          </p>
        </header>

        {/* YouTube search */}
        <div className="glass rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-500/20 text-rose-200">
              <Search className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">
                Search YouTube
              </p>
              <p className="text-xs text-white/50">
                Type a vibe, BPM range, or producer name
              </p>
            </div>
          </div>
          <form
            className="mt-5 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchYouTube();
            }}
          >
            <input
              className="input min-h-[44px] flex-1 text-base"
              value={youtubeQuery}
              onChange={(e) => onYoutubeQueryChange(e.target.value)}
              placeholder="e.g. boom bap freestyle 90 bpm…"
              inputMode="search"
            />
            <button
              type="submit"
              disabled={searching}
              className="primary-button min-h-[44px] sm:min-w-[140px]"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {RAP_GENRE_CHIPS.map((label) => (
              <button
                key={label}
                type="button"
                disabled={searching}
                onClick={() => onChipClick(label)}
                className="chip min-h-[34px] cursor-pointer text-xs hover:bg-white/10 disabled:opacity-40"
                title={`Search "${label} type beat"`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">{searchStatus}</p>

          {youtubeResults.length > 0 ? (
            <div className="scroll-thin mt-5 grid max-h-[420px] gap-2 overflow-auto pr-1 sm:grid-cols-2">
              {youtubeResults.map((result) => {
                const active =
                  selectedBeat?.youtubeVideoId === result.youtubeVideoId;
                return (
                  <button
                    key={result.youtubeVideoId}
                    onClick={() => onSelectYouTubeResult(result)}
                    className={`group flex gap-3 rounded-2xl border p-3 text-left transition-all ${
                      active
                        ? "border-orange-300/70 bg-orange-300/10 shadow-lg shadow-orange-950/30"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    {result.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.thumbnailUrl}
                        alt=""
                        className="size-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-white/5">
                        <Music2 className="size-6 text-white/30" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {result.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {result.channel}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.bpm ? (
                          <span className="chip chip-accent font-mono">
                            {result.bpm} BPM
                          </span>
                        ) : null}
                        {result.timeSignature ? (
                          <span className="chip font-mono">
                            {result.timeSignature}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* RIGHT: SETTINGS + READY-TO-PLAY */}
      <aside className="space-y-5 sm:space-y-6">
        <div className="glass rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-7">
          <p className="font-display text-lg font-semibold">Settings</p>
          <p className="text-xs text-white/50">Tune the round</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Difficulty">
              <select
                className="input min-h-[44px]"
                value={difficulty}
                onChange={(e) =>
                  onDifficultyChange(
                    e.target.value as RhymeWord["difficulty"],
                  )
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Wordlist">
              <select
                className="input min-h-[44px]"
                value={wordlistId}
                onChange={(e) =>
                  onWordlistChange(e.target.value as WordlistId)
                }
              >
                {WORDLISTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pattern">
              <select
                className="input min-h-[44px]"
                value={pattern}
                onChange={(e) =>
                  onPatternChange(e.target.value as RhymePattern)
                }
              >
                {RHYME_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration">
              <select
                className="input min-h-[44px]"
                value={roundSeconds}
                onChange={(e) => onRoundSecondsChange(Number(e.target.value))}
              >
                {[60, 90, 120, 180].map((item) => (
                  <option key={item} value={item}>
                    {item}s
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Players">
              <select
                className="input min-h-[44px]"
                value={numPlayers}
                onChange={(e) => onNumPlayersChange(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((item) => (
                  <option key={item} value={item}>
                    {item} {item === 1 ? "player" : "players"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/50">
            {mode.description}
          </p>
        </div>

        {/* Ready to play — minimal: prompt + Play button only */}
        <div
          className={`rounded-[1.5rem] p-5 transition-all sm:rounded-[2rem] sm:p-7 ${
            selectedBeat
              ? "bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-600 text-black shadow-2xl shadow-fuchsia-900/40"
              : "glass text-white/55"
          }`}
        >
          {selectedBeat ? (
            <>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.32em] text-black/70">
                Ready to play
              </p>
              <p className="mt-2 text-sm leading-6 text-black/80">
                Beat locked in. Tap Play when you&apos;re ready to rhyme.
              </p>
              <button
                onClick={onPlay}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 font-display text-base font-bold text-white shadow-lg shadow-black/40 transition-all hover:bg-zinc-900"
              >
                <Play className="size-5" /> Play
              </button>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold text-white/80">
                Pick a beat to continue
              </p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Search YouTube or tap a genre chip on the left. Then you&apos;ll
                get the full game stage.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* GAME SCREEN                                                          */
/* ──────────────────────────────────────────────────────────────────── */

function GameScreen({
  beat,
  mode: _mode,
  difficulty,
  wordlistId,
  pattern,
  roundSeconds,
  numPlayers,
  onExit,
}: {
  beat: Beat;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  wordlistId: WordlistId;
  pattern: RhymePattern;
  roundSeconds: number;
  numPlayers: number;
  onExit: () => void;
}) {
  void _mode;
  const [wordIndex, setWordIndex] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0); // seconds

  const player = useYouTubePlayer({
    videoId: beat.youtubeVideoId,
    startSeconds: beat.startSeconds ?? 0,
    offsetSeconds: syncOffset,
  });

  const originRef = useRef<number | null>(null);
  const PREROLL_BARS = 2;

  useEffect(() => {
    if (player.isPlaying && originRef.current === null) {
      originRef.current = player.currentTime;
    }
  }, [player.isPlaying, player.currentTime]);

  useEffect(() => {
    originRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWordIndex(0);
  }, [beat.youtubeVideoId]);

  const fadeCancelRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (player.isPlaying) {
      fadeCancelRef.current?.();
      player.setVolume(0);
      fadeCancelRef.current = player.fadeVolume(0, 80, 900);
    }
    return () => fadeCancelRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isPlaying]);

  const elapsedSeconds = Math.max(
    0,
    // eslint-disable-next-line react-hooks/refs
    player.currentTime - (originRef.current ?? player.currentTime),
  );
  const clock = getBeatClock({ ...beat, startSeconds: 0 }, elapsedSeconds);

  const inPreroll = player.isPlaying && clock.currentBar <= PREROLL_BARS;
  const liveBar = Math.max(0, clock.currentBar - PREROLL_BARS);
  const countdownNumber = inPreroll
    ? PREROLL_BARS - (clock.currentBar - 1)
    : 0;

  const poolForDifficulty = useMemo(() => {
    if (difficulty === "advanced") return rhymeWords;
    if (difficulty === "intermediate")
      return rhymeWords.filter(
        (w) => w.difficulty === "beginner" || w.difficulty === "intermediate",
      );
    return rhymeWords.filter((w) => w.difficulty === "beginner");
  }, [difficulty]);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const groupSpan = difficulty === "advanced" ? 4 : 2;
  const queue = useMemo(() => {
    const groups = Array.from(
      new Set(poolForDifficulty.map((w) => w.rhymeGroup)),
    );
    const shuffledGroups = shuffle(groups);
    const out: RhymeWord[] = [];
    for (const g of shuffledGroups) {
      const inGroup = shuffle(
        poolForDifficulty.filter((w) => w.rhymeGroup === g),
      );
      if (!inGroup.length) continue;
      for (let i = 0; i < groupSpan; i++) {
        out.push(inGroup[i % inGroup.length]);
      }
    }
    return out.length ? out : shuffle(poolForDifficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolForDifficulty, groupSpan, shuffleSeed, beat.youtubeVideoId]);

  const barOffset = inPreroll ? 0 : Math.max(0, liveBar - 1);
  const displayedIndex = wordIndex + barOffset;
  const safeQueue = queue.length ? queue : rhymeWords;
  const visibleWords: RhymeWord[] = Array.from(
    { length: VISIBLE_BARS },
    (_, i) => safeQueue[(displayedIndex + i) % safeQueue.length],
  );

  const liveSeconds = inPreroll
    ? 0
    : Math.max(0, elapsedSeconds - PREROLL_BARS * clock.secondsPerBar);
  const progress = Math.min(100, (liveSeconds / roundSeconds) * 100);
  const timeLeft = Math.max(0, roundSeconds - Math.floor(liveSeconds));

  const fadedOutRef = useRef(false);
  useEffect(() => {
    if (!player.isPlaying) {
      fadedOutRef.current = false;
      return;
    }
    if (!fadedOutRef.current && timeLeft <= 2 && timeLeft > 0) {
      fadedOutRef.current = true;
      player.fadeVolume(80, 0, 1800);
    }
  }, [timeLeft, player]);

  function nextManual() {
    setWordIndex((c) => c + 1);
  }
  function resetRound() {
    originRef.current = player.currentTime;
    setWordIndex(0);
    setShuffleSeed((s) => s + 1);
    fadedOutRef.current = false;
    player.setVolume(80);
  }
  function tapDrop() {
    originRef.current = player.currentTime;
    setWordIndex(0);
  }

  const wordlistLabel =
    WORDLISTS.find((w) => w.id === wordlistId)?.label ?? "Basic";

  return (
    <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,_1fr)_360px]">
      {/* LEFT: STAGE */}
      <div className="space-y-3 sm:space-y-4">
        <div className="glass relative overflow-hidden rounded-[1.5rem] p-0 sm:rounded-[2rem]">
          <BeatPulseBg
            beatProgress={clock.beatProgress}
            isPlaying={player.isPlaying}
          />

          <div className="relative flex min-h-[460px] flex-col gap-4 px-3 py-5 sm:min-h-[560px] sm:px-5 sm:py-6">
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/55 sm:gap-2">
              {player.status === "loading" ? (
                <span className="chip">Loading…</span>
              ) : null}
              {player.status === "ready" && !player.isPlaying ? (
                <span className="chip">Press play to start</span>
              ) : null}
              {player.isPlaying ? (
                <span className="chip chip-accent">
                  <span className="size-1.5 animate-pulse rounded-full bg-orange-300" />
                  {inPreroll ? "Count-in" : "Live · synced"}
                </span>
              ) : null}
              <span className="chip font-mono">
                Bar {Math.max(1, liveBar || 1)} · {clock.beatInBar}/
                {clock.beatsPerBar}
              </span>
              <span className="chip">{wordlistLabel}</span>
              <span className="chip">{pattern}</span>
              <span className="chip">
                <Users className="size-3" /> {numPlayers}P
              </span>
            </div>

            <BeatRoad
              rows={visibleWords}
              beatInBar={clock.beatInBar}
              beatProgress={clock.beatProgress}
              isPlaying={player.isPlaying && !inPreroll}
              barOffset={barOffset}
              countdown={countdownNumber}
              difficulty={difficulty}
              groupSpan={groupSpan}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] p-2.5 sm:gap-3 sm:rounded-[1.5rem] sm:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={player.toggle}
              className="primary-button min-h-[44px] !min-w-[110px]"
            >
              {player.isPlaying ? (
                <>
                  <Pause className="size-5" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-5" /> Play
                </>
              )}
            </button>
            <button
              onClick={tapDrop}
              className="secondary-button min-h-[44px]"
            >
              <Music2 className="size-4" /> Tap on drop
            </button>
            <button onClick={nextManual} className="ghost-button min-h-[44px]">
              <SkipForward className="size-4" /> Skip
            </button>
            <button onClick={resetRound} className="ghost-button min-h-[44px]">
              <RotateCcw className="size-4" /> Reset
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/55">
            <span className="font-mono text-base font-semibold text-white">
              {fmtTime(timeLeft)}
            </span>
            <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-white/10 sm:block md:w-48">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-400 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: PLAYER + SYNC */}
      <aside className="space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-black sm:rounded-[2rem]">
          <div className="aspect-video w-full">
            <div ref={player.containerRef} className="h-full w-full" />
          </div>
        </div>

        <div className="glass rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-5">
          <p className="font-display text-sm font-semibold">Sync nudge</p>
          <p className="text-xs text-white/50">
            If the ball feels early or late, slide to align with the kick. Or
            tap the &ldquo;Tap on drop&rdquo; button on the downbeat.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={syncOffset}
              onChange={(e) => setSyncOffset(Number(e.target.value))}
              className="h-2 flex-1 accent-orange-400"
            />
            <span className="w-14 text-right font-mono text-xs text-white/70">
              {syncOffset >= 0 ? "+" : ""}
              {(syncOffset * 1000).toFixed(0)}ms
            </span>
          </div>
          <button
            onClick={() => setSyncOffset(0)}
            className="mt-2 text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
          >
            Reset to 0
          </button>
        </div>

        <div className="glass rounded-[1.5rem] p-4 text-xs leading-6 text-white/55 sm:rounded-[2rem] sm:p-5">
          <p className="font-display text-sm font-semibold text-white">
            How it works
          </p>
          <p className="mt-2">
            2-bar count-in, then the ball bounces left → right across each bar
            at {beat.bpm} BPM (
            <span className="font-mono">
              {secondsPerBeat(beat.bpm).toFixed(2)}s
            </span>
            /beat). Rhyme the word under the last bar when the ball lands.
          </p>
          <button
            onClick={onExit}
            className="mt-3 text-white/60 underline-offset-2 hover:text-white hover:underline"
          >
            ← Back to beat picker
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* BEAT ROAD                                                            */
/* 5 same-height bars, flush bottom. Bars slide UP & out when their     */
/* beat passes; new bars slide in from the right. Ball rides above on   */
/* a layout-independent translateX percentage so it animates on mobile. */
/* ──────────────────────────────────────────────────────────────────── */

function rowColor(
  absoluteBarIdx: number,
  groupSpan: number,
): {
  bar: string;
  ball: string;
  glow: string;
} {
  const isOrange = Math.floor(absoluteBarIdx / groupSpan) % 2 === 0;
  return isOrange
    ? {
        bar: "bg-orange-400 text-black",
        ball: "bg-orange-400",
        glow: "shadow-[0_0_24px_8px_rgba(251,146,60,0.55)]",
      }
    : {
        bar: "bg-sky-400 text-black",
        ball: "bg-sky-400",
        glow: "shadow-[0_0_24px_8px_rgba(56,189,248,0.55)]",
      };
}

function BeatRoad({
  rows,
  beatInBar,
  beatProgress,
  isPlaying,
  barOffset,
  countdown,
  difficulty,
  groupSpan,
}: {
  rows: RhymeWord[];
  beatInBar: number;
  beatProgress: number;
  isPlaying: boolean;
  barOffset: number;
  countdown: number;
  difficulty: RhymeWord["difficulty"];
  groupSpan: number;
}) {
  // Ball position: continuous across the 5 visible bars. Active bar = bar 1.
  // Ball moves left→right across bar 1, then snaps back when bar 1 finishes
  // (handled by the bar slide-up animation, not by the ball).
  const continuousBeat = Math.max(
    0,
    Math.min(VISIBLE_BARS, beatInBar - 1 + beatProgress),
  );
  // Map [0..1] = inside bar 1's slot. Bar 1 occupies the FIRST of VISIBLE_BARS
  // columns, so center of bar 1 = (0.5/VISIBLE_BARS)*100 %.
  // Ball travels across bar 1 only — from 0 → 1/VISIBLE_BARS of the row.
  const beatsPerBar = 4; // standard 4/4 — drives ball traversal across bar 1
  const ballPctInBar = Math.min(1, continuousBeat / beatsPerBar);
  const barWidthPct = 100 / VISIBLE_BARS;
  // translateX as % of the BALL ITSELF would be wrong; we use left% of the
  // parent track. We use `left` with calc to subtract half ball width.
  const ballLeftPct = ballPctInBar * barWidthPct;

  // Hop arc above the bar
  const hopProgress = beatProgress;
  const hop = isPlaying ? Math.sin(hopProgress * Math.PI) : 0;
  const hopHeight = 44;
  const ballY = -hop * hopHeight;
  const flatness = 1 - hop;
  const scaleX = 1 + flatness * 0.25;
  const scaleY = 1 - flatness * 0.18;

  // The first (active) bar slides UP & out as its beats complete.
  // Use full bar duration (beatsPerBar beats) as the slide window so the
  // exit is smooth across the whole bar lifecycle.
  const barLifeProgress = Math.min(
    1,
    (beatInBar - 1 + beatProgress) / beatsPerBar,
  );
  // Only kick the slide animation in during the last ~25% of the bar so the
  // bar stays put while the ball traverses it.
  const slideStart = 0.75;
  const slideAmount =
    barLifeProgress > slideStart
      ? (barLifeProgress - slideStart) / (1 - slideStart)
      : 0;
  const activeSlideY = -slideAmount * 120; // px upward
  const activeOpacity = 1 - slideAmount * 0.9;

  return (
    <div className="relative flex flex-1 flex-col justify-end">
      {/* Track row — 5 same-height bars, flush bottom */}
      <div className="relative w-full">
        {/* Ball layer: spans full row width, ball positioned by left % */}
        {isPlaying ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0"
            aria-hidden
          >
            <div
              className={`absolute size-7 rounded-full sm:size-8 ${rowColor(barOffset, groupSpan).ball} ${rowColor(barOffset, groupSpan).glow}`}
              style={{
                left: `calc(${ballLeftPct}% + ${barWidthPct / 2}% - 1rem)`,
                top: 0,
                transform: `translateY(calc(-100% + ${ballY}px)) scale(${scaleX}, ${scaleY})`,
                transition:
                  "left 90ms linear, background-color 200ms ease",
                willChange: "transform, left",
              }}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-5 items-end gap-1.5 sm:gap-3">
          {rows.map((w, colIdx) => {
            const isActive = colIdx === 0;
            const absBar = barOffset + colIdx;
            const palette = rowColor(absBar, groupSpan);

            // Word visibility rule — same as before but anchored to LAST bar
            // (col 4) being the "target" position when the bar becomes active
            // a few beats from now.
            const posInGroup = absBar % groupSpan;
            const wordVisible =
              difficulty === "beginner"
                ? true
                : difficulty === "intermediate"
                  ? posInGroup === 1
                  : posInGroup === 3;

            const cellLanded =
              isActive && beatProgress < 0.18 && beatInBar >= 1;

            // All bars: same height, flush bottom.
            // Active bar slides up & out near end of its life.
            // Queue bars slide left to fill the gap (handled by grid order
            // change next render — we add a translateX transition to soften).
            const style: React.CSSProperties = {
              transform: isActive
                ? `translateY(${activeSlideY}px)`
                : "translateY(0)",
              opacity: isActive ? activeOpacity : 1,
              transition:
                "transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 240ms ease-out",
              willChange: "transform, opacity",
            };

            return (
              <div
                key={`${absBar}-${w.id}`}
                className={`relative flex h-16 items-center justify-center rounded-xl px-1.5 text-center font-display text-sm font-bold shadow-[0_4px_0_rgba(0,0,0,0.35)] sm:h-20 sm:px-2 sm:text-base md:text-lg ${palette.bar} ${
                  isActive ? "ring-2 ring-white/70" : ""
                } ${cellLanded ? "cell-pop" : ""}`}
                style={style}
              >
                <span className="block truncate">
                  {wordVisible ? w.word : "?"}
                </span>
                {/* Bar index dot (tiny) */}
                <span
                  className="absolute bottom-1 right-1.5 font-mono text-[0.55rem] font-semibold opacity-50"
                  aria-hidden
                >
                  {colIdx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Count-in overlay */}
      {countdown > 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            key={countdown}
            className="countdown-pop font-display text-[6rem] font-black leading-none text-white/90 drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:text-[8rem]"
          >
            {countdown}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-center text-[0.6rem] uppercase tracking-[0.28em] text-white/45 sm:text-[0.65rem] sm:tracking-[0.32em]">
        Ball rides bar 1 · target word lands on bar 5
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* BACKGROUND PULSE                                                     */
/* ──────────────────────────────────────────────────────────────────── */

function BeatPulseBg({
  beatProgress,
  isPlaying,
}: {
  beatProgress: number;
  isPlaying: boolean;
}) {
  const intensity = isPlaying ? 1 - beatProgress : 0;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(circle at 50% 55%, rgba(251, 146, 60, ${
          0.05 + intensity * 0.12
        }) 0%, transparent 55%)`,
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* HELPERS                                                              */
/* ──────────────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
