import type { Beat } from "./game-data";

export type BeatFilters = {
  query: string;
  minBpm: number;
  maxBpm: number;
  timeSignature: string;
  genre: string;
  style: string;
};

export const defaultFilters: BeatFilters = {
  query: "",
  minBpm: 60,
  maxBpm: 150,
  timeSignature: "any",
  genre: "any",
  style: "any",
};

export function filterBeats(beats: Beat[], filters: BeatFilters): Beat[] {
  const query = filters.query.trim().toLowerCase();

  return beats.filter((beat) => {
    const matchesQuery =
      !query ||
      [beat.title, beat.channel, beat.genre, beat.style, beat.mood]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesBpm = beat.bpm >= filters.minBpm && beat.bpm <= filters.maxBpm;
    const matchesTime = filters.timeSignature === "any" || beat.timeSignature === filters.timeSignature;
    const matchesGenre = filters.genre === "any" || beat.genre === filters.genre;
    const matchesStyle = filters.style === "any" || beat.style === filters.style;

    return matchesQuery && matchesBpm && matchesTime && matchesGenre && matchesStyle;
  });
}
