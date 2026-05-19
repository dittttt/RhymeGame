-- Supabase schema for RhymeGame

create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text unique not null,
  title text not null,
  channel text,
  source_url text not null,
  genre text,
  style text,
  mood text,
  bpm integer,
  time_signature text not null default '4/4',
  start_seconds integer not null default 30,
  duration_seconds integer not null default 90,
  is_embeddable boolean not null default true,
  metadata_source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.rhyme_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  rhyme_group text,
  difficulty text not null default 'beginner',
  syllables integer,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid references public.beats(id) on delete set null,
  mode text not null,
  difficulty text not null,
  bpm integer,
  time_signature text not null default '4/4',
  genre text,
  duration_seconds integer not null default 90,
  created_at timestamptz not null default now()
);

alter table public.beats enable row level security;
alter table public.rhyme_words enable row level security;
alter table public.game_sessions enable row level security;

create policy "Public read beats"
  on public.beats for select
  using (true);

create policy "Public read rhyme words"
  on public.rhyme_words for select
  using (true);

create policy "Public insert game sessions"
  on public.game_sessions for insert
  with check (true);

create policy "Public read ownless game sessions for MVP"
  on public.game_sessions for select
  using (true);
