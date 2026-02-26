-- Two-way messaging: allow multiple replies per note (student <-> facilitator).
-- Each note is a thread; note.content + note.admin_response are the first exchange;
-- additional messages go in note_messages.

create table if not exists public.note_messages (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student', 'facilitator')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_note_messages_note_id on public.note_messages(note_id);
create index if not exists idx_note_messages_created_at on public.note_messages(note_id, created_at);

alter table public.note_messages enable row level security;

-- Students can read messages for their own notes
create policy "Students read messages for own notes" on public.note_messages
  for select using (
    exists (
      select 1 from public.notes n
      where n.id = note_messages.note_id and n.user_id = auth.uid()
    )
  );

-- Students can insert messages (replies) only for their own notes
create policy "Students insert replies on own notes" on public.note_messages
  for insert with check (
    role = 'student'
    and author_id = auth.uid()
    and exists (
      select 1 from public.notes n
      where n.id = note_messages.note_id and n.user_id = auth.uid()
    )
  );

-- Admins and facilitators can read all note_messages
create policy "Admins and facilitators read all note messages" on public.note_messages
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- Admins and facilitators can insert replies (as facilitator) on any note
create policy "Admins and facilitators insert note replies" on public.note_messages
  for insert with check (
    role = 'facilitator'
    and author_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );
