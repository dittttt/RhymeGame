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
  shuffle,
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

const RAP_GENRE_CHIPS: { label: string; query: string }[] = [
  { label: "Trap", query: "trap type beat 140 bpm 4/4" },
  { label: "Boom Bap", query: "boom bap type beat 90 bpm 4/4" },
  { label: "Old School", query: "old school hip hop type beat 95 bpm 4/4" },
  { label: "Dreamville", query: "dreamville type beat 85 bpm 4/4" },
  { label: "Drill", query: "drill type beat 140 bpm 4/4" },
  { label: "UK Drill", query: "uk drill type beat 140 bpm 4/4" },
  { label: "Lo-Fi Hip Hop", query: "lofi hip hop type beat 85 bpm 4/4" },
  { label: "Jazz Rap", query: "jazz rap type beat 90 bpm 4/4" },
  { label: "Conscious", query: "conscious rap type beat 88 bpm 4/4" },
  { label: "G-Funk", query: "g funk type beat 95 bpm 4/4" },
  { label: "West Coast", query: "west coast type beat 92 bpm 4/4" },
  { label: "East Coast", query: "east coast boom bap type beat 90 bpm 4/4" },
  { label: "Memphis", query: "memphis rap type beat 70 bpm 4/4" },
  { label: "Phonk", query: "phonk type beat 130 bpm 4/4" },
  { label: "Cloud Rap", query: "cloud rap type beat 75 bpm 4/4" },
  { label: "Rage", query: "rage type beat 160 bpm 4/4" },
  { label: "Hyperpop Rap", query: "hyperpop rap type beat 160 bpm 4/4" },
  { label: "Plugg", query: "plugg type beat 140 bpm 4/4" },
  { label: "Soul Sample", query: "soul sample type beat 88 bpm 4/4" },
  { label: "Afro Trap", query: "afro trap type beat 100 bpm 4/4" },
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
  const [filters, setFilters] = useState<BeatFilters>(defaultFilters);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [mode, setMode] = useState<RhymeMode>(rhymeModes[0]);
  const [difficulty, setDifficulty] =
    useState<RhymeWord["difficulty"]>("beginner");
  const [roundSeconds, setRoundSeconds] = useState(defaultRoundSeconds);
  const [numPlayers, setNumPlayers] = useState<number>(2);
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
              numPlayers={numPlayers}
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
              onNumPlayersChange={setNumPlayers}
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
  numPlayers: number;
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
  onNumPlayersChange: (n: number) => void;
  onYoutubeQueryChange: (query: string) => void;
  onSearchYouTube: (overrideQuery?: string) => void;
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
    numPlayers,
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
    onNumPlayersChange,
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
          <div className="mt-3 flex flex-wrap gap-2">
            {RAP_GENRE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={searching}
                onClick={() => onSearchYouTube(chip.query)}
                className="chip chip-button text-xs disabled:opacity-40"
                title={chip.query}
              >
                {chip.label}
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
  numPlayers,
  onExit,
}: {
  beat: Beat;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  roundSeconds: number;
  numPlayers: number;
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

  // Pool of words allowed at this difficulty.
  const poolForDifficulty = useMemo(() => {
    if (difficulty === "advanced") return rhymeWords;
    if (difficulty === "intermediate")
      return rhymeWords.filter(
        (w) => w.difficulty === "beginner" || w.difficulty === "intermediate",
      );
    return rhymeWords.filter((w) => w.difficulty === "beginner");
  }, [difficulty]);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  // Queue of WORDS, one per bar.
  // Rule: rhyme grouping advances every 2 bars (beginner/intermediate),
  // every 4 bars (advanced). Same rhyme group → same color → consecutive bars.
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

  // 4 visible bars (matches the real app). Active row = top.
  const VISIBLE_ROWS = 4;
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,_1fr)_360px]">
      {/* LEFT: STAGE */}
      <div className="space-y-4">
        {/* Rhyme ladder stage — matches the site's glass theme */}
        <div className="glass relative overflow-hidden rounded-[2rem] p-0">
          <BeatPulseBg
            beatProgress={clock.beatProgress}
            isPlaying={player.isPlaying}
          />

          <div className="relative flex min-h-[520px] flex-col gap-4 px-5 py-6 sm:min-h-[600px]">
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
              isPlaying={player.isPlaying && !inPreroll}
              barOffset={barOffset}
              countdown={countdownNumber}
              difficulty={difficulty}
              groupSpan={groupSpan}
            />
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

        <div className="glass rounded-[2rem] p-5 text-xs leading-6 text-white/55">
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
  // Ball traverses the active (top) row left → right, one cell per beat.
  // beatInBar is 1..4. Continuous position: (beatInBar - 1) + beatProgress.
  const continuousBeat = Math.max(
    0,
    Math.min(4, beatInBar - 1 + beatProgress),
  );
  // Map [0..4] across the 4 cells (centers at 12.5%, 37.5%, 62.5%, 87.5%).
  const ballLeftPct = (continuousBeat / 4) * 100;
  // Parabolic hop *between* beats: rises and falls each beat (like a bounce).
  const hopProgress = beatProgress; // 0..1 within current beat
  const hop = isPlaying ? Math.sin(hopProgress * Math.PI) : 0;
  const hopHeight = 56; // px arc height above the bar
  const ballY = -hop * hopHeight;
  // Squash on landing (start/end of each beat).
  const flatness = 1 - hop; // 1 = touching bar, 0 = peak
  const scaleX = 1 + flatness * 0.25;
  const scaleY = 1 - flatness * 0.18;

  // Pop the LANDED cell when ball touches down (start of each beat).
  const justLanded = beatProgress < 0.18;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Stack: top row is the active bar; rows below scroll down into view. */}
      <div className="relative flex-1">
        <div
          className="flex flex-col gap-3"
          style={{
            // Scroll the whole stack DOWN as bars advance, so the next row
            // slides into the active position rather than snapping.
            transform: `translateY(${beatProgress * -0}px)`,
          }}
        >
          {rows.map((w, rowIdx) => {
            const isActiveRow = rowIdx === 0;
            const absBar = barOffset + rowIdx;
            const palette = rowColor(absBar, groupSpan);

            // Word-visibility rule, driven by difficulty + position within group:
            //  Beginner    -> word visible on BOTH bars of the pair.
            //  Intermediate-> word visible only on bar 2 of the pair (bar 1 = ???).
            //  Advanced    -> word visible only on bar 4 of the quad (bars 1-3 = ???).
            const posInGroup = absBar % groupSpan; // 0..groupSpan-1
            const wordVisible =
              difficulty === "beginner"
                ? true
                : difficulty === "intermediate"
                  ? posInGroup === 1
                  : posInGroup === 3; // advanced

            return (
              <div
                key={`${absBar}-${w.id}`}
                className="relative"
                style={{
                  opacity: isActiveRow ? 1 : 0.55 - rowIdx * 0.07,
                  transformOrigin: "center top",
                  transition: "opacity 220ms ease-out",
                }}
              >
                {/* Bar with 4 cells; cell 4 = target rhyme word (or ??? when hidden) */}
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
                          className={`flex h-14 items-center justify-center rounded-xl px-2 text-center font-display text-base font-bold shadow-[0_4px_0_rgba(0,0,0,0.35)] sm:h-16 sm:text-lg ${palette.bar} ${
                            isActiveRow ? "ring-2 ring-white/70" : ""
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

                {/* Bouncing ball — ONLY on the active row, ABOVE the bar */}
                {isActiveRow && isPlaying ? (
                  <div
                    className={`pointer-events-none absolute left-0 top-0 size-7 rounded-full sm:size-8 ${palette.ball} ${palette.glow}`}
                    style={{
                      left: `calc(${ballLeftPct}% - 1rem)`,
                      transform: `translateY(calc(-100% + ${ballY}px)) scale(${scaleX}, ${scaleY})`,
                      transition:
                        "left 90ms linear, background-color 200ms ease",
                      willChange: "transform, left",
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
