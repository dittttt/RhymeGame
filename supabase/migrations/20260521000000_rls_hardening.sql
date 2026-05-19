-- RLS hardening for beta lobby tables.
-- Adds missing DELETE policies on lobby_chat / lobby_votes (the client deletes
-- prior votes when re-voting and the host clears votes between rounds), and
-- lets a lobby host kick / demote / remove members in addition to self-leave.
-- Re-runnable: drop-if-exists + create.

-- ───── lobby_chat ─────────────────────────────────────────────────
-- only the message author may delete (e.g. moderation later). Host can too.
drop policy if exists "lobby_chat_delete_own" on public.lobby_chat;
create policy "lobby_chat_delete_own" on public.lobby_chat
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.lobbies l
      where l.id = lobby_chat.lobby_id and l.host_id = auth.uid()
    )
  );

-- ───── lobby_votes ────────────────────────────────────────────────
-- author may delete own vote (re-vote pattern). Host may clear stale votes
-- between rounds. Restricted to members of the lobby.
drop policy if exists "lobby_votes_delete_own_or_host" on public.lobby_votes;
create policy "lobby_votes_delete_own_or_host" on public.lobby_votes
  for delete using (
    (
      auth.uid() = user_id
      and exists (select 1 from public.lobby_members m
                   where m.lobby_id = lobby_votes.lobby_id and m.user_id = auth.uid())
    )
    or exists (
      select 1 from public.lobbies l
      where l.id = lobby_votes.lobby_id and l.host_id = auth.uid()
    )
  );

-- ───── lobby_members ──────────────────────────────────────────────
-- Replace delete-self-only with delete-self-OR-host (host can kick).
drop policy if exists "lobby_members_delete_self" on public.lobby_members;
drop policy if exists "lobby_members_delete_self_or_host" on public.lobby_members;
create policy "lobby_members_delete_self_or_host" on public.lobby_members
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.lobbies l
      where l.id = lobby_members.lobby_id and l.host_id = auth.uid()
    )
  );

-- Tighten insert: must be authed user inserting their OWN row AND lobby must exist.
drop policy if exists "lobby_members_insert_self" on public.lobby_members;
create policy "lobby_members_insert_self" on public.lobby_members
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.lobbies l where l.id = lobby_members.lobby_id)
  );
