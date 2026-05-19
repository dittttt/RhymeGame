import type { Beat } from "./game-data";

export function secondsPerBeat(bpm: number): number {
  return 60 / Math.max(1, bpm);
}

export function beatsPerBar(timeSignature: string): number {
  const [top] = timeSignature.split("/").map(Number);
  return Number.isFinite(top) && top > 0 ? top : 4;
}

export function getBeatClock(beat: Beat, elapsedSeconds: number) {
  const beatLength = secondsPerBeat(beat.bpm);
  const currentBeat = Math.floor(elapsedSeconds / beatLength) + 1;
  const perBar = beatsPerBar(beat.timeSignature);
  const currentBar = Math.floor((currentBeat - 1) / perBar) + 1;
  const beatInBar = ((currentBeat - 1) % perBar) + 1;
  const beatProgress = (elapsedSeconds % beatLength) / beatLength;

  return {
    currentBeat,
    currentBar,
    beatInBar,
    beatsPerBar: perBar,
    beatProgress,
  };
}

export function shouldAdvanceWord(
  previousBar: number,
  currentBar: number,
  changeEveryBars: number,
): boolean {
  if (currentBar <= previousBar) return false;
  return (currentBar - 1) % Math.max(1, changeEveryBars) === 0;
}
