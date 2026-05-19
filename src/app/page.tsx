"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import {
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
import { Select } from "@/components/ui/select";

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
  const [roundSeconds, setRoundSeconds] = useState(30);
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
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-white">
      <BackgroundOrbs />
      <SiteHeader
        stage={stage}
        selectedBeat={selectedBeat}
        onBack={() => setStage("picker")}
      />
      <section className="relative mx-auto flex w-full max-w-[1500px] flex-col px-4 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-14">
        <div className="flex-1">
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
              onStart={() => setStage("play")}
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
/* SITE HEADER                                                          */
/* ──────────────────────────────────────────────────────────────────── */

function SiteHeader({
  stage,
  selectedBeat,
  onBack,
}: {
  stage: Stage;
  selectedBeat: Beat | null;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0612]/70 backdrop-blur-xl">
      {/* Gradient hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-orange-400/60 to-fuchsia-500/60" />
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-3">
          {stage === "play" ? (
            <button
              onClick={onBack}
              className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
              aria-label="Back to beat picker"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-fuchsia-500 text-black shadow-lg shadow-fuchsia-900/30">
              <Music2 className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-none tracking-tight sm:text-xl">
              Rhyme Game
            </p>
            <p className="mt-1 truncate text-[0.6rem] uppercase tracking-[0.32em] text-white/45 sm:text-[0.65rem]">
              {stage === "play" && selectedBeat
                ? `${selectedBeat.bpm} BPM · ${selectedBeat.timeSignature} · ${selectedBeat.style}`
                : "MULTIPLAYER SOON"}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <span className="rounded-full bg-gradient-to-r from-orange-400/20 to-fuchsia-500/20 px-3 py-1.5 text-xs font-semibold text-orange-200 ring-1 ring-orange-300/40 sm:px-4 sm:text-sm">
            Solo
          </span>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 sm:px-4 sm:text-sm"
          >
            Multiplayer
            <span className="ml-1.5 hidden rounded-full bg-white/10 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider text-white/55 sm:inline">
              Soon
            </span>
          </button>
        </nav>
      </div>
    </header>
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
  onStart: () => void;
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
    onStart,
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
              <Select<string>
                ariaLabel="Players"
                value={String(numPlayers)}
                onValueChange={(v) => onNumPlayersChange(Number(v))}
                options={[1, 2, 3, 4].map((n) => ({
                  value: String(n),
                  label: `${n} ${n === 1 ? "player" : "players"}`,
                }))}
              />
            </Field>
            <Field label="Duration">
              <Select<string>
                ariaLabel="Duration"
                value={String(roundSeconds)}
                onValueChange={(v) => onRoundSecondsChange(Number(v))}
                options={[15, 30, 45, 60, 90, 120, 180].map((n) => ({
                  value: String(n),
                  label: `${n}s`,
                }))}
              />
            </Field>
            <Field label="Difficulty">
              <Select<RhymeWord["difficulty"]>
                ariaLabel="Difficulty"
                value={difficulty}
                onValueChange={onDifficultyChange}
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
              />
            </Field>
            <Field label="Wordlist">
              <Select<WordlistId>
                ariaLabel="Wordlist"
                value={wordlistId}
                onValueChange={onWordlistChange}
                options={WORDLISTS.map((w) => ({
                  value: w.id,
                  label: w.label,
                }))}
              />
            </Field>
            <Field label="Rhyme pattern">
              <Select<RhymePattern>
                ariaLabel="Rhyme pattern"
                value={rhymePattern}
                onValueChange={onRhymePatternChange}
                options={RHYME_PATTERNS.map((p) => ({ value: p, label: p }))}
              />
            </Field>
          </div>
        </div>

        {/* Beat preview */}
        {selectedBeat ? (
          <div className="glass rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="chip chip-accent">
                  <Play className="size-3.5" /> Preview
                </p>
                <p className="mt-2 line-clamp-1 font-display text-base font-semibold">
                  {selectedBeat.title}
                </p>
                <p className="truncate text-xs text-white/45">
                  {selectedBeat.bpm} BPM · {selectedBeat.timeSignature} ·{" "}
                  {selectedBeat.channel}
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <iframe
                key={selectedBeat.youtubeVideoId}
                src={`https://www.youtube.com/embed/${selectedBeat.youtubeVideoId}?rel=0&modestbranding=1`}
                title="Beat preview"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
            <button
              type="button"
              onClick={onStart}
              className="primary-button mt-4 w-full"
            >
              <Play className="size-4" /> Start round
            </button>
          </div>
        ) : (
          <div className="glass rounded-[2rem] p-6 text-center text-sm text-white/45 sm:p-7">
            Pick a beat to preview it here.
          </div>
        )}
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
  void mode;
  void onExit;
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
  // (countdownNumber removed; pre-roll lighting is driven directly off beatInBar)

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
    const cycles = difficulty === "advanced" ? 4 : 2;
    for (let c = 0; c < cycles; c++) {
      const letterToGroup = new Map<string, string>();
      const letterBag = new Map<string, RhymeWord[]>();
      let cursor = (c * patternLetters.length) % allGroups.length;
      for (const letter of patternLetters) {
        if (!letterToGroup.has(letter)) {
          letterToGroup.set(letter, allGroups[cursor % allGroups.length]);
          cursor++;
        }
        const g = letterToGroup.get(letter)!;
        if (!letterBag.has(letter)) {
          letterBag.set(
            letter,
            shuffle(poolForDifficulty.filter((w) => w.rhymeGroup === g)),
          );
        }
        const bag = letterBag.get(letter)!;
        if (bag.length === 0) {
          bag.push(
            ...shuffle(poolForDifficulty.filter((w) => w.rhymeGroup === g)),
          );
        }
        const pick = bag.shift();
        if (pick) out.push(pick);
      }
    }
    return out.length ? out : shuffle(poolForDifficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolForDifficulty, patternLetters, difficulty, shuffleSeed, beat.youtubeVideoId]);

  const groupSpan =
    rhymePattern === "AAAA" ? 4 : rhymePattern === "AABB" ? 2 : 1;

  const VISIBLE_ROWS = VISIBLE_BARS;
  const barOffset = inPreroll ? 0 : Math.max(0, liveBar - 1);
  const displayedIndex = wordIndex + barOffset;
  const safeQueue = queue.length ? queue : rhymeWords;
  const visibleWords: RhymeWord[] = Array.from(
    { length: VISIBLE_ROWS },
    (_, i) => safeQueue[(displayedIndex + i) % safeQueue.length],
  );

  const liveSeconds = inPreroll
    ? 0
    : Math.max(0, elapsedSeconds - PREROLL_BARS * clock.secondsPerBar);
  const progress = Math.min(100, (liveSeconds / roundSeconds) * 100);
  const timeLeft = Math.max(0, roundSeconds - Math.floor(liveSeconds));

  const isRoundOver =
    player.status === "ended" ||
    (!inPreroll && liveSeconds > 0 && timeLeft <= 0);

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

  function resetRound() {
    // Pause first so audio doesn't keep playing during seek.
    player.pause();
    // Seek back to the locked origin (where the downbeat was anchored) or
    // the beat's startSeconds — that's the clean "ready to tap on drop" state.
    const seekTarget = originRef.current ?? beat.startSeconds ?? 0;
    player.seekTo(seekTarget);
    // Reset bar/word/score state.
    originRef.current = null;
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
      {/* MOBILE: video first; desktop keeps stage left */}
      <aside className="space-y-4 xl:order-2">
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-black sm:rounded-[2rem]">
          <div className="aspect-video w-full">
            <div ref={player.containerRef} className="h-full w-full" />
          </div>
        </div>
      </aside>

      {/* LEFT: STAGE */}
      <div className="space-y-4 xl:order-1">
        {/* Rhyme ladder stage */}
        <div className="glass relative overflow-hidden rounded-2xl p-0 sm:rounded-[2rem]">
          <BeatPulseBg
            beatProgress={clock.beatProgress}
            isPlaying={player.isPlaying}
            isRoundOver={isRoundOver}
          />

          <div className="relative flex min-h-[460px] flex-col gap-4 px-3 py-5 sm:min-h-[640px] sm:px-5 sm:py-6">
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
              beatsPerBar={clock.beatsPerBar}
              isPlaying={player.isPlaying}
              barOffset={barOffset}
              inPreroll={inPreroll}
              isRoundOver={isRoundOver}
              difficulty={difficulty}
              groupSpan={groupSpan}
              getCurrentTimeNow={player.getCurrentTimeNow}
              beat={beat}
              startSeconds={originRef.current ?? beat.startSeconds ?? 0}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 sm:gap-6 sm:rounded-[1.5rem]">
          <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto sm:gap-6">
            <button
              onClick={player.toggle}
              className="primary-button !min-w-[140px] flex-1 sm:flex-none"
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
            <button onClick={resetRound} className="ghost-button">
              <RotateCcw className="size-4" /> Reset
            </button>

            {/* Sync nudge — co-equal with the action buttons */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-inner shadow-black/20">
              <span className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-orange-200/90">
                Sync
              </span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.02}
                value={syncOffset}
                onChange={(e) => setSyncOffset(Number(e.target.value))}
                className="h-2 w-44 accent-orange-400 sm:w-56"
                aria-label="Sync nudge"
              />
              <span className="w-16 text-right font-mono text-sm font-semibold text-white tabular-nums">
                {syncOffset >= 0 ? "+" : ""}
                {(syncOffset * 1000).toFixed(0)}
                <span className="ml-0.5 text-xs font-normal text-white/55">
                  ms
                </span>
              </span>
              {syncOffset !== 0 ? (
                <button
                  onClick={() => setSyncOffset(0)}
                  className="text-xs text-white/55 underline-offset-2 hover:text-white hover:underline"
                >
                  reset
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: PLAYBACK */}
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
          <p className="mt-3 text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
            {beat.bpm} BPM · {secondsPerBeat(beat.bpm).toFixed(2)}s / beat
          </p>
        </div>
      </aside>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────────────── */
/* RHYME LADDER                                                         */
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

// Neutral palette used during round-complete so the ladder doesn't keep flashing.
const NEUTRAL_PALETTE = {
  bar: "bg-white/10 text-white/70",
  ball: "bg-white/30",
  glow: "",
};

function RhymeLadder({
  rows,
  beatInBar,
  beatProgress,
  beatsPerBar,
  isPlaying,
  barOffset,
  inPreroll,
  isRoundOver,
  difficulty,
  groupSpan,
  getCurrentTimeNow,
  beat,
  startSeconds,
}: {
  rows: RhymeWord[];
  beatInBar: number;
  beatProgress: number;
  beatsPerBar: number;
  isPlaying: boolean;
  barOffset: number;
  inPreroll: boolean;
  isRoundOver: boolean;
  difficulty: RhymeWord["difficulty"];
  groupSpan: number;
  getCurrentTimeNow: () => number;
  beat: Beat;
  startSeconds: number;
}) {
  const ballRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const secPerBeat = 60 / Math.max(1, beat.bpm);
  const secPerBar = secPerBeat * beatsPerBar;
  // Freeze palette to neutral when the round is over — kills the orange/cyan flash.
  const palette0 = isRoundOver ? NEUTRAL_PALETTE : rowColor(barOffset, groupSpan);

  const gridTemplate = `repeat(${beatsPerBar}, minmax(0, 1fr))`;
  const cellPct = 100 / beatsPerBar;

  useEffect(() => {
    if (!isPlaying || isRoundOver) {
      // Hide ball entirely + freeze position when not playing or round over.
      if (ballRef.current) {
        ballRef.current.style.transform = `translate3d(0px, -100%, 0)`;
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
        const beatPosInBar = (elapsed / secPerBeat) % beatsPerBar;
        const ballPct = (cellPct / 2 + beatPosInBar * cellPct) % 100;
        const phaseInBeat = beatPosInBar - Math.floor(beatPosInBar);
        const hop = Math.sin(phaseInBeat * Math.PI);
        const hopHeight = 56;
        const ballY = -hop * hopHeight;
        const parentW = ball.parentElement?.offsetWidth ?? 0;
        const ballHalf = ball.offsetWidth / 2;
        const x = (ballPct / 100) * parentW - ballHalf;
        ball.style.transform = `translate3d(${x}px, calc(-100% + ${ballY}px), 0)`;
        stack.style.transform = `translate3d(0,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isRoundOver, getCurrentTimeNow, beat.bpm, startSeconds, secPerBar, secPerBeat, cellPct, beatsPerBar]);

  // Don't trigger cell-pop after round ends.
  const justLanded = !isRoundOver && beatProgress < 0.18;

  // Pre-roll: light up beats 1..n-1 of the current bar; the LAST cell stays
  // empty gray (per spec) so the row "looks like a normal ladder row that
  // happens to have an empty word slot at the end".
  const countdownActive = inPreroll && isPlaying;
  const activeCountIdx = countdownActive ? Math.max(0, beatInBar - 1) : -1;

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      {/* Count-in row — full-size cells matching a regular ladder row.
          Last cell stays empty gray outline (no word, no fill). */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: gridTemplate }}
        aria-hidden
      >
        {Array.from({ length: beatsPerBar }, (_, i) => {
          const isLastCell = i === beatsPerBar - 1;
          const isCurrent = !isLastCell && i === activeCountIdx;
          const isPassed =
            !isLastCell && countdownActive && i < activeCountIdx;
          // Last cell = empty outline. Others either active/passed/future.
          const cls = isLastCell
            ? "border-2 border-dashed border-white/15 bg-transparent"
            : isCurrent
              ? "border border-cyan-300/0 bg-cyan-400 shadow-[0_0_20px_6px_rgba(34,211,238,0.55)]"
              : isPassed
                ? "border border-cyan-300/0 bg-cyan-400/35"
                : "border border-white/10 bg-white/[0.04]";
          return (
            <div
              key={i}
              className={`flex h-14 items-center justify-center rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-colors duration-150 sm:h-16 ${cls}`}
            />
          );
        })}
      </div>

      {/* Stack: top row is the active bar; rows below scroll down into view.
          pt-24 leaves plenty of headroom for the bouncing ball arc. */}
      <div className="relative flex-1 overflow-hidden pt-24 sm:pt-28">
        <div
          ref={stackRef}
          className="flex flex-col gap-3"
          style={{ willChange: "transform" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={barOffset}
              className="flex flex-col gap-3"
              initial={{ y: 28, opacity: 0.55 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
                mass: 0.9,
              }}
              style={{ willChange: "transform" }}
            >
              {isRoundOver ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="font-display text-2xl font-bold text-white">
                    Round complete
                  </p>
                  <p className="text-xs text-white/55">
                    Hit Reset to play another round.
                  </p>
                </div>
              ) : (
                rows.map((w, rowIdx) => {
                  const isActiveRow = rowIdx === 0;
                  const absBar = barOffset + rowIdx;
                  const palette = rowColor(absBar, groupSpan);

                  const posInGroup = absBar % groupSpan;
                  const wordVisible =
                    difficulty === "beginner"
                      ? true
                      : posInGroup === Math.max(0, groupSpan - 1);

                  const wordCellIdx = beatsPerBar - 1;
                  return (
                    <div
                      key={`${absBar}-${w.id}`}
                      className="relative"
                      style={{
                        opacity: isActiveRow
                          ? 1
                          : Math.max(0.2, 0.55 - rowIdx * 0.07),
                        transformOrigin: "center top",
                        transition: "opacity 220ms ease-out",
                      }}
                    >
                      <div
                        className="relative z-10 grid gap-2 sm:gap-3"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        {Array.from({ length: beatsPerBar }, (_, col) => {
                          const isWordCell = col === wordCellIdx;
                          const cellLanded =
                            isActiveRow &&
                            justLanded &&
                            col === Math.min(wordCellIdx, beatInBar - 1);

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

                      {/* Ball — only on active row, hidden when paused / over */}
                      {isActiveRow ? (
                        <div
                          ref={ballRef}
                          className={`pointer-events-none absolute left-0 top-0 z-0 size-7 rounded-full sm:size-8 ${palette0.ball} ${palette0.glow}`}
                          style={{
                            willChange: "transform",
                            visibility:
                              isPlaying && !isRoundOver ? "visible" : "hidden",
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.32em] text-white/45">
        Rap the word on the right · ball bounces 1 → {beatsPerBar}
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
  isRoundOver,
}: {
  beatProgress: number;
  isPlaying: boolean;
  isRoundOver: boolean;
}) {
  // Freeze the pulse when round is over so the "Round complete" panel sits
  // on a calm, non-flashing background.
  const intensity = isPlaying && !isRoundOver ? 1 - beatProgress : 0;
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
