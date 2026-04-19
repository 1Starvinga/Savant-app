-- Add structured background fields to clients
alter table public.clients
  add column if not exists injuries   text,
  add column if not exists conditions text,
  add column if not exists goals      text,
  add column if not exists occupation text;
