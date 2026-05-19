import type { BeatMetadataSource, TimeSignature } from "./game-data";

export type ParsedBeatMetadata = {
  bpm: number | null;
  timeSignature: TimeSignature | null;
  source: BeatMetadataSource;
  confidence: "parsed" | "assumed" | "unknown";
  matchedText?: string;
};

const TIME_SIGNATURES: TimeSignature[] = ["4/4", "3/4", "6/8", "2/4", "5/4", "7/4"];

const BPM_PATTERNS = [
  /(?:^|[^a-z0-9])(?:bpm|tempo)\s*[:=-]?\s*(\d{2,3})(?:\s*bpm)?(?:[^a-z0-9]|$)/i,
  /(?:^|[^a-z0-9])(\d{2,3})\s*(?:bpm|beats per minute)(?:[^a-z0-9]|$)/i,
  /(?:^|[^a-z0-9])(\d{2,3})\s*(?:bpms?)(?:[^a-z0-9]|$)/i,
];

const TIME_SIGNATURE_PATTERNS = [
  /(?:time\s*signature|meter|metre)\s*[:=-]?\s*(\d\s*\/\s*\d)/i,
  /(?:^|[^\d])(\d\s*\/\s*\d)(?:\s*(?:time|meter|signature))?/i,
];

export function parseBeatMetadata(text: string): ParsedBeatMetadata {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const bpmMatch = BPM_PATTERNS.map((pattern) => cleanText.match(pattern)).find(Boolean);
  const rawBpm = bpmMatch?.[1] ? Number.parseInt(bpmMatch[1], 10) : Number.NaN;
  const bpm = Number.isFinite(rawBpm) && rawBpm >= 40 && rawBpm <= 240 ? rawBpm : null;

  const timeMatch = TIME_SIGNATURE_PATTERNS.map((pattern) => cleanText.match(pattern)).find(Boolean);
  const normalizedSignature = timeMatch?.[1]?.replace(/\s+/g, "") as TimeSignature | undefined;
  const timeSignature = normalizedSignature && TIME_SIGNATURES.includes(normalizedSignature)
    ? normalizedSignature
    : null;

  return {
    bpm,
    timeSignature,
    source: bpm || timeSignature ? "youtube_description" : "unknown",
    confidence: bpm || timeSignature ? "parsed" : "unknown",
    matchedText: [bpmMatch?.[0], timeMatch?.[0]].filter(Boolean).join(" · ") || undefined,
  };
}

export function hasRequiredBeatMetadata(metadata: ParsedBeatMetadata): boolean {
  return Boolean(metadata.bpm);
}

export function metadataStatusLabel(metadata: ParsedBeatMetadata): string {
  if (metadata.bpm && metadata.timeSignature) {
    return `${metadata.bpm} BPM · ${metadata.timeSignature} parsed from description`;
  }

  if (metadata.bpm) {
    return `${metadata.bpm} BPM parsed · time signature assumed 4/4`;
  }

  return "Missing BPM in YouTube metadata";
}
