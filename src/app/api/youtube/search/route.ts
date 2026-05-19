import { NextResponse } from "next/server";
import { parseBeatMetadata, metadataStatusLabel } from "@/lib/beat-metadata";
import { buildYouTubeWatchUrl } from "@/lib/youtube";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    thumbnails?: { medium?: { url?: string } };
  };
};

type YouTubeVideoItem = {
  id?: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    tags?: string[];
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
  const query = searchParams.get("q") || "freestyle type beat bpm";
  const strictMetadata = searchParams.get("strict") !== "false";

  const searchParamsForYouTube = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: `${query} bpm`,
    type: "video",
    videoEmbeddable: "true",
    maxResults: "12",
    safeSearch: "none",
  });

  const searchResponse = await fetch(`${YOUTUBE_SEARCH_URL}?${searchParamsForYouTube.toString()}`, {
    next: { revalidate: 60 * 60 },
  });

  if (!searchResponse.ok) {
    return NextResponse.json(
      { error: `YouTube search failed with status ${searchResponse.status}`, items: [] },
      { status: 200 },
    );
  }

  const searchData = (await searchResponse.json()) as { items?: YouTubeSearchItem[] };
  const searchItems = searchData.items ?? [];
  const videoIds = searchItems.map((item) => item.id?.videoId).filter(Boolean) as string[];

  const descriptionsById = new Map<string, YouTubeVideoItem["snippet"]>();

  if (videoIds.length > 0) {
    const videosParams = new URLSearchParams({
      key: apiKey,
      part: "snippet",
      id: videoIds.join(","),
    });

    const videosResponse = await fetch(`${YOUTUBE_VIDEOS_URL}?${videosParams.toString()}`, {
      next: { revalidate: 60 * 60 },
    });

    if (videosResponse.ok) {
      const videosData = (await videosResponse.json()) as { items?: YouTubeVideoItem[] };
      for (const item of videosData.items ?? []) {
        if (item.id) descriptionsById.set(item.id, item.snippet);
      }
    }
  }

  const items = searchItems
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) return null;

      const fullSnippet = descriptionsById.get(videoId);
      const title = fullSnippet?.title ?? item.snippet?.title ?? "Untitled beat";
      const channel = fullSnippet?.channelTitle ?? item.snippet?.channelTitle ?? "YouTube";
      const description = fullSnippet?.description ?? item.snippet?.description ?? "";
      const metadata = parseBeatMetadata(`${title}\n${description}`);
      const hasBpm = Boolean(metadata.bpm);

      if (strictMetadata && !hasBpm) return null;

      return {
        youtubeVideoId: videoId,
        title,
        channel,
        descriptionPreview: description.slice(0, 240),
        sourceUrl: buildYouTubeWatchUrl(videoId),
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? null,
        bpm: metadata.bpm,
        timeSignature: metadata.timeSignature ?? "4/4",
        timeSignatureAssumed: !metadata.timeSignature,
        metadataSource: metadata.source,
        metadataConfidence: metadata.confidence,
        metadataNotes: metadataStatusLabel(metadata),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    items,
    note: strictMetadata
      ? "Only returned YouTube results with parseable BPM in the title or description. Missing time signatures are assumed 4/4."
      : "Returned results even when BPM is missing.",
  });
}
