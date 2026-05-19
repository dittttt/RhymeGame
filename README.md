# RhymeGame

A browser-first freestyle rap practice game/tool for friends.

RhymeGame is inspired by mobile rhyme-practice tools, but built for the web with Next.js, Vercel, and Supabase. Players search/select a beat, set BPM/time-signature filters, start a timed cypher, and freestyle out loud while rhyme targets rotate on beat.

## Current MVP

- Next.js App Router + TypeScript + Tailwind CSS.
- Freestyle tool, not typed answer scoring.
- Curated beats with manual metadata.
- YouTube Data API search that filters for type beats with parseable BPM in the title/description.
- Full YouTube description lookup via `videos.list`.
- BPM/time-signature parser for creator metadata like `140 BPM`, `BPM: 140`, `4/4`, `Time Signature: 4/4`.
- YouTube iframe playback only; no downloading or rehosting audio.
- Bouncing beat-ball visual synced from BPM/time signature.
- Supabase schema for beats, rhyme words, sessions, events, and metadata lookups.
- Placeholder provider route for licensed existing-song metadata lookup.

## Metadata rule

For YouTube type beats, RhymeGame only accepts search results with parseable BPM in the title or description. If time signature is missing, the app assumes `4/4` and labels it as assumed.

For existing song instrumentals, YouTube descriptions often lack BPM/time signature. The app is designed to use licensed metadata APIs instead of scraping protected sites. Good candidates:

- Soundcharts Audio Features API: BPM, key, time signature.
- Tunebat API if official API access is obtained.
- GetSongBPM API if official API access is obtained.

## Environment variables

Copy `.env.example` to `.env.local` locally or add these in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=
SOUNDCHARTS_APP_ID=
SOUNDCHARTS_API_KEY=
```

Only the `NEXT_PUBLIC_*` Supabase values are browser-visible. Keep YouTube and metadata-provider API keys server-side only.

## Local development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build checks

```bash
npm run lint
npm run build
```

## Supabase setup

1. Create a Supabase project named `RhymeGame`.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
   - The SQL is safe to rerun.
   - Supabase/Postgres does not support `create policy if not exists`, so policies are handled with `drop policy if exists` then `create policy`.
4. Copy project URL and anon key.
5. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Vercel setup

1. Import GitHub repo `dittttt/RhymeGame` into Vercel.
2. Project name: `RhymeGame`.
3. Framework: Next.js.
4. Add environment variables from `.env.example`.
5. Deploy.

## GitHub

Repo:

```text
https://github.com/dittttt/RhymeGame
```
