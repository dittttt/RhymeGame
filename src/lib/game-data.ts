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

// Big rotating pool so every session feels different. Grouped loosely by
// rhyme family so AAAA / ABAB modes still produce something usable.
export const rhymeWords: RhymeWord[] = [
  // ── beginner: 1 syllable, common endings ─────────────────────────────
  { id: "time", word: "time", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "prime", word: "prime", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "crime", word: "crime", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "dime", word: "dime", rhymeGroup: "ime", difficulty: "beginner", syllables: 1 },
  { id: "shine", word: "shine", rhymeGroup: "ine", difficulty: "beginner", syllables: 1 },
  { id: "line", word: "line", rhymeGroup: "ine", difficulty: "beginner", syllables: 1 },
  { id: "nine", word: "nine", rhymeGroup: "ine", difficulty: "beginner", syllables: 1 },
  { id: "vine", word: "vine", rhymeGroup: "ine", difficulty: "beginner", syllables: 1 },
  { id: "grind", word: "grind", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "mind", word: "mind", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "find", word: "find", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "blind", word: "blind", rhymeGroup: "ind", difficulty: "beginner", syllables: 1 },
  { id: "back", word: "back", rhymeGroup: "ack", difficulty: "beginner", syllables: 1 },
  { id: "track", word: "track", rhymeGroup: "ack", difficulty: "beginner", syllables: 1 },
  { id: "stack", word: "stack", rhymeGroup: "ack", difficulty: "beginner", syllables: 1 },
  { id: "pack", word: "pack", rhymeGroup: "ack", difficulty: "beginner", syllables: 1 },
  { id: "snack", word: "snack", rhymeGroup: "ack", difficulty: "beginner", syllables: 1 },
  { id: "smoke", word: "smoke", rhymeGroup: "oke", difficulty: "beginner", syllables: 1 },
  { id: "broke", word: "broke", rhymeGroup: "oke", difficulty: "beginner", syllables: 1 },
  { id: "joke", word: "joke", rhymeGroup: "oke", difficulty: "beginner", syllables: 1 },
  { id: "rock", word: "rock", rhymeGroup: "ock", difficulty: "beginner", syllables: 1 },
  { id: "block", word: "block", rhymeGroup: "ock", difficulty: "beginner", syllables: 1 },
  { id: "clock", word: "clock", rhymeGroup: "ock", difficulty: "beginner", syllables: 1 },
  { id: "lock", word: "lock", rhymeGroup: "ock", difficulty: "beginner", syllables: 1 },
  { id: "talk", word: "talk", rhymeGroup: "alk", difficulty: "beginner", syllables: 1 },
  { id: "walk", word: "walk", rhymeGroup: "alk", difficulty: "beginner", syllables: 1 },
  { id: "stalk", word: "stalk", rhymeGroup: "alk", difficulty: "beginner", syllables: 1 },
  { id: "cash", word: "cash", rhymeGroup: "ash", difficulty: "beginner", syllables: 1 },
  { id: "flash", word: "flash", rhymeGroup: "ash", difficulty: "beginner", syllables: 1 },
  { id: "trash", word: "trash", rhymeGroup: "ash", difficulty: "beginner", syllables: 1 },
  { id: "crash", word: "crash", rhymeGroup: "ash", difficulty: "beginner", syllables: 1 },
  { id: "fight", word: "fight", rhymeGroup: "ight", difficulty: "beginner", syllables: 1 },
  { id: "night", word: "night", rhymeGroup: "ight", difficulty: "beginner", syllables: 1 },
  { id: "light", word: "light", rhymeGroup: "ight", difficulty: "beginner", syllables: 1 },
  { id: "tight", word: "tight", rhymeGroup: "ight", difficulty: "beginner", syllables: 1 },
  { id: "right", word: "right", rhymeGroup: "ight", difficulty: "beginner", syllables: 1 },
  { id: "flow", word: "flow", rhymeGroup: "ow", difficulty: "beginner", syllables: 1 },
  { id: "glow", word: "glow", rhymeGroup: "ow", difficulty: "beginner", syllables: 1 },
  { id: "low", word: "low", rhymeGroup: "ow", difficulty: "beginner", syllables: 1 },
  { id: "show", word: "show", rhymeGroup: "ow", difficulty: "beginner", syllables: 1 },
  { id: "throw", word: "throw", rhymeGroup: "ow", difficulty: "beginner", syllables: 1 },
  { id: "chain", word: "chain", rhymeGroup: "ain", difficulty: "beginner", syllables: 1 },
  { id: "rain", word: "rain", rhymeGroup: "ain", difficulty: "beginner", syllables: 1 },
  { id: "pain", word: "pain", rhymeGroup: "ain", difficulty: "beginner", syllables: 1 },
  { id: "brain", word: "brain", rhymeGroup: "ain", difficulty: "beginner", syllables: 1 },
  { id: "fame", word: "fame", rhymeGroup: "ame", difficulty: "beginner", syllables: 1 },
  { id: "game", word: "game", rhymeGroup: "ame", difficulty: "beginner", syllables: 1 },
  { id: "flame", word: "flame", rhymeGroup: "ame", difficulty: "beginner", syllables: 1 },
  { id: "name", word: "name", rhymeGroup: "ame", difficulty: "beginner", syllables: 1 },

  // ── intermediate: 2 syllables ────────────────────────────────────────
  { id: "higher", word: "higher", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "inspire", word: "inspire", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "fire", word: "fire", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "wire", word: "wire", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "desire", word: "desire", rhymeGroup: "ire", difficulty: "intermediate", syllables: 2 },
  { id: "pressure", word: "pressure", rhymeGroup: "eshur", difficulty: "intermediate", syllables: 2 },
  { id: "measure", word: "measure", rhymeGroup: "eshur", difficulty: "intermediate", syllables: 2 },
  { id: "treasure", word: "treasure", rhymeGroup: "eshur", difficulty: "intermediate", syllables: 2 },
  { id: "danger", word: "danger", rhymeGroup: "anger", difficulty: "intermediate", syllables: 2 },
  { id: "stranger", word: "stranger", rhymeGroup: "anger", difficulty: "intermediate", syllables: 2 },
  { id: "anger", word: "anger", rhymeGroup: "anger", difficulty: "intermediate", syllables: 2 },
  { id: "money", word: "money", rhymeGroup: "unny", difficulty: "intermediate", syllables: 2 },
  { id: "honey", word: "honey", rhymeGroup: "unny", difficulty: "intermediate", syllables: 2 },
  { id: "funny", word: "funny", rhymeGroup: "unny", difficulty: "intermediate", syllables: 2 },
  { id: "running", word: "running", rhymeGroup: "unning", difficulty: "intermediate", syllables: 2 },
  { id: "stunning", word: "stunning", rhymeGroup: "unning", difficulty: "intermediate", syllables: 2 },
  { id: "cunning", word: "cunning", rhymeGroup: "unning", difficulty: "intermediate", syllables: 2 },
  { id: "city", word: "city", rhymeGroup: "ity", difficulty: "intermediate", syllables: 2 },
  { id: "pretty", word: "pretty", rhymeGroup: "ity", difficulty: "intermediate", syllables: 2 },
  { id: "gritty", word: "gritty", rhymeGroup: "ity", difficulty: "intermediate", syllables: 2 },
  { id: "shadow", word: "shadow", rhymeGroup: "adow", difficulty: "intermediate", syllables: 2 },
  { id: "meadow", word: "meadow", rhymeGroup: "adow", difficulty: "intermediate", syllables: 2 },
  { id: "trouble", word: "trouble", rhymeGroup: "uble", difficulty: "intermediate", syllables: 2 },
  { id: "double", word: "double", rhymeGroup: "uble", difficulty: "intermediate", syllables: 2 },
  { id: "bubble", word: "bubble", rhymeGroup: "uble", difficulty: "intermediate", syllables: 2 },
  { id: "matter", word: "matter", rhymeGroup: "atter", difficulty: "intermediate", syllables: 2 },
  { id: "chatter", word: "chatter", rhymeGroup: "atter", difficulty: "intermediate", syllables: 2 },
  { id: "shatter", word: "shatter", rhymeGroup: "atter", difficulty: "intermediate", syllables: 2 },

  // ── advanced: 3+ syllables / multis ──────────────────────────────────
  { id: "legacy", word: "legacy", rhymeGroup: "egacy", difficulty: "advanced", syllables: 3 },
  { id: "destiny", word: "destiny", rhymeGroup: "estiny", difficulty: "advanced", syllables: 3 },
  { id: "memory", word: "memory", rhymeGroup: "emory", difficulty: "advanced", syllables: 3 },
  { id: "history", word: "history", rhymeGroup: "istory", difficulty: "advanced", syllables: 3 },
  { id: "victory", word: "victory", rhymeGroup: "ictory", difficulty: "advanced", syllables: 3 },
  { id: "energy", word: "energy", rhymeGroup: "energy", difficulty: "advanced", syllables: 3 },
  { id: "remedy", word: "remedy", rhymeGroup: "emedy", difficulty: "advanced", syllables: 3 },
  { id: "tragedy", word: "tragedy", rhymeGroup: "agedy", difficulty: "advanced", syllables: 3 },
  { id: "philosophy", word: "philosophy", rhymeGroup: "osophy", difficulty: "advanced", syllables: 4 },
  { id: "atrocity", word: "atrocity", rhymeGroup: "ocity", difficulty: "advanced", syllables: 4 },
  { id: "velocity", word: "velocity", rhymeGroup: "ocity", difficulty: "advanced", syllables: 4 },
  { id: "ferocity", word: "ferocity", rhymeGroup: "ocity", difficulty: "advanced", syllables: 4 },
  { id: "millionaire", word: "millionaire", rhymeGroup: "aire", difficulty: "advanced", syllables: 4 },
  { id: "billionaire", word: "billionaire", rhymeGroup: "aire", difficulty: "advanced", syllables: 4 },
  { id: "questionnaire", word: "questionnaire", rhymeGroup: "aire", difficulty: "advanced", syllables: 4 },
  { id: "renegade", word: "renegade", rhymeGroup: "ade", difficulty: "advanced", syllables: 3 },
  { id: "masquerade", word: "masquerade", rhymeGroup: "ade", difficulty: "advanced", syllables: 4 },
  { id: "serenade", word: "serenade", rhymeGroup: "ade", difficulty: "advanced", syllables: 3 },
  { id: "satellite", word: "satellite", rhymeGroup: "ite", difficulty: "advanced", syllables: 3 },
  { id: "appetite", word: "appetite", rhymeGroup: "ite", difficulty: "advanced", syllables: 3 },
  { id: "dynamite", word: "dynamite", rhymeGroup: "ite", difficulty: "advanced", syllables: 3 },
];

export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }

  return items[Math.floor(Math.random() * items.length)];
}

/** Fisher–Yates. Returns a new shuffled array; does not mutate input. */
export function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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

export function getGenres(allBeats = beats): string[] {
  return Array.from(new Set(allBeats.map((beat) => beat.genre))).sort();
}

export function getStyles(allBeats = beats): string[] {
  return Array.from(new Set(allBeats.map((beat) => beat.style))).sort();
}
