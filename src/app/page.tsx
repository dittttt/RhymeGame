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
import { WORDLISTS, type WordlistId, getWordlist } from "@/lib/wordlists";
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
  const [mode, setMode] = useState<RhymeMode>(rhymeModes[0]);
  const [difficulty, setDifficulty] =
    useState<RhymeWord["difficulty"]>("beginner");
  const [roundSeconds, setRoundSeconds] = useState(defaultRoundSeconds);
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [wordlistId, setWordlistId] = useState<WordlistId>("basic");
  const [rhymePattern, setRhymePattern] = useState<RhymePattern>("AABB");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState(
    "Search YouTube or tap a genre to load type beats.",
  );
  const [searching, setSearching] = useState(false);

  async function searchYouTube(overrideQuery?: string) {
    const q = (overrideQuery ?? youtubeQuery).trim();
    if (!q) return;
    if (overrideQuery !== undefined) setYoutubeQuery(overrideQuery);
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
      setYoutubeResults(data.items ?? []);
      setSearchStatus(
        data.error ??
          `${data.note ? `${data.note} ` : ""}Found ${data.items?.length ?? 0} beats with parseable BPM.`,
      );
    } finally {
      setSearching(false);
    }
  }

  function selectYouTubeResult(result: SearchResult) {
    const parsedBpm = result.bpm ?? 90;
    const parsedTimeSignature: Beat["timeSignature"] =
      result.timeSignature ?? "4/4";

    setSelectedBeat({
      id: result.youtubeVideoId,
      youtubeVideoId: result.youtubeVideoId,
      title: result.title,
      channel: result.channel,
      sourceUrl: result.sourceUrl,
      genre: "Hip hop",
      style: "Type Beat",
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
    // Auto-jump straight to play — no separate "Play" step needed since the
    // user already picked the beat.
    setStage("play");
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <BackgroundOrbs />
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-5 sm:px-8 sm:py-7">
        <TopBar
          stage={stage}
          selectedBeat={selectedBeat}
          onBack={() => setStage("picker")}
        />

        <div className="mt-6 flex-1">
          {stage === "picker" ? (
            <BeatPickerScreen
              selectedBeat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              roundSeconds={roundSeconds}
              numPlayers={numPlayers}
              wordlistId={wordlistId}
              rhymePattern={rhymePattern}
              youtubeQuery={youtubeQuery}
              youtubeResults={youtubeResults}
              searchStatus={searchStatus}
              searching={searching}
              onModeChange={setMode}
              onDifficultyChange={setDifficulty}
              onRoundSecondsChange={setRoundSeconds}
              onNumPlayersChange={setNumPlayers}
              onWordlistChange={setWordlistId}
              onRhymePatternChange={setRhymePattern}
              onYoutubeQueryChange={setYoutubeQuery}
              onSearchYouTube={searchYouTube}
              onSelectYouTubeResult={selectYouTubeResult}
            />
          ) : selectedBeat ? (
            <GameScreen
              beat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              roundSeconds={roundSeconds}
              numPlayers={numPlayers}
              wordlistId={wordlistId}
              rhymePattern={rhymePattern}
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
    <nav className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
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
          <p className="font-display text-xl font-bold leading-none tracking-tight">
            RhymeGame
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.32em] text-white/45">
            {stage === "play" && selectedBeat
              ? `${selectedBeat.bpm} BPM · ${selectedBeat.timeSignature} · ${selectedBeat.style}`
              : "freestyle to the beat"}
          </p>
        </div>
      </div>
      <div className="chip">
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
  roundSeconds: number;
  numPlayers: number;
  wordlistId: WordlistId;
  rhymePattern: RhymePattern;
  youtubeQuery: string;
  youtubeResults: SearchResult[];
  searchStatus: string;
  searching: boolean;
  onModeChange: (mode: RhymeMode) => void;
  onDifficultyChange: (difficulty: RhymeWord["difficulty"]) => void;
  onRoundSecondsChange: (seconds: number) => void;
  onNumPlayersChange: (n: number) => void;
  onWordlistChange: (id: WordlistId) => void;
  onRhymePatternChange: (p: RhymePattern) => void;
  onYoutubeQueryChange: (query: string) => void;
  onSearchYouTube: (overrideQuery?: string) => void;
  onSelectYouTubeResult: (result: SearchResult) => void;
}) {
  const {
    selectedBeat,
    mode,
    difficulty,
    roundSeconds,
    numPlayers,
    wordlistId,
    rhymePattern,
    youtubeQuery,
    youtubeResults,
    searchStatus,
    searching,
    onModeChange: _onModeChange,
    onDifficultyChange,
    onRoundSecondsChange,
    onNumPlayersChange,
    onWordlistChange,
    onRhymePatternChange,
    onYoutubeQueryChange,
    onSearchYouTube,
    onSelectYouTubeResult,
  } = props;
  void _onModeChange;
  void mode;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.4fr)_minmax(320px,_0.9fr)]">
      {/* LEFT: BEAT BROWSER */}
      <div className="space-y-6">
        {/* Hero */}
        <header className="glass rounded-[2rem] p-6 sm:p-8">
          <p className="chip chip-accent">
            <Sparkles className="size-3.5" /> Step 1
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Pick your beat
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
            Search YouTube for any instrumental, or tap a genre below to load
            type beats. Pick one and the round starts right away.
          </p>
        </header>

        {/* YouTube search */}
        <div className="glass rounded-[2rem] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-500/20 text-rose-200">
              <Search className="size-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">
                Search YouTube
              </p>
              <p className="text-xs text-white/50">
                Type a vibe, BPM, or producer name
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
              className="input flex-1 text-base"
              value={youtubeQuery}
              onChange={(e) => onYoutubeQueryChange(e.target.value)}
              placeholder="boom bap 90 bpm…"
            />
            <button
              type="submit"
              disabled={searching}
              className="primary-button sm:min-w-[140px]"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {RAP_GENRE_CHIPS.map((label) => (
              <button
                key={label}
                type="button"
                disabled={searching}
                onClick={() =>
                  onSearchYouTube(`${label.toLowerCase()} type beat`)
                }
                className="chip chip-button disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">{searchStatus}</p>

          {youtubeResults.length > 0 ? (
            <div className="scroll-thin mt-5 grid max-h-[520px] gap-2 overflow-auto pr-1 sm:grid-cols-2">
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
                        : "border-white/10 bg-white/[0.03] hover:border-orange-300/40 hover:bg-white/[0.06]"
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
                      <div className="mt-2 flex flex-wrap items-center gap-1">
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
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-400/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-orange-200 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="size-3" /> Play
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              Tap a genre above or run a search to load beats.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: GAME SETTINGS */}
      <aside className="space-y-6">
        <div className="glass rounded-[2rem] p-6 sm:p-7">
          <p className="chip chip-accent">
            <Sparkles className="size-3.5" /> Step 2
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight">
            Game settings
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Tune the round before you pick a beat.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="Players">
              <select
                className="input"
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
            <Field label="Duration">
              <select
                className="input"
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
            <Field label="Difficulty">
              <select
                className="input"
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
                className="input"
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
            <Field label="Rhyme pattern">
              <select
                className="input"
                value={rhymePattern}
                onChange={(e) =>
                  onRhymePatternChange(e.target.value as RhymePattern)
                }
              >
                {RHYME_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="rounded-[2rem] p-6 sm:p-7 glass text-white/70">
          <p className="font-display text-base font-semibold text-white/90">
            How it works
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-white/55">
            <li>
              <span className="font-mono text-orange-300">1.</span> Tweak game
              settings above.
            </li>
            <li>
              <span className="font-mono text-orange-300">2.</span> Tap a
              genre or run a search.
            </li>
            <li>
              <span className="font-mono text-orange-300">3.</span> Click any
              beat — round starts instantly.
            </li>
          </ol>
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
  mode,
  difficulty,
  roundSeconds,
  numPlayers,
  wordlistId,
  rhymePattern,
  onExit,
}: {
  beat: Beat;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  roundSeconds: number;
  numPlayers: number;
  wordlistId: WordlistId;
  rhymePattern: RhymePattern;
  onExit: () => void;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0); // seconds

  const player = useYouTubePlayer({
    videoId: beat.youtubeVideoId,
    startSeconds: beat.startSeconds ?? 0,
    offsetSeconds: syncOffset,
  });

  // Elapsed = audio time - origin (where we locked the downbeat).
  const originRef = useRef<number | null>(null);
  // 2-bar musical pre-roll before scoring begins.
  const PREROLL_BARS = 2;

  useEffect(() => {
    if (player.isPlaying && originRef.current === null) {
      originRef.current = player.currentTime;
    }
  }, [player.isPlaying, player.currentTime]);

  useEffect(() => {
    originRef.current = null;
    setWordIndex(0);
  }, [beat.youtubeVideoId]);

  // Audio fade-in when play starts, fade-out near round end.
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
    player.currentTime - (originRef.current ?? player.currentTime),
  );
  const clock = getBeatClock({ ...beat, startSeconds: 0 }, elapsedSeconds);

  // Pre-roll vs live
  const inPreroll = player.isPlaying && clock.currentBar <= PREROLL_BARS;
  const liveBar = Math.max(0, clock.currentBar - PREROLL_BARS); // 0 before, 1..n during
  const countdownNumber = inPreroll
    ? PREROLL_BARS - (clock.currentBar - 1)
    : 0;

  // Pool of words allowed at this difficulty, optionally narrowed by the
  // selected wordlist (we intersect by spelling; if the intersection is empty
  // we fall back to the full difficulty pool so the round still plays).
  const poolForDifficulty = useMemo(() => {
    const base =
      difficulty === "advanced"
        ? rhymeWords
        : difficulty === "intermediate"
          ? rhymeWords.filter(
              (w) =>
                w.difficulty === "beginner" ||
                w.difficulty === "intermediate",
            )
          : rhymeWords.filter((w) => w.difficulty === "beginner");
    const wl = new Set(
      getWordlist(wordlistId).words.map((w) => w.toLowerCase()),
    );
    const narrowed = base.filter((w) => wl.has(w.word.toLowerCase()));
    return narrowed.length >= 4 ? narrowed : base;
  }, [difficulty, wordlistId]);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  // Queue of WORDS, one per bar, built from the chosen rhyme pattern.
  // Each letter in the pattern picks a fresh rhyme group; identical letters
  // reuse the same group, so AABB → group X X Y Y, ABAB → X Y X Y, etc.
  const patternLetters = useMemo(
    () =>
      rhymePattern === "Freeform"
        ? ["A", "B", "C", "D"]
        : rhymePattern.split(""),
    [rhymePattern],
  );
  const queue = useMemo(() => {
    const allGroups = shuffle(
      Array.from(new Set(poolForDifficulty.map((w) => w.rhymeGroup))),
    );
    if (allGroups.length === 0) return shuffle(poolForDifficulty);
    const out: RhymeWord[] = [];
    const cycles = difficulty === "advanced" ? 4 : 2; // total bars per cycle multiplier
    for (let c = 0; c < cycles; c++) {
      const letterToGroup = new Map<string, string>();
      let cursor = (c * patternLetters.length) % allGroups.length;
      for (const letter of patternLetters) {
        if (!letterToGroup.has(letter)) {
          letterToGroup.set(letter, allGroups[cursor % allGroups.length]);
          cursor++;
        }
        const g = letterToGroup.get(letter)!;
        const inGroup = poolForDifficulty.filter((w) => w.rhymeGroup === g);
        const pick = inGroup[Math.floor(Math.random() * inGroup.length)];
        if (pick) out.push(pick);
      }
    }
    return out.length ? out : shuffle(poolForDifficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolForDifficulty, patternLetters, difficulty, shuffleSeed, beat.youtubeVideoId]);

  // Coloring stride: how many adjacent bars share a color. AABB=2, AAAA=4,
  // everything else (ABAB / ABBA / Freeform) = 1 so colors alternate per bar.
  const groupSpan =
    rhymePattern === "AAAA" ? 4 : rhymePattern === "AABB" ? 2 : 1;

  // 4 visible bars (matches the real app). Active row = top.
  const VISIBLE_ROWS = VISIBLE_BARS;
  const barOffset = inPreroll ? 0 : Math.max(0, liveBar - 1);
  const displayedIndex = wordIndex + barOffset;
  const safeQueue = queue.length ? queue : rhymeWords;
  const visibleWords: RhymeWord[] = Array.from(
    { length: VISIBLE_ROWS },
    (_, i) => safeQueue[(displayedIndex + i) % safeQueue.length],
  );

  // Round timer ticks only during live play (after pre-roll).
  const liveSeconds = inPreroll
    ? 0
    : Math.max(0, elapsedSeconds - PREROLL_BARS * clock.secondsPerBar);
  const progress = Math.min(100, (liveSeconds / roundSeconds) * 100);
  const timeLeft = Math.max(0, roundSeconds - Math.floor(liveSeconds));

  // Fade out near the end of the round.
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
    // Lock the downbeat to *now*. Useful if YouTube intro pushes the beat off.
    originRef.current = player.currentTime;
    setWordIndex(0);
  }

  return (
    <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,_1fr)_360px]">
      {/* MOBILE: video first so user sees what's playing; desktop keeps stage left */}
      <aside className="space-y-4 xl:order-2">
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-black sm:rounded-[2rem]">
          <div className="aspect-video w-full">
            <div ref={player.containerRef} className="h-full w-full" />
          </div>
        </div>
      </aside>

      {/* LEFT: STAGE */}
      <div className="space-y-4 xl:order-1">
        {/* Rhyme ladder stage — matches the site's glass theme */}
        <div className="glass relative overflow-hidden rounded-2xl p-0 sm:rounded-[2rem]">
          <BeatPulseBg
            beatProgress={clock.beatProgress}
            isPlaying={player.isPlaying}
          />

          <div className="relative flex min-h-[420px] flex-col gap-4 px-3 py-5 sm:min-h-[600px] sm:px-5 sm:py-6">
            {/* Status line */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/55">
              {player.status === "loading" ? (
                <span className="chip">Loading…</span>
              ) : null}
              {player.status === "ready" && !player.isPlaying ? (
                <span className="chip">Press play to start</span>
              ) : null}
              {player.isPlaying ? (
                <span className="chip chip-accent">
                  <span className="size-1.5 animate-pulse rounded-full bg-orange-300" />
                  {inPreroll ? "Count-in" : "Live · synced to audio"}
                </span>
              ) : null}
              <span className="chip font-mono">
                Bar {Math.max(1, liveBar || 1)} · {clock.beatInBar}/
                {clock.beatsPerBar}
              </span>
              <span className="chip">
                <Users className="size-3" /> {numPlayers}P
              </span>
            </div>

            {/* Rhyme ladder */}
            <RhymeLadder
              rows={visibleWords}
              beatInBar={clock.beatInBar}
              beatProgress={clock.beatProgress}
              isPlaying={player.isPlaying}
              barOffset={barOffset}
              countdown={countdownNumber}
              difficulty={difficulty}
              groupSpan={groupSpan}
              getCurrentTimeNow={player.getCurrentTimeNow}
              beat={beat}
              startSeconds={originRef.current ?? beat.startSeconds ?? 0}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 sm:rounded-[1.5rem]">
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              onClick={player.toggle}
              className="primary-button !min-w-[120px] flex-1 sm:flex-none"
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
            <button onClick={tapDrop} className="secondary-button">
              <Music2 className="size-4" /> Tap on drop
            </button>
            <button onClick={nextManual} className="ghost-button">
              <SkipForward className="size-4" /> Skip
            </button>
            <button onClick={resetRound} className="ghost-button">
              <RotateCcw className="size-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: PLAYBACK + SYNC + INFO (mobile: appears below stage) */}
      <aside className="space-y-4 xl:order-3">
        <div className="glass rounded-2xl p-4 sm:rounded-[2rem] sm:p-5">
          <p className="font-display text-sm font-semibold">Playback</p>
          <p className="text-xs text-white/50">Time remaining in this round.</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-2xl font-semibold text-white tabular-nums">
              {fmtTime(timeLeft)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-400 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 sm:rounded-[2rem] sm:p-5">
          <p className="font-display text-sm font-semibold">Sync nudge</p>
          <p className="text-xs text-white/50">
            If the ball feels early or late, slide to align with the kick. Or
            tap the “Tap on drop” button on the downbeat.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={syncOffset}
              onChange={(e) => setSyncOffset(Number(e.target.value))}
              className="flex-1 accent-orange-400"
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

        <div className="glass rounded-2xl p-4 text-xs leading-6 text-white/55 sm:rounded-[2rem] sm:p-5">
          <p className="font-display text-sm font-semibold text-white">
            How it works
          </p>
          <p className="mt-2">
            2-bar count-in, then the ball bounces left → right across each bar
            at {beat.bpm} BPM (
            <span className="font-mono">
              {secondsPerBeat(beat.bpm).toFixed(2)}s
            </span>
            /beat). Rhyme the word on the right when the ball lands.
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
/* RHYME LADDER (5 rows × 4 cells, ball arcs above active row)          */
/* ──────────────────────────────────────────────────────────────────── */

// Pattern: pairs of same color (2 bars orange, 2 bars blue) for beginner/intermediate,
// quads (4 bars same color) for advanced — driven by groupSpan.
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

function RhymeLadder({
  rows,
  beatInBar,
  beatProgress,
  isPlaying,
  barOffset,
  countdown,
  difficulty,
  groupSpan,
  getCurrentTimeNow,
  beat,
  startSeconds,
}: {
  rows: RhymeWord[];
  beatInBar: number;
  beatProgress: number;
  isPlaying: boolean;
  barOffset: number;
  countdown: number;
  difficulty: RhymeWord["difficulty"];
  groupSpan: number;
  getCurrentTimeNow: () => number;
  beat: Beat;
  startSeconds: number;
}) {
  // Drive the ball + bar slide imperatively via rAF so it stays smooth even
  // when React state updates lag (YT iframe getCurrentTime ticks every ~250ms
  // on mobile). We read the wallclock-interpolated time directly each frame.
  const ballRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const beatsPerBar = 4;
  const secPerBeat = 60 / Math.max(1, beat.bpm);
  const secPerBar = secPerBeat * beatsPerBar;
  const palette0 = rowColor(barOffset, groupSpan);

  useEffect(() => {
    if (!isPlaying) {
      // Reset to start when not playing.
      if (ballRef.current) {
        ballRef.current.style.transform = `translate3d(0px, -100%, 0) scale(1,1)`;
      }
      if (stackRef.current) {
        stackRef.current.style.transform = `translate3d(0,0,0)`;
      }
      return;
    }
    let raf = 0;
    const loop = () => {
      const ball = ballRef.current;
      const stack = stackRef.current;
      if (ball && stack) {
        const t = getCurrentTimeNow();
        const elapsed = Math.max(0, t - (startSeconds ?? 0));
        // Continuous beat position in current bar, 0..beatsPerBar
        const beatPosInBar = (elapsed / secPerBeat) % beatsPerBar;
        // Map beat → CENTER of its cell (4 cells, centers at 12.5/37.5/62.5/87.5%).
        // 25% per beat; wraps modulo 100 at the bar boundary.
        const ballPct = (12.5 + beatPosInBar * 25) % 100;
        // Hop arc within current beat
        const phaseInBeat = beatPosInBar - Math.floor(beatPosInBar); // 0..1
        const hop = Math.sin(phaseInBeat * Math.PI);
        const hopHeight = 56;
        const ballY = -hop * hopHeight;
        const flatness = 1 - hop;
        const scaleX = 1 + flatness * 0.25;
        const scaleY = 1 - flatness * 0.18;
        // Use parent width to convert pct → px so transform stays GPU-friendly.
        const parentW = ball.parentElement?.offsetWidth ?? 0;
        const ballHalf = ball.offsetWidth / 2;
        const x = (ballPct / 100) * parentW - ballHalf;
        ball.style.transform = `translate3d(${x}px, calc(-100% + ${ballY}px), 0) scale(${scaleX}, ${scaleY})`;

        // Bar slide: smooth scroll-up so next row eases into active position
        // during the last beat of each bar (subtle, 8px max).
        const barProgress = (elapsed % secPerBar) / secPerBar; // 0..1
        const slidePx = barProgress * -4; // gentle parallax
        stack.style.transform = `translate3d(0, ${slidePx}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, getCurrentTimeNow, beat.bpm, startSeconds, secPerBar, secPerBeat]);

  // Pop the LANDED cell when ball touches down (start of each beat).
  // We still use React state for the cell-pop highlight since it's coarse.
  const justLanded = beatProgress < 0.18;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Stack: top row is the active bar; rows below scroll down into view. */}
      {/* pt-12 leaves headroom for the bouncing ball above the active row. */}
      <div className="relative flex-1 overflow-hidden pt-14">
        <div ref={stackRef} className="flex flex-col gap-3" style={{ willChange: "transform" }}>
          {rows.map((w, rowIdx) => {
            const isActiveRow = rowIdx === 0;
            const absBar = barOffset + rowIdx;
            const palette = rowColor(absBar, groupSpan);

            const posInGroup = absBar % groupSpan;
            const wordVisible =
              difficulty === "beginner"
                ? true
                : difficulty === "intermediate"
                  ? posInGroup === Math.max(0, groupSpan - 1)
                  : posInGroup === Math.max(0, groupSpan - 1);

            return (
              <div
                key={`${absBar}-${w.id}`}
                className="relative overflow-hidden"
                style={{
                  opacity: isActiveRow ? 1 : Math.max(0.2, 0.55 - rowIdx * 0.07),
                  transformOrigin: "center top",
                  transition: "opacity 220ms ease-out",
                }}
              >
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((col) => {
                    const isWordCell = col === 3;
                    const cellLanded =
                      isActiveRow &&
                      justLanded &&
                      col === Math.min(3, beatInBar - 1);

                    if (isWordCell) {
                      return (
                        <div
                          key={col}
                          className={`flex h-14 items-center justify-center overflow-hidden rounded-xl px-2 text-center font-display text-base font-bold shadow-[0_4px_0_rgba(0,0,0,0.35)] sm:h-16 sm:text-lg ${palette.bar} ${
                            isActiveRow ? "ring-2 ring-inset ring-white/70" : ""
                          } ${cellLanded ? "cell-pop" : ""}`}
                        >
                          {wordVisible ? w.word : "?"}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={col}
                        className={`flex h-14 items-center justify-center rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-transform duration-100 sm:h-16 ${
                          isActiveRow ? "bg-white/30" : "bg-white/15"
                        } ${cellLanded ? "cell-pop" : ""}`}
                      >
                        <span className="size-1.5 rounded-full bg-white/60" />
                      </div>
                    );
                  })}
                </div>

                {/* Bouncing ball — ONLY on the active row, driven imperatively */}
                {isActiveRow ? (
                  <div
                    ref={ballRef}
                    className={`pointer-events-none absolute left-0 top-0 size-7 rounded-full sm:size-8 ${palette0.ball} ${palette0.glow}`}
                    style={{
                      willChange: "transform",
                      visibility: isPlaying ? "visible" : "hidden",
                    }}
                  />
                ) : null}
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
            className="countdown-pop font-display text-[8rem] font-black leading-none text-white/90 drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          >
            {countdown}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.32em] text-white/45">
        Rap the word on the right · ball bounces 1 → 4
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
