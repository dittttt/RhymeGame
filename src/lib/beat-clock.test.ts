import { describe, expect, it } from "vitest";
import { getBeatClock, secondsUntilNextBeat } from "./beat-clock";
import type { Beat } from "./game-data";

const beat: Beat = {
  id: "test-beat",
  youtubeVideoId: "video",
  title: "Test Beat",
  channel: "test",
  sourceUrl: "https://example.com",
  genre: "Hip hop",
  style: "Boom Bap",
  mood: "test",
  bpm: 120,
  timeSignature: "4/4",
  startSeconds: 12,
  durationSeconds: 90,
  metadataSource: "manual",
};

describe("getBeatClock", () => {
  it("anchors beat timing to the selected audio start offset", () => {
    const clock = getBeatClock(beat, 1.25);

    expect(clock.audioPositionSeconds).toBeCloseTo(13.25);
    expect(clock.absoluteBeat).toBe(27);
    expect(clock.beatInBar).toBe(3);
    expect(clock.currentBar).toBe(7);
  });

  it("tracks countdown to the next beat for visual sync", () => {
    const clock = getBeatClock(beat, 1.25);

    expect(clock.beatProgress).toBeCloseTo(0.5);
    expect(secondsUntilNextBeat(beat, 1.25)).toBeCloseTo(0.25);
  });
});
