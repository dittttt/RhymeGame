-- Supabase schema for RhymeGame
-- Safe to rerun in Supabase SQL Editor.
-- Note: PostgreSQL/Supabase does not support `create policy if not exists`,
-- so policies are dropped/recreated explicitly.

create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text unique not null,
  title text not null,
  channel text,
  source_url text,
  genre text,
  style text,
  mood text,
  bpm integer check (bpm between 40 and 240),
  time_signature text default '4/4',
  start_seconds integer default 30,
  duration_seconds integer default 90,
  metadata_source text default 'unknown',
  metadata_confidence text default 'unknown',
  metadata_notes text,
  description_preview text,
  created_at timestamptz default now()
);

create table if not exists public.rhyme_words (
  id uuid primary key default gen_random_uuid(),
  word text unique not null,
  rhyme_group text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  syllables integer not null default 1,
  created_at timestamptz default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  beat_id uuid references public.beats(id) on delete set null,
  mode text not null default 'free',
  difficulty text not null default 'beginner',
  duration_seconds integer not null default 90,
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists public.round_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.metadata_lookups (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  query text not null,
  artist text,
  title text,
  isrc text,
  bpm integer,
  time_signature text,
  musical_key text,
  confidence text default 'unknown',
  raw jsonb,
  created_at timestamptz default now()
);

alter table public.beats enable row level security;
alter table public.rhyme_words enable row level security;
alter table public.game_sessions enable row level security;
alter table public.round_events enable row level security;
alter table public.metadata_lookups enable row level security;

drop policy if exists "Public read beats" on public.beats;
create policy "Public read beats"
  on public.beats
  for select
  using (true);

drop policy if exists "Public read rhyme words" on public.rhyme_words;
create policy "Public read rhyme words"
  on public.rhyme_words
  for select
  using (true);

drop policy if exists "Public create sessions" on public.game_sessions;
create policy "Public create sessions"
  on public.game_sessions
  for insert
  with check (true);

drop policy if exists "Public read sessions" on public.game_sessions;
create policy "Public read sessions"
  on public.game_sessions
  for select
  using (true);

drop policy if exists "Public create round events" on public.round_events;
create policy "Public create round events"
  on public.round_events
  for insert
  with check (true);

drop policy if exists "Public read round events" on public.round_events;
create policy "Public read round events"
  on public.round_events
  for select
  using (true);

drop policy if exists "Public read metadata lookups" on public.metadata_lookups;
create policy "Public read metadata lookups"
  on public.metadata_lookups
  for select
  using (true);
