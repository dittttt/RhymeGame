import type { Beat } from "./game-data";

/**
 * Number of beat-bar cells the game renders in the on-screen "road".
 * Bumped from 4 → 5 so the upcoming word sits under the last visible bar.
 */
export const VISIBLE_BARS = 5;

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.max(1, bpm);
}

export function beatsPerBar(timeSignature: string): number {
  const [top] = timeSignature.split("/").map(Number);
  return Number.isFinite(top) && top > 0 ? top : 4;
}

export function getBeatClock(beat: Beat, elapsedSeconds: number) {
  const beatLength = secondsPerBeat(beat.bpm);
  const audioPositionSeconds = Math.max(0, beat.startSeconds + elapsedSeconds);
  const absoluteBeat = Math.floor(audioPositionSeconds / beatLength) + 1;
  const perBar = beatsPerBar(beat.timeSignature);
  const currentBar = Math.floor((absoluteBeat - 1) / perBar) + 1;
  const beatInBar = ((absoluteBeat - 1) % perBar) + 1;
  const beatProgress = (audioPositionSeconds % beatLength) / beatLength;

  return {
    currentBeat: absoluteBeat,
    absoluteBeat,
    currentBar,
    beatInBar,
    beatsPerBar: perBar,
    beatProgress,
    audioPositionSeconds,
    beatLength,
    secondsPerBar: beatLength * perBar,
  };
}

export function secondsUntilNextBeat(beat: Beat, elapsedSeconds: number): number {
  const { beatLength, beatProgress } = getBeatClock(beat, elapsedSeconds);
  if (beatProgress === 0) return 0;
  return beatLength * (1 - beatProgress);
}

export function shouldAdvanceWord(
  previousBar: number,
  currentBar: number,
  changeEveryBars: number,
): boolean {
  if (currentBar <= previousBar) return false;
  return (currentBar - 1) % Math.max(1, changeEveryBars) === 0;
}
