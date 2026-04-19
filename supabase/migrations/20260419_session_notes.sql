-- session_notes: stores intake and end-of-session notes per assessment
create table if not exists public.session_notes (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references public.assessments(id) on delete cascade,
  client_id        uuid references public.clients(id)      on delete cascade,
  practitioner_id  uuid references public.profiles(id)     on delete cascade,
  intake_note      text,
  end_note         text,
  created_at       timestamptz not null default now()
);

-- RLS
alter table public.session_notes enable row level security;

create policy "Practitioners can manage their own session notes"
  on public.session_notes
  for all
  using  (practitioner_id = auth.uid())
  with check (practitioner_id = auth.uid());
