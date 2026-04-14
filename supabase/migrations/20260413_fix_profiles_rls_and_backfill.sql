-- ============================================================
-- Fix: profiles INSERT policy + backfill missing rows
-- Run this in: https://supabase.com/dashboard/project/anjfbjqbdahxdgnrnjdx/sql/new
-- ============================================================

-- 1. Allow authenticated users to insert their own profile row
--    (was missing from the initial migration)
create policy "profiles: own insert"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- 2. Backfill a profile row for any auth user who doesn't have one
--    (covers users who signed up before the trigger was created)
insert into public.profiles (user_id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  'practitioner'
from auth.users
where id not in (select user_id from public.profiles);
