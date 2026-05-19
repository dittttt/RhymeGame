# RhymeGame

A browser-first freestyle rap practice game/tool for friends.

RhymeGame is inspired by mobile rhyme-practice tools, but built for the web with Next.js, Vercel, and Supabase. Players search/select a YouTube beat, choose BPM/time signature/genre/style filters, then freestyle out loud while rhyme targets rotate on beat with a bouncing-ball visual.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres
- Vercel hosting
- YouTube Data API for optional live beat search
- YouTube embeds for playback/preview

## MVP Features

- Curated fallback YouTube beats with manual BPM/time-signature metadata
- YouTube search API route when `YOUTUBE_API_KEY` is configured
- BPM range, time signature, genre, and style filters
- Difficulty and rhyme mode selection
- Large rhyme target display
- Upcoming word queue
- Bouncing beat ball / bar indicator
- YouTube embedded beat player
- Supabase schema for beats, rhyme words, and game sessions

## Important Beat Metadata Note

YouTube Data API does **not** provide BPM or time signature. In the MVP, those fields are curated/manual metadata. Future BPM/time-signature analysis should only run on legal/licensed preview audio or user-owned uploads, not by downloading YouTube audio.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=
```

- Supabase values are needed once the database project is created.
- `YOUTUBE_API_KEY` is optional. Without it, the app uses curated fallback beats.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor for the `RhymeGame` project.

## Deployment

Target names requested:

- GitHub repo: `RhymeGame`
- Supabase project: `RhymeGame`
- Vercel project: `RhymeGame`
