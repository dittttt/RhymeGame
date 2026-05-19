import { NextResponse } from "next/server";

const SOUNDCHARTS_BASE_URL = "https://customer.api.soundcharts.com/api/v2";

type MetadataLookupBody = {
  artist?: string;
  title?: string;
  isrc?: string;
};

export async function POST(request: Request) {
  const appId = process.env.SOUNDCHARTS_APP_ID;
  const apiKey = process.env.SOUNDCHARTS_API_KEY;
  const body = (await request.json().catch(() => ({}))) as MetadataLookupBody;

  if (!appId || !apiKey) {
    return NextResponse.json(
      {
        error:
          "No licensed audio metadata provider is configured. Add SOUNDCHARTS_APP_ID/SOUNDCHARTS_API_KEY, or use Tunebat/GetSongBPM only through official API access.",
        item: null,
        requested: body,
      },
      { status: 200 },
    );
  }

  // Provider adapter placeholder: exact endpoints vary by Soundcharts plan/account.
  // Keep this server-side so API credentials are never exposed to the browser.
  return NextResponse.json({
    error:
      "Soundcharts credentials are configured, but provider endpoint mapping must be finalized for the subscribed API plan.",
    provider: "soundcharts",
    baseUrl: SOUNDCHARTS_BASE_URL,
    requested: body,
  });
}
