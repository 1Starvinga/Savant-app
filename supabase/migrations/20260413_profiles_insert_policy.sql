-- ============================================================
-- Patch: add INSERT policy for profiles table
-- ============================================================
-- The initial migration was missing an insert policy, which
-- blocked the safety-net upsert in signUp from executing
-- (RLS silently blocked it; the DB trigger still worked for
-- new signups but failed for existing users who signed up
-- before the trigger was created).
--
-- Run this in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/anjfbjqbdahxdgnrnjdx/sql/new
-- ============================================================

-- Allow authenticated users to insert their own profile row
create policy "profiles: own insert"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Also ensure the on-the-fly upsert path works for users
-- whose profile row may be missing (e.g. signed up before
-- the trigger was added).
-- The upsert in useAuth.js uses onConflict: 'user_id' so
-- this covers both insert and the update leg of upsert.
create policy "profiles: own upsert update"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
