"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Gauge,
  Music2,
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
import { defaultFilters, filterBeats, type BeatFilters } from "@/lib/beat-filtering";
import { getBeatClock, secondsPerBeat } from "@/lib/beat-clock";
import { buildYouTubeEmbedUrl } from "@/lib/youtube";

type GameState = "setup" | "playing" | "paused";

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
  const [filters, setFilters] = useState<BeatFilters>(defaultFilters);
  const [selectedBeat, setSelectedBeat] = useState<Beat>(beats[0]);
  const [mode, setMode] = useState<RhymeMode>(rhymeModes[0]);
  const [difficulty, setDifficulty] = useState<RhymeWord["difficulty"]>("beginner");
  const [roundSeconds, setRoundSeconds] = useState(defaultRoundSeconds);
  const [gameState, setGameState] = useState<GameState>("setup");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [youtubeQuery, setYoutubeQuery] = useState("boom bap freestyle type beat");
  const [youtubeResults, setYoutubeResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState(
    "Curated local beats loaded. Add YOUTUBE_API_KEY for live YouTube search.",
  );

  const filteredBeats = useMemo(() => filterBeats(beats, filters), [filters]);
  const playableWords = useMemo(
    () =>
      rhymeWords.filter(
        (word) => word.difficulty === difficulty || difficulty === "advanced",
      ),
    [difficulty],
  );
  const clock = getBeatClock(selectedBeat, elapsedSeconds);
  const autoAdvancedWordIndex =
    gameState === "playing"
      ? Math.floor(Math.max(0, clock.currentBar - 1) / Math.max(1, mode.changeEveryBars))
      : 0;
  const displayedWordIndex = wordIndex + autoAdvancedWordIndex;
  const currentWord = playableWords[displayedWordIndex % Math.max(1, playableWords.length)] ?? rhymeWords[0];
  const nextWords = Array.from(
    { length: 4 },
    (_, index) => playableWords[(displayedWordIndex + index + 1) % Math.max(1, playableWords.length)],
  ).filter(Boolean);
  const embedUrl = buildYouTubeEmbedUrl(selectedBeat);
  const genres = getGenres();
  const styles = getStyles();

  useEffect(() => {
    if (gameState !== "playing" || startedAt === null) return;

    const interval = window.setInterval(() => {
      const nextElapsed = (Date.now() - startedAt) / 1000;
      if (nextElapsed >= roundSeconds) {
        setElapsedSeconds(roundSeconds);
        setGameState("paused");
        window.clearInterval(interval);
        return;
      }
      setElapsedSeconds(nextElapsed);
    }, 80);

    return () => window.clearInterval(interval);
  }, [gameState, roundSeconds, startedAt]);

  function updateFilter<K extends keyof BeatFilters>(key: K, value: BeatFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function pickRandomBeat() {
    const pool = filteredBeats.length ? filteredBeats : beats;
    setSelectedBeat(pool[Math.floor(Math.random() * pool.length)]);
  }

  function startSession() {
    const now = Date.now();
    setGameState("playing");
    setStartedAt(now);
    setElapsedSeconds(0);
    setWordIndex(0);
  }

  function resetSession() {
    setGameState("setup");
    setStartedAt(null);
    setElapsedSeconds(0);
    setWordIndex(0);
  }

  function nextWord() {
    setWordIndex((current) => current + 1);
  }

  async function searchYouTube() {
    setSearchStatus("Searching YouTube...");
    const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
    const data = (await response.json()) as { error?: string; note?: string; items?: SearchResult[] };
    setYoutubeResults(data.items ?? []);
    setSearchStatus(
      data.error ??
        `${data.note ? `${data.note} ` : ""}Found ${data.items?.length ?? 0} type beats with parseable BPM metadata.`,
    );
  }

  function selectYouTubeResult(result: SearchResult) {
    const parsedBpm = result.bpm ?? Math.round((filters.minBpm + filters.maxBpm) / 2);
    const parsedTimeSignature = result.timeSignature ??
      (filters.timeSignature === "any" ? "4/4" : (filters.timeSignature as Beat["timeSignature"]));

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
      startSeconds: 30,
      durationSeconds: roundSeconds,
      metadataSource: result.metadataSource ?? "youtube_description",
      metadataConfidence: result.metadataConfidence ?? (result.bpm ? "parsed" : "assumed"),
      metadataNotes: result.metadataNotes,
    });
  }

  return (
    <main className="min-h-screen bg-[#11061f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,184,77,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.35),_transparent_34%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-5 sm:px-8 sm:py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-orange-400 text-black shadow-lg shadow-orange-400/25">
              <Music2 className="size-7" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">RhymeGame</p>
              <p className="text-xs uppercase tracking-[0.35em] text-orange-200/70">
                freestyle tool for friends
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
            <Users className="size-4" /> No typing. Freestyle out loud.
          </div>
        </nav>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[380px_1fr]">
          <SetupPanel
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
            onFilterChange={updateFilter}
            onSelectBeat={setSelectedBeat}
            onRandomBeat={pickRandomBeat}
            onModeChange={setMode}
            onDifficultyChange={setDifficulty}
            onRoundSecondsChange={setRoundSeconds}
            onYoutubeQueryChange={setYoutubeQuery}
            onSearchYouTube={searchYouTube}
            onSelectYouTubeResult={selectYouTubeResult}
            onStart={startSession}
          />

          <GameStage
            gameState={gameState}
            beat={selectedBeat}
            mode={mode}
            currentWord={currentWord}
            nextWords={nextWords}
            elapsedSeconds={elapsedSeconds}
            roundSeconds={roundSeconds}
            clock={clock}
            embedUrl={embedUrl}
            onNextWord={nextWord}
            onStart={startSession}
            onReset={resetSession}
          />
        </div>
      </section>
    </main>
  );
}

function SetupPanel({
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
  onFilterChange,
  onSelectBeat,
  onRandomBeat,
  onModeChange,
  onDifficultyChange,
  onRoundSecondsChange,
  onYoutubeQueryChange,
  onSearchYouTube,
  onSelectYouTubeResult,
  onStart,
}: {
  filters: BeatFilters;
  genres: string[];
  styles: string[];
  filteredBeats: Beat[];
  selectedBeat: Beat;
  mode: RhymeMode;
  difficulty: RhymeWord["difficulty"];
  roundSeconds: number;
  youtubeQuery: string;
  youtubeResults: SearchResult[];
  searchStatus: string;
  onFilterChange: <K extends keyof BeatFilters>(key: K, value: BeatFilters[K]) => void;
  onSelectBeat: (beat: Beat) => void;
  onRandomBeat: () => void;
  onModeChange: (mode: RhymeMode) => void;
  onDifficultyChange: (difficulty: RhymeWord["difficulty"]) => void;
  onRoundSecondsChange: (seconds: number) => void;
  onYoutubeQueryChange: (query: string) => void;
  onSearchYouTube: () => void;
  onSelectYouTubeResult: (result: SearchResult) => void;
  onStart: () => void;
}) {
  return (
    <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5">
      <div>
        <h1 className="text-3xl font-black leading-none">Setup the cypher</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Pick a beat, BPM, time signature, mode, and difficulty. Then rhyme out loud with friends while the word target changes on beat.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Min BPM">
          <input className="input" type="number" value={filters.minBpm} onChange={(event) => onFilterChange("minBpm", Number(event.target.value))} />
        </Field>
        <Field label="Max BPM">
          <input className="input" type="number" value={filters.maxBpm} onChange={(event) => onFilterChange("maxBpm", Number(event.target.value))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Time signature">
          <select className="input" value={filters.timeSignature} onChange={(event) => onFilterChange("timeSignature", event.target.value)}>
            {["any", "4/4", "3/4", "6/8", "2/4", "5/4", "7/4"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Duration">
          <select className="input" value={roundSeconds} onChange={(event) => onRoundSecondsChange(Number(event.target.value))}>
            {[60, 90, 120, 180].map((item) => <option key={item} value={item}>{item}s</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Genre">
          <select className="input" value={filters.genre} onChange={(event) => onFilterChange("genre", event.target.value)}>
            <option value="any">any</option>
            {genres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Style">
          <select className="input" value={filters.style} onChange={(event) => onFilterChange("style", event.target.value)}>
            <option value="any">any</option>
            {styles.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Curated beat dropdown">
        <select className="input" value={selectedBeat.id} onChange={(event) => onSelectBeat(beats.find((beat) => beat.id === event.target.value) ?? selectedBeat)}>
          {filteredBeats.map((beat) => (
            <option key={beat.id} value={beat.id}>{beat.bpm} BPM · {beat.timeSignature} · {beat.style} · {beat.title}</option>
          ))}
        </select>
      </Field>

      <button onClick={onRandomBeat} className="secondary-button"><Shuffle className="size-4" /> Random matching beat</button>

      <div className="rounded-3xl bg-black/30 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-200"><Search className="size-4" /> YouTube beat search</p>
        <div className="flex gap-2">
          <input className="input" value={youtubeQuery} onChange={(event) => onYoutubeQueryChange(event.target.value)} placeholder="boom bap freestyle type beat" />
          <button onClick={onSearchYouTube} className="rounded-2xl bg-orange-400 px-4 font-black text-black">Go</button>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">{searchStatus}</p>
        <div className="mt-3 max-h-36 space-y-2 overflow-auto">
          {youtubeResults.map((result) => (
            <button key={result.youtubeVideoId} onClick={() => onSelectYouTubeResult(result)} className="w-full rounded-2xl bg-white/10 p-3 text-left text-sm hover:bg-white/15">
              <span className="block font-bold">{result.title}</span>
              <span className="text-xs text-slate-400">
                {result.channel} · {result.metadataNotes ?? "BPM parsed from description"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Difficulty">
          <select className="input" value={difficulty} onChange={(event) => onDifficultyChange(event.target.value as RhymeWord["difficulty"])}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>
        <Field label="Rhyme mode">
          <select className="input" value={mode.id} onChange={(event) => onModeChange(rhymeModes.find((item) => item.id === event.target.value) ?? mode)}>
            {rhymeModes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="rounded-3xl bg-black/30 p-4 text-sm leading-6 text-slate-300">
        <p className="font-bold text-white">Selected Beat</p>
        <p>{selectedBeat.title}</p>
        <p className="text-orange-200">{selectedBeat.bpm} BPM · {selectedBeat.timeSignature} · {selectedBeat.style}</p>
        <p className="text-xs text-slate-500">
          Metadata source: {selectedBeat.metadataSource.replaceAll("_", " ")}
          {selectedBeat.metadataConfidence ? ` · ${selectedBeat.metadataConfidence}` : ""}
          {selectedBeat.metadataNotes ? ` · ${selectedBeat.metadataNotes}` : ""}
        </p>
      </div>

      <button onClick={onStart} className="primary-button"><Play className="size-5" /> PLAY</button>
    </aside>
  );
}

function GameStage({ gameState, beat, mode, currentWord, nextWords, elapsedSeconds, roundSeconds, clock, embedUrl, onNextWord, onStart, onReset }: {
  gameState: GameState;
  beat: Beat;
  mode: RhymeMode;
  currentWord: RhymeWord;
  nextWords: RhymeWord[];
  elapsedSeconds: number;
  roundSeconds: number;
  clock: ReturnType<typeof getBeatClock>;
  embedUrl: string;
  onNextWord: () => void;
  onStart: () => void;
  onReset: () => void;
}) {
  const progress = Math.min(100, (elapsedSeconds / roundSeconds) * 100);

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
          <iframe className="aspect-video w-full" src={gameState === "setup" ? "" : embedUrl} title={beat.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        </div>

        <BeatRoad
          beatInBar={clock.beatInBar}
          beatsPerBar={clock.beatsPerBar}
          beatProgress={clock.beatProgress}
          nextWords={nextWords}
        />

        <div className="rounded-[2rem] bg-black/35 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
            <span>{Math.ceil(Math.max(0, roundSeconds - elapsedSeconds))}s left</span>
            <span>Bar {clock.currentBar} · Beat {clock.beatInBar}/{clock.beatsPerBar}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-400" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Sync note: the visual clock is anchored to the YouTube start offset ({beat.startSeconds}s), then advances at {beat.bpm} BPM ({secondsPerBeat(beat.bpm).toFixed(2)}s per beat). If a YouTube upload has silence before the first downbeat, adjust the beat start offset.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {gameState === "setup" ? <button onClick={onStart} className="primary-button w-full sm:w-auto"><Play className="size-5" /> Start cypher</button> : null}
          <button onClick={onNextWord} className="secondary-button w-full sm:w-auto"><SkipForward className="size-4" /> Next word</button>
          <button onClick={onReset} className="secondary-button w-full sm:w-auto"><RotateCcw className="size-4" /> Reset</button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-orange-400 to-fuchsia-500 p-6 text-black shadow-xl shadow-fuchsia-950/40">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em]"><Sparkles className="size-4" /> Rhyme target</p>
          <p className="mt-3 text-6xl font-black leading-none">{currentWord.word}</p>
          <p className="mt-3 text-sm font-bold">{currentWord.syllables} syl · group {currentWord.rhymeGroup}</p>
        </div>

        <div className="rounded-[2rem] bg-black/35 p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">Upcoming words</p>
          <div className="grid grid-cols-2 gap-2">
            {nextWords.map((word) => <div key={word.id} className="rounded-2xl bg-white/10 p-3 text-center font-bold">{word.word}</div>)}
          </div>
        </div>

        <div className="rounded-[2rem] bg-black/35 p-5 text-sm leading-7 text-slate-300">
          <p className="mb-2 flex items-center gap-2 font-bold text-white"><Gauge className="size-4" /> Beat info</p>
          <p>{beat.bpm} BPM · {beat.timeSignature}</p>
          <p>{beat.genre} · {beat.style}</p>
          <p className="text-slate-500">Mode: {mode.label} — changes every {mode.changeEveryBars} bar(s).</p>
        </div>

        <div className="rounded-[2rem] bg-black/35 p-5 text-sm leading-7 text-slate-300">
          <p className="mb-2 font-bold text-white">Rhyme dictionary quick view</p>
          <p>Perfect-ish rhymes for <b>{currentWord.word}</b>: {rhymeWords.filter((word) => word.rhymeGroup === currentWord.rhymeGroup && word.id !== currentWord.id).map((word) => word.word).join(", ") || "add more words soon"}</p>
        </div>
      </div>
    </section>
  );
}

function BeatRoad({ beatInBar, beatsPerBar, beatProgress, nextWords }: {
  beatInBar: number;
  beatsPerBar: number;
  beatProgress: number;
  nextWords: RhymeWord[];
}) {
  const clampedBeat = Math.min(Math.max(beatInBar, 1), beatsPerBar);
  const lanePercent = beatsPerBar <= 1 ? 50 : ((clampedBeat - 1) / (beatsPerBar - 1)) * 100;
  const bounceY = Math.sin(beatProgress * Math.PI) * 46;

  return (
    <div className="rounded-[2rem] bg-black/35 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
        <span>Ball lands on each beat</span>
        <span>{beatsPerBar}/bar · words arrive on beat {beatsPerBar}</span>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-purple-950/80 to-black/50 px-3 py-6 sm:px-6">
        <div className="pointer-events-none absolute left-8 right-8 top-[5.85rem] h-1 rounded-full bg-white/10 sm:left-12 sm:right-12" />
        <div
          className="absolute top-[5.35rem] z-20 size-7 rounded-full bg-orange-300 shadow-[0_0_35px_rgba(251,146,60,0.9)] transition-[left,transform] duration-75 ease-linear sm:size-8"
          style={{
            left: `calc(2rem + (${lanePercent}% * (100% - 4rem) / 100))`,
            transform: `translate(-50%, -${bounceY}px)`,
          }}
        />
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${beatsPerBar}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: beatsPerBar }, (_, index) => {
            const isActive = beatInBar === index + 1;
            const queuedWord = index === beatsPerBar - 1 ? nextWords[0] : null;

            return (
              <div key={index} className="flex min-w-0 flex-col items-center gap-3 pt-8">
                <div className={`grid size-14 place-items-center rounded-2xl border text-lg font-black transition-colors sm:size-16 ${isActive ? "border-orange-300 bg-orange-300 text-black" : "border-white/10 bg-white/5 text-white/60"}`}>
                  {index + 1}
                </div>
                {queuedWord ? (
                  <div className="w-full rounded-2xl border border-orange-300/30 bg-orange-300/15 px-2 py-2 text-center shadow-lg shadow-orange-950/30">
                    <p className="text-[0.6rem] font-black uppercase tracking-widest text-orange-200">next word</p>
                    <p className="truncate text-sm font-black text-white sm:text-base">{queuedWord.word}</p>
                  </div>
                ) : (
                  <div className="h-[3.65rem] w-full rounded-2xl border border-white/5 bg-white/[0.03]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}
