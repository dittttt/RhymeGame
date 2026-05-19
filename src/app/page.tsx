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
  Shuffle,
  SkipForward,
  Sparkles,
  Users,
} from "lucide-react";
import {
  beats,
  defaultRoundSeconds,
  getGenres,
  getStyles,
  rhymeModes,
  rhymeWords,
  type Beat,
  type RhymeMode,
  type RhymeWord,
} from "@/lib/game-data";
import {
  defaultFilters,
  filterBeats,
  type BeatFilters,
} from "@/lib/beat-filtering";
import { getBeatClock, secondsPerBeat } from "@/lib/beat-clock";
import { useYouTubePlayer } from "@/lib/use-youtube-player";

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
  const [filters, setFilters] = useState<BeatFilters>(defaultFilters);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [mode, setMode] = useState<RhymeMode>(rhymeModes[0]);
  const [difficulty, setDifficulty] =
    useState<RhymeWord["difficulty"]>("beginner");
  const [roundSeconds, setRoundSeconds] = useState(defaultRoundSeconds);
  const [youtubeQuery, setYoutubeQuery] = useState(
    "boom bap freestyle type beat",
  );
  const [youtubeResults, setYoutubeResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState(
    "Curated local beats below. Add YOUTUBE_API_KEY for live YouTube search.",
  );
  const [searching, setSearching] = useState(false);

  const filteredBeats = useMemo(
    () => filterBeats(beats, filters),
    [filters],
  );
  const genres = getGenres();
  const styles = getStyles();

  function updateFilter<K extends keyof BeatFilters>(
    key: K,
    value: BeatFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function pickRandomBeat() {
    const pool = filteredBeats.length ? filteredBeats : beats;
    setSelectedBeat(pool[Math.floor(Math.random() * pool.length)]);
  }

  async function searchYouTube() {
    if (!youtubeQuery.trim()) return;
    setSearching(true);
    setSearchStatus("Searching YouTube…");
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`,
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
    const parsedBpm =
      result.bpm ?? Math.round((filters.minBpm + filters.maxBpm) / 2);
    const parsedTimeSignature =
      result.timeSignature ??
      (filters.timeSignature === "any"
        ? "4/4"
        : (filters.timeSignature as Beat["timeSignature"]));

    setSelectedBeat({
      id: result.youtubeVideoId,
      youtubeVideoId: result.youtubeVideoId,
      title: result.title,
      channel: result.channel,
      sourceUrl: result.sourceUrl,
      genre: filters.genre === "any" ? "Hip hop" : filters.genre,
      style: filters.style === "any" ? "Freestyle Type Beat" : filters.style,
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
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-5 sm:px-8 sm:py-7">
        <TopBar
          stage={stage}
          selectedBeat={selectedBeat}
          onBack={() => setStage("picker")}
        />

        <div className="mt-6 flex-1">
          {stage === "picker" ? (
            <BeatPickerScreen
              filters={filters}
              genres={genres}
              styles={styles}
              filteredBeats={filteredBeats}
              selectedBeat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              roundSeconds={roundSeconds}
              youtubeQuery={youtubeQuery}
              youtubeResults={youtubeResults}
              searchStatus={searchStatus}
              searching={searching}
              onFilterChange={updateFilter}
              onSelectBeat={setSelectedBeat}
              onRandomBeat={pickRandomBeat}
              onModeChange={setMode}
              onDifficultyChange={setDifficulty}
              onRoundSecondsChange={setRoundSeconds}
              onYoutubeQueryChange={setYoutubeQuery}
              onSearchYouTube={searchYouTube}
              onSelectYouTubeResult={selectYouTubeResult}
              onPlay={() => selectedBeat && setStage("play")}
            />
          ) : selectedBeat ? (
            <GameScreen
              beat={selectedBeat}
              mode={mode}
              difficulty={difficulty}
              roundSeconds={roundSeconds}
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
  filters: BeatFilters;
  genres: string[];
  styles: string[];
  filteredBeats: Beat[];
  selectedBeat: Beat | null;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  roundSeconds: number;
  youtubeQuery: string;
  youtubeResults: SearchResult[];
  searchStatus: string;
  searching: boolean;
  onFilterChange: <K extends keyof BeatFilters>(
    key: K,
    value: BeatFilters[K],
  ) => void;
  onSelectBeat: (beat: Beat) => void;
  onRandomBeat: () => void;
  onModeChange: (mode: RhymeMode) => void;
  onDifficultyChange: (difficulty: RhymeWord["difficulty"]) => void;
  onRoundSecondsChange: (seconds: number) => void;
  onYoutubeQueryChange: (query: string) => void;
  onSearchYouTube: () => void;
  onSelectYouTubeResult: (result: SearchResult) => void;
  onPlay: () => void;
}) {
  const {
    filters,
    genres,
    styles,
    filteredBeats,
    selectedBeat,
    mode,
    difficulty,
    roundSeconds,
    youtubeQuery,
    youtubeResults,
    searchStatus,
    searching,
    onFilterChange,
    onSelectBeat,
    onRandomBeat,
    onModeChange,
    onDifficultyChange,
    onRoundSecondsChange,
    onYoutubeQueryChange,
    onSearchYouTube,
    onSelectYouTubeResult,
    onPlay,
  } = props;

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
            Search YouTube for any instrumental, or grab one from the curated
            shortlist. Filters keep your BPM and vibe locked in.
          </p>
        </header>

        {/* YouTube search — now the star */}
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
              className="input flex-1 text-base"
              value={youtubeQuery}
              onChange={(e) => onYoutubeQueryChange(e.target.value)}
              placeholder="boom bap freestyle 90 bpm…"
            />
            <button
              type="submit"
              disabled={searching}
              className="primary-button sm:min-w-[140px]"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
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
                        : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]"
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

        {/* Curated beats grid */}
        <div className="glass rounded-[2rem] p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">
                Curated shortlist
              </p>
              <p className="text-xs text-white/50">
                {filteredBeats.length} of {beats.length} match your filters
              </p>
            </div>
            <button onClick={onRandomBeat} className="secondary-button">
              <Shuffle className="size-4" /> Random
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {filteredBeats.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/50">
                No curated beats match those filters. Loosen them or use the
                YouTube search above.
              </p>
            ) : (
              filteredBeats.map((beat) => {
                const active = selectedBeat?.id === beat.id;
                return (
                  <button
                    key={beat.id}
                    onClick={() => onSelectBeat(beat)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-orange-300/70 bg-orange-300/10 shadow-lg shadow-orange-950/30"
                        : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{beat.title}</p>
                      <span className="chip chip-accent shrink-0 font-mono">
                        {beat.bpm}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {beat.style} · {beat.mood}
                    </p>
                    <p className="mt-2 text-[0.65rem] uppercase tracking-widest text-white/40">
                      {beat.timeSignature} · {beat.genre}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: FILTERS + GAME CONFIG */}
      <aside className="space-y-6">
        <div className="glass rounded-[2rem] p-6 sm:p-7">
          <p className="font-display text-lg font-semibold">Filters</p>
          <p className="text-xs text-white/50">Narrow the curated list</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Min BPM">
              <input
                className="input font-mono"
                type="number"
                value={filters.minBpm}
                onChange={(e) =>
                  onFilterChange("minBpm", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Max BPM">
              <input
                className="input font-mono"
                type="number"
                value={filters.maxBpm}
                onChange={(e) =>
                  onFilterChange("maxBpm", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Time signature">
              <select
                className="input"
                value={filters.timeSignature}
                onChange={(e) =>
                  onFilterChange("timeSignature", e.target.value)
                }
              >
                {["any", "4/4", "3/4", "6/8", "2/4", "5/4", "7/4"].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
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
            <Field label="Genre">
              <select
                className="input"
                value={filters.genre}
                onChange={(e) => onFilterChange("genre", e.target.value)}
              >
                <option value="any">any</option>
                {genres.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Style">
              <select
                className="input"
                value={filters.style}
                onChange={(e) => onFilterChange("style", e.target.value)}
              >
                <option value="any">any</option>
                {styles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6 sm:p-7">
          <p className="font-display text-lg font-semibold">Game mode</p>
          <p className="text-xs text-white/50">How rhyme targets cycle</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
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
            <Field label="Pattern">
              <select
                className="input"
                value={mode.id}
                onChange={(e) =>
                  onModeChange(
                    rhymeModes.find((item) => item.id === e.target.value) ??
                      mode,
                  )
                }
              >
                {rhymeModes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/50">
            {mode.description}
          </p>
        </div>

        {/* Selected beat summary + play */}
        <div
          className={`rounded-[2rem] p-6 sm:p-7 transition-all ${
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
              <p className="mt-2 line-clamp-2 font-display text-xl font-bold leading-snug">
                {selectedBeat.title}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-black/80">
                {selectedBeat.bpm} BPM · {selectedBeat.timeSignature} ·{" "}
                {selectedBeat.style}
              </p>
              <button
                onClick={onPlay}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 font-display text-base font-bold text-white shadow-lg shadow-black/40 transition-all hover:bg-zinc-900"
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
                Search YouTube or tap one of the curated beats on the left.
                Then you'll get the full game stage.
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
  mode,
  difficulty,
  roundSeconds,
  onExit,
}: {
  beat: Beat;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  roundSeconds: number;
  onExit: () => void;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0); // seconds

  const player = useYouTubePlayer({
    videoId: beat.youtubeVideoId,
    startSeconds: beat.startSeconds ?? 0,
    offsetSeconds: syncOffset,
  });

  // Elapsed = audio time - origin (where we started counting bars)
  const originRef = useRef<number | null>(null);
  useEffect(() => {
    // First time the player starts playing, lock the origin to that moment.
    if (player.isPlaying && originRef.current === null) {
      originRef.current = player.currentTime;
    }
  }, [player.isPlaying, player.currentTime]);

  // Reset origin when the beat changes
  useEffect(() => {
    originRef.current = null;
    setWordIndex(0);
  }, [beat.youtubeVideoId]);

  const elapsedSeconds = Math.max(
    0,
    player.currentTime - (originRef.current ?? player.currentTime),
  );
  const clock = getBeatClock(
    { ...beat, startSeconds: 0 },
    elapsedSeconds,
  );

  const playableWords = useMemo(
    () =>
      rhymeWords.filter(
        (word) => word.difficulty === difficulty || difficulty === "advanced",
      ),
    [difficulty],
  );

  const autoAdvanced = player.isPlaying
    ? Math.floor(
        Math.max(0, clock.currentBar - 1) / Math.max(1, mode.changeEveryBars),
      )
    : 0;
  const displayedIndex = wordIndex + autoAdvanced;
  const currentWord =
    playableWords[displayedIndex % Math.max(1, playableWords.length)] ??
    rhymeWords[0];
  const nextWord =
    playableWords[(displayedIndex + 1) % Math.max(1, playableWords.length)] ??
    rhymeWords[0];

  // Round timer (purely visual, driven by elapsed audio seconds)
  const progress = Math.min(100, (elapsedSeconds / roundSeconds) * 100);
  const timeLeft = Math.max(0, roundSeconds - Math.floor(elapsedSeconds));

  function nextManual() {
    setWordIndex((c) => c + 1);
  }
  function resetRound() {
    originRef.current = player.currentTime;
    setWordIndex(0);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,_1fr)_360px]">
      {/* LEFT: STAGE */}
      <div className="space-y-4">
        {/* Word ball / stage — TALL */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-[#1a0a2e] via-[#100620] to-[#0a0612]">
          <BeatPulseBg
            beatProgress={clock.beatProgress}
            isPlaying={player.isPlaying}
          />

          <div className="relative flex min-h-[460px] flex-col items-center justify-center gap-8 px-6 py-10 sm:min-h-[540px]">
            {/* Status line */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
              {player.status === "loading" ? (
                <span className="chip">Loading…</span>
              ) : null}
              {player.status === "ready" && !player.isPlaying ? (
                <span className="chip">Press play below to start</span>
              ) : null}
              {player.isPlaying ? (
                <span className="chip chip-accent">
                  <span className="size-1.5 animate-pulse rounded-full bg-orange-300" />
                  Live · synced to audio
                </span>
              ) : null}
              <span className="chip font-mono">
                Bar {clock.currentBar} · {clock.beatInBar}/{clock.beatsPerBar}
              </span>
            </div>

            {/* THE WORD BALL */}
            <WordBall
              word={currentWord}
              beatProgress={clock.beatProgress}
              isPlaying={player.isPlaying}
            />

            {/* Beat dots */}
            <BeatDots
              beatInBar={clock.beatInBar}
              beatsPerBar={clock.beatsPerBar}
              beatProgress={clock.beatProgress}
            />

            {/* Next word preview */}
            <div className="text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-white/40">
                Up next
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-white/70">
                {nextWord.word}
              </p>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={player.toggle}
              className="primary-button !min-w-[120px]"
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
            <button onClick={nextManual} className="secondary-button">
              <SkipForward className="size-4" /> Skip word
            </button>
            <button onClick={resetRound} className="ghost-button">
              <RotateCcw className="size-4" /> Reset round
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/55">
            <span className="font-mono text-base font-semibold text-white">
              {fmtTime(timeLeft)}
            </span>
            <div className="hidden h-1.5 w-48 overflow-hidden rounded-full bg-white/10 sm:block">
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
        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-black">
          <div className="aspect-video w-full">
            <div ref={player.containerRef} className="h-full w-full" />
          </div>
        </div>

        <div className="glass rounded-[2rem] p-5">
          <p className="font-display text-sm font-semibold">Sync nudge</p>
          <p className="text-xs text-white/50">
            If the bouncing word feels early or late, slide to align with the
            kick. Saved per session.
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

        <div className="glass rounded-[2rem] p-5 text-xs leading-6 text-white/55">
          <p className="font-display text-sm font-semibold text-white">
            How sync works
          </p>
          <p className="mt-2">
            The bouncing word is driven by the YouTube player's current time —
            pausing the video pauses the game, and seeking moves the beat clock
            with you. At {beat.bpm} BPM that's{" "}
            <span className="font-mono">
              {secondsPerBeat(beat.bpm).toFixed(2)}s
            </span>{" "}
            per beat.
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
/* WORD BALL                                                            */
/* ──────────────────────────────────────────────────────────────────── */

function WordBall({
  word,
  beatProgress,
  isPlaying,
}: {
  word: RhymeWord;
  beatProgress: number;
  isPlaying: boolean;
}) {
  // 0..1 within the beat. Use an ease so it lands hard on the downbeat.
  const t = isPlaying ? beatProgress : 0;
  // Bounce: peak at 0.0 (just landed), trough at 0.5
  const bounce = isPlaying ? Math.sin(t * Math.PI) * 28 : 0;
  // Scale pulse: smaller right after the hit, swells before next
  const scale = isPlaying ? 1 + Math.sin((1 - t) * Math.PI) * 0.06 : 1;

  return (
    <div className="relative">
      {/* Pulse rings on every beat */}
      {isPlaying ? (
        <div
          key={Math.floor(t * 1e6)} // forces re-mount each beat for restart
          className="pulse-ring pointer-events-none absolute left-1/2 top-1/2 size-[280px] rounded-full border-2 border-orange-300/40 sm:size-[340px]"
        />
      ) : null}

      <div
        className="relative grid size-[280px] place-items-center rounded-full bg-gradient-to-br from-orange-300 via-rose-400 to-fuchsia-500 shadow-[0_30px_80px_-20px_rgba(217,70,239,0.55)] transition-transform duration-100 ease-out sm:size-[340px]"
        style={{
          transform: `translateY(-${bounce}px) scale(${scale})`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        <div
          key={word.id}
          className="word-pop relative flex flex-col items-center px-6 text-center text-black"
        >
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.32em] text-black/65">
            Rhyme with
          </p>
          <p className="font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            {word.word}
          </p>
          <p className="mt-2 font-mono text-xs font-semibold text-black/55">
            {word.syllables} syl · {word.rhymeGroup}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* BEAT DOTS                                                            */
/* ──────────────────────────────────────────────────────────────────── */

function BeatDots({
  beatInBar,
  beatsPerBar,
  beatProgress,
}: {
  beatInBar: number;
  beatsPerBar: number;
  beatProgress: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const active = i + 1 === beatInBar;
        const scale = active ? 1 + (1 - beatProgress) * 0.5 : 1;
        return (
          <div
            key={i}
            className={`size-3 rounded-full transition-colors duration-150 ${
              active ? "bg-orange-300" : "bg-white/15"
            }`}
            style={{
              transform: `scale(${scale})`,
              boxShadow: active
                ? `0 0 ${12 * (1 - beatProgress)}px rgba(253, 186, 116, 0.9)`
                : undefined,
            }}
          />
        );
      })}
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
