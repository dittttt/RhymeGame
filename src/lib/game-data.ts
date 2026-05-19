export type TimeSignature = "4/4" | "3/4" | "6/8" | "2/4" | "5/4" | "7/4";

export type BeatMetadataSource =
  | "manual"
  | "youtube_description"
  | "metadata_api"
  | "community"
  | "analysis"
  | "unknown";

export type Beat = {
  id: string;
  youtubeVideoId: string;
  title: string;
  channel: string;
  sourceUrl: string;
  genre: string;
  style: string;
  mood: string;
  bpm: number;
  timeSignature: TimeSignature;
  startSeconds: number;
  durationSeconds: number;
  metadataSource: BeatMetadataSource;
  metadataConfidence?: "verified" | "parsed" | "assumed" | "unknown";
  metadataNotes?: string;
};

export type RhymeWord = {
  id: string;
  word: string;
  rhymeGroup: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  syllables: number;
};

export type RhymeMode = {
  id: "free" | "aaaa" | "abab" | "toolkit";
  label: string;
  description: string;
  changeEveryBars: number;
};

export const defaultRoundSeconds = 90;

export const rhymeModes: RhymeMode[] = [
  {
    id: "free",
    label: "Free Mode",
    description: "One target at a time. Use it however you want with friends.",
    changeEveryBars: 2,
  },
  {
    id: "aaaa",
    label: "AAAA Pattern",
    description: "Keep the same rhyme family for four target changes.",
    changeEveryBars: 1,
  },
  {
    id: "abab",
    label: "ABAB Pattern",
    description: "Alternate between two rhyme families every bar.",
    changeEveryBars: 1,
  },
  {
    id: "toolkit",
    label: "Rapper's Toolkit",
    description: "Random word prompts for flexible freestyle practice.",
    changeEveryBars: 2,
  },
];

export const rhymeWords: RhymeWord[] = [
  { id: "time", word: "time", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "prime", word: "prime", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "shine", word: "shine", rhymeGroup: "ine", difficulty: "beginner", syllables: 1 },
  { id: "grind", word: "grind", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "mind", word: "mind", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "find", word: "find", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "higher", word: "higher", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "inspire", word: "inspire", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "pressure", word: "pressure", rhymeGroup: "eshur", difficulty: "intermediate", syllables: 2 },
  { id: "measure", word: "measure", rhymeGroup: "eshur", difficulty: "intermediate", syllables: 2 },
  { id: "legacy", word: "legacy", rhymeGroup: "egacy", difficulty: "advanced", syllables: 3 },
  { id: "destiny", word: "destiny", rhymeGroup: "estiny", difficulty: "advanced", syllables: 3 },
];

export const beats: Beat[] = [
  {
    id: "boom-bap-65",
    youtubeVideoId: "jfKfPfyJRdk",
    title: "Boom Bap Freestyle Pocket",
    channel: "YouTube curated",
    sourceUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    genre: "Hip hop",
    style: "Boom Bap",
    mood: "Hood / classic",
    bpm: 65,
    timeSignature: "4/4",
    startSeconds: 30,
    durationSeconds: defaultRoundSeconds,
    metadataSource: "manual",
    metadataConfidence: "verified",
  },
  {
    id: "lofi-82",
    youtubeVideoId: "5qap5aO4i9A",
    title: "Lo-fi Chill Freestyle Loop",
    channel: "YouTube curated",
    sourceUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    genre: "Hip hop",
    style: "Lo-fi",
    mood: "Chill / warm",
    bpm: 82,
    timeSignature: "4/4",
    startSeconds: 45,
    durationSeconds: defaultRoundSeconds,
    metadataSource: "manual",
    metadataConfidence: "verified",
  },
  {
    id: "trap-140",
    youtubeVideoId: "DWcJFNfaw9c",
    title: "Dark Trap Type Beat",
    channel: "YouTube curated",
    sourceUrl: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
    genre: "Trap",
    style: "Dark Trap",
    mood: "Dark / aggressive",
    bpm: 140,
    timeSignature: "4/4",
    startSeconds: 25,
    durationSeconds: defaultRoundSeconds,
    metadataSource: "manual",
    metadataConfidence: "verified",
  },
  {
    id: "rnb-72",
    youtubeVideoId: "kJQP7kiw5Fk",
    title: "Smooth R&B Practice Placeholder",
    channel: "YouTube curated",
    sourceUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    genre: "R&B",
    style: "Smooth",
    mood: "Melodic / bounce",
    bpm: 72,
    timeSignature: "4/4",
    startSeconds: 40,
    durationSeconds: defaultRoundSeconds,
    metadataSource: "manual",
    metadataConfidence: "verified",
  },
];

export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function getGenres(allBeats = beats): string[] {
  return Array.from(new Set(allBeats.map((beat) => beat.genre))).sort();
}

export function getStyles(allBeats = beats): string[] {
  return Array.from(new Set(allBeats.map((beat) => beat.style))).sort();
}
