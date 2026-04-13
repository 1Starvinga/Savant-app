-- ============================================================
-- Savant Stretch Method — Initial Schema
-- ============================================================
-- Run this in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/anjfbjqbdahxdgnrnjdx/sql
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  full_name           text,
  email               text,
  phone               text,
  location            text,
  bio                 text,
  role                text not null default 'practitioner'
                        check (role in ('admin', 'practitioner', 'client')),
  certification_level integer check (certification_level in (1, 2)),
  created_at          timestamptz not null default now(),
  constraint profiles_user_id_key unique (user_id)
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. CLIENTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id                uuid primary key default gen_random_uuid(),
  practitioner_id   uuid not null references public.profiles(id) on delete cascade,
  first_name        text not null,
  last_name         text not null,
  email             text,
  phone             text,
  notes             text,
  status            text not null default 'active'
                      check (status in ('active', 'inactive')),
  created_at        timestamptz not null default now()
);


-- ────────────────────────────────────────────────────────────
-- 3. SESSIONS
-- ────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  practitioner_id   uuid not null references public.profiles(id) on delete cascade,
  client_id         uuid not null references public.clients(id) on delete cascade,
  date              date not null,
  start_time        time,
  duration_minutes  integer default 60,
  session_type      text not null default 'followup'
                      check (session_type in ('assessment', 'followup', 'program')),
  notes             text,
  status            text not null default 'scheduled'
                      check (status in ('scheduled', 'completed', 'cancelled')),
  created_at        timestamptz not null default now()
);


-- ────────────────────────────────────────────────────────────
-- 4. ASSESSMENTS
-- ────────────────────────────────────────────────────────────
create table if not exists public.assessments (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.sessions(id) on delete set null,
  client_id         uuid not null references public.clients(id) on delete cascade,
  practitioner_id   uuid not null references public.profiles(id) on delete cascade,
  findings          jsonb not null default '{}'::jsonb,
  summary           text,
  created_at        timestamptz not null default now()
);


-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.clients     enable row level security;
alter table public.sessions    enable row level security;
alter table public.assessments enable row level security;


-- ── profiles ──────────────────────────────────────────────
-- Users can read and update only their own profile
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Admins can read all profiles
create policy "profiles: admin read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );


-- ── clients ───────────────────────────────────────────────
-- Helper: resolve auth.uid() → profile id
create or replace function public.my_profile_id()
returns uuid
language sql stable
security definer
as $$
  select id from public.profiles where user_id = auth.uid() limit 1;
$$;

create policy "clients: practitioner owns"
  on public.clients for all
  using (practitioner_id = public.my_profile_id())
  with check (practitioner_id = public.my_profile_id());

create policy "clients: admin all"
  on public.clients for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );


-- ── sessions ──────────────────────────────────────────────
create policy "sessions: practitioner owns"
  on public.sessions for all
  using (practitioner_id = public.my_profile_id())
  with check (practitioner_id = public.my_profile_id());

create policy "sessions: admin all"
  on public.sessions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );


-- ── assessments ───────────────────────────────────────────
create policy "assessments: practitioner owns"
  on public.assessments for all
  using (practitioner_id = public.my_profile_id())
  with check (practitioner_id = public.my_profile_id());

create policy "assessments: admin all"
  on public.assessments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );


-- ────────────────────────────────────────────────────────────
-- 6. INDEXES (performance)
-- ────────────────────────────────────────────────────────────
create index if not exists clients_practitioner_id_idx    on public.clients(practitioner_id);
create index if not exists sessions_practitioner_id_idx   on public.sessions(practitioner_id);
create index if not exists sessions_client_id_idx         on public.sessions(client_id);
create index if not exists sessions_date_idx              on public.sessions(date);
create index if not exists assessments_practitioner_id_idx on public.assessments(practitioner_id);
create index if not exists assessments_client_id_idx      on public.assessments(client_id);


-- ────────────────────────────────────────────────────────────
-- 7. GRANT public access to anon / authenticated roles
-- ────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant all on public.profiles    to authenticated;
grant all on public.clients     to authenticated;
grant all on public.sessions    to authenticated;
grant all on public.assessments to authenticated;
grant select on public.profiles to anon;
