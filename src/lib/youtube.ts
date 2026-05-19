import type { Beat } from "./game-data";

export function buildYouTubeEmbedUrl(beat: Beat): string {
  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    rel: "0",
    start: String(beat.startSeconds),
  });

  return `https://www.youtube.com/embed/${beat.youtubeVideoId}?${params.toString()}`;
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
