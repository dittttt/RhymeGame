import { NextResponse } from "next/server";
import { buildYouTubeWatchUrl } from "@/lib/youtube";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url?: string } };
  };
};

export async function GET(request: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "YOUTUBE_API_KEY is not configured. Using curated local beats instead.",
        items: [],
      },
      { status: 200 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "freestyle type beat";

  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    videoEmbeddable: "true",
    maxResults: "10",
    safeSearch: "none",
  });

  const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `YouTube search failed with status ${response.status}`, items: [] },
      { status: 200 },
    );
  }

  const data = (await response.json()) as { items?: YouTubeSearchItem[] };
  const items = (data.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) return null;

      return {
        youtubeVideoId: videoId,
        title: item.snippet?.title ?? "Untitled beat",
        channel: item.snippet?.channelTitle ?? "YouTube",
        sourceUrl: buildYouTubeWatchUrl(videoId),
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? null,
        metadataSource: "unknown",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}
