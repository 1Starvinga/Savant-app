-- Fix practitioner_id FK: it referenced profiles(id) but we store
-- auth.uid() there (= auth.users.id, not profiles.id).
-- Drop the bad FK and let practitioner_id be a plain UUID.
alter table public.session_notes
  drop constraint if exists session_notes_practitioner_id_fkey;

-- Add session_date so we can upsert "one note per client per practitioner per day"
alter table public.session_notes
  add column if not exists session_date date not null default current_date;

-- Unique constraint that the upsert targets
alter table public.session_notes
  drop constraint if exists session_notes_unique_daily;

alter table public.session_notes
  add constraint session_notes_unique_daily
  unique (client_id, practitioner_id, session_date);
