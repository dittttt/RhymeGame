-- RhymeGame Beta schema
-- All tables first, then all policies (to avoid forward-reference errors).
-- Idempotent + re-runnable. Postgres has no `create policy if not exists`,
-- so we drop/recreate each policy explicitly.

-- ───── TABLES ─────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  fav_genres   text[] default '{}'::text[],
  elo          integer not null default 1000,
  share_slug   text unique,
  created_at   timestamptz not null default now()
);
create index if not exists profiles_share_slug_idx on public.profiles(share_slug);

create table if not exists public.lobbies (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text,
  host_id         uuid references public.profiles(id) on delete set null,
  mode            text not null default 'custom_online'
                    check (mode in ('custom_offline','custom_online','casual','ranked','spectate')),
  visibility      text not null default 'public' check (visibility in ('public','private')),
  min_elo         integer not null default 0,
  max_players     integer not null default 6,
  current_beat_id text,
  current_genre   text,
  status          text not null default 'waiting' check (status in ('waiting','playing','complete')),
  created_at      timestamptz not null default now()
);
create index if not exists lobbies_status_idx on public.lobbies(status);
create index if not exists lobbies_code_idx on public.lobbies(code);

create table if not exists public.lobby_members (
  lobby_id  uuid not null references public.lobbies(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'player' check (role in ('player','spectator','host')),
  score     integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (lobby_id, user_id)
);

create table if not exists public.lobby_chat (
  id         uuid primary key default gen_random_uuid(),
  lobby_id   uuid not null references public.lobbies(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null check (char_length(message) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists lobby_chat_lobby_idx on public.lobby_chat(lobby_id, created_at desc);

create table if not exists public.lobby_votes (
  id           uuid primary key default gen_random_uuid(),
  lobby_id     uuid not null references public.lobbies(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('beat','genre','winner')),
  target_value text not null,
  created_at   timestamptz not null default now()
);
create index if not exists lobby_votes_lobby_idx on public.lobby_votes(lobby_id, target_type);

create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  lobby_id   uuid references public.lobbies(id) on delete set null,
  winner_id  uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  beat_id    text,
  genre      text
);

create table if not exists public.match_players (
  match_id    uuid not null references public.matches(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'player',
  final_score integer not null default 0,
  placement   integer,
  primary key (match_id, user_id)
);

create table if not exists public.elo_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  match_id   uuid references public.matches(id) on delete set null,
  elo_before integer not null,
  elo_after  integer not null,
  delta      integer not null,
  created_at timestamptz not null default now()
);
create index if not exists elo_history_user_idx on public.elo_history(user_id, created_at desc);

-- ───── PROFILE AUTO-CREATE TRIGGER ────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, share_slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    substr(replace(new.id::text, '-', ''), 1, 10)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───── ROW LEVEL SECURITY ─────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.lobbies        enable row level security;
alter table public.lobby_members  enable row level security;
alter table public.lobby_chat     enable row level security;
alter table public.lobby_votes    enable row level security;
alter table public.matches        enable row level security;
alter table public.match_players  enable row level security;
alter table public.elo_history    enable row level security;

-- profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- lobbies
drop policy if exists "lobbies_select_visible" on public.lobbies;
create policy "lobbies_select_visible" on public.lobbies
  for select using (
    visibility = 'public'
    or exists (select 1 from public.lobby_members m
                where m.lobby_id = lobbies.id and m.user_id = auth.uid())
  );

drop policy if exists "lobbies_insert_authed" on public.lobbies;
create policy "lobbies_insert_authed" on public.lobbies
  for insert with check (auth.uid() = host_id);

drop policy if exists "lobbies_update_host" on public.lobbies;
create policy "lobbies_update_host" on public.lobbies
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- lobby_members
drop policy if exists "lobby_members_select_all" on public.lobby_members;
create policy "lobby_members_select_all" on public.lobby_members for select using (true);

drop policy if exists "lobby_members_insert_self" on public.lobby_members;
create policy "lobby_members_insert_self" on public.lobby_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "lobby_members_update_self" on public.lobby_members;
create policy "lobby_members_update_self" on public.lobby_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lobby_members_delete_self" on public.lobby_members;
create policy "lobby_members_delete_self" on public.lobby_members
  for delete using (auth.uid() = user_id);

-- lobby_chat
drop policy if exists "lobby_chat_select_member" on public.lobby_chat;
create policy "lobby_chat_select_member" on public.lobby_chat
  for select using (
    exists (select 1 from public.lobby_members m
             where m.lobby_id = lobby_chat.lobby_id and m.user_id = auth.uid())
  );

drop policy if exists "lobby_chat_insert_member" on public.lobby_chat;
create policy "lobby_chat_insert_member" on public.lobby_chat
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.lobby_members m
                 where m.lobby_id = lobby_chat.lobby_id and m.user_id = auth.uid())
  );

-- lobby_votes
drop policy if exists "lobby_votes_select_member" on public.lobby_votes;
create policy "lobby_votes_select_member" on public.lobby_votes
  for select using (
    exists (select 1 from public.lobby_members m
             where m.lobby_id = lobby_votes.lobby_id and m.user_id = auth.uid())
  );

drop policy if exists "lobby_votes_insert_member" on public.lobby_votes;
create policy "lobby_votes_insert_member" on public.lobby_votes
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.lobby_members m
                 where m.lobby_id = lobby_votes.lobby_id and m.user_id = auth.uid())
  );

-- matches / match_players / elo_history (public read; writes via service role)
drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all" on public.matches for select using (true);

drop policy if exists "match_players_select_all" on public.match_players;
create policy "match_players_select_all" on public.match_players for select using (true);

drop policy if exists "elo_history_select_all" on public.elo_history;
create policy "elo_history_select_all" on public.elo_history for select using (true);
