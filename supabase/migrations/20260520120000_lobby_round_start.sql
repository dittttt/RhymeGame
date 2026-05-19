-- Phase 4: add round-start timestamp for server-authoritative downbeat sync.
alter table public.lobbies
  add column if not exists round_started_at timestamptz;

-- Make sure Realtime broadcasts changes for lobby tables.
do $$ begin
  perform 1 from pg_publication where pubname = 'supabase_realtime';
  if found then
    begin alter publication supabase_realtime add table public.lobbies;        exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.lobby_members; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.lobby_chat;    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.lobby_votes;   exception when duplicate_object then null; end;
  end if;
end $$;
