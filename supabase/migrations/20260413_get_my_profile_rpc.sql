-- ============================================================
-- Fix: get_my_profile() RPC + rebuild all profile policies
-- Run in: https://supabase.com/dashboard/project/anjfbjqbdahxdgnrnjdx/sql/new
-- ============================================================


-- ── Step 1: Drop ALL existing policies on profiles ───────────
-- Start clean so there are no conflicts or duplicates.
drop policy if exists "profiles: own read"          on public.profiles;
drop policy if exists "profiles: own update"        on public.profiles;
drop policy if exists "profiles: own insert"        on public.profiles;
drop policy if exists "profiles: own upsert update" on public.profiles;
drop policy if exists "profiles: admin read all"    on public.profiles;


-- ── Step 2: Recreate policies explicitly scoped to authenticated ──
create policy "profiles: select own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles: insert own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── Step 3: SECURITY DEFINER RPC ────────────────────────────
-- Runs as the postgres owner, so it BYPASSES RLS entirely.
-- The app calls this instead of querying the table directly.
-- This eliminates any RLS / auth.uid() ambiguity.
create or replace function public.get_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_user_id uuid := auth.uid();
  v_email   text;
  v_name    text;
begin
  -- Confirm the caller is authenticated
  if v_user_id is null then
    raise exception 'Not authenticated — auth.uid() returned null';
  end if;

  -- Try to fetch existing profile
  select * into v_profile
  from public.profiles
  where user_id = v_user_id;

  -- If found, return it
  if found then
    return v_profile;
  end if;

  -- Profile missing — pull user info from auth.users and create it
  select email,
         coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  into v_email, v_name
  from auth.users
  where id = v_user_id;

  insert into public.profiles (user_id, email, full_name, role)
  values (v_user_id, v_email, v_name, 'practitioner')
  returning * into v_profile;

  return v_profile;
end;
$$;

-- Grant execute to logged-in users
grant execute on function public.get_my_profile() to authenticated;


-- ── Step 4: Backfill any existing auth users with no profile row ──
insert into public.profiles (user_id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'practitioner'
from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;


-- ── Step 5: Verify ───────────────────────────────────────────
-- Run this select after the above to confirm rows exist:
-- select id, user_id, email, full_name, role from public.profiles;
