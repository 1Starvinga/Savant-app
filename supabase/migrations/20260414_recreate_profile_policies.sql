-- ============================================================
-- Definitive fix: drop every policy on profiles, recreate clean
-- Run in: https://supabase.com/dashboard/project/anjfbjqbdahxdgnrnjdx/sql/new
-- ============================================================

-- ── 1. Drop every policy that may exist on profiles ──────────
-- Using a DO block so unknown policy names don't abort the script.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
    raise notice 'Dropped policy: %', pol.policyname;
  end loop;
end;
$$;

-- ── 2. Confirm RLS is enabled ─────────────────────────────────
alter table public.profiles enable row level security;

-- ── 3. Recreate policies scoped to `authenticated` role ───────
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ( auth.uid() = user_id );

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ( auth.uid() = user_id );

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- ── 4. Recreate SECURITY DEFINER RPC (bypasses RLS) ──────────
-- This is the app's primary way to fetch/create a profile.
-- SECURITY DEFINER means it runs as the function owner (postgres),
-- so RLS on the profiles table does not apply inside it.
create or replace function public.get_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_uid     uuid := auth.uid();
  v_email   text;
  v_name    text;
begin
  if v_uid is null then
    raise exception 'get_my_profile: auth.uid() is null — caller is not authenticated';
  end if;

  -- Fetch existing row
  select * into v_profile from public.profiles where user_id = v_uid;
  if found then
    return v_profile;
  end if;

  -- Create missing row
  select
    email,
    coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  into v_email, v_name
  from auth.users where id = v_uid;

  insert into public.profiles (user_id, email, full_name, role)
  values (v_uid, coalesce(v_email,''), coalesce(v_name,''), 'practitioner')
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.get_my_profile() to authenticated;

-- ── 5. Backfill any auth users still missing a profile row ────
insert into public.profiles (user_id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'practitioner'
from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;

-- ── 6. Verify — run these selects and check the output ────────
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

select id, user_id, email, full_name, role from public.profiles;
