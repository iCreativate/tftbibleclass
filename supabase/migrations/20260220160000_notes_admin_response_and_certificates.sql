-- Notes: add admin response columns so facilitators can respond to student questions
alter table public.notes
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz,
  add column if not exists responded_by uuid references public.profiles(id) on delete set null;

-- Admins and facilitators can view all notes (student questions) and update to add response
drop policy if exists "Admins and facilitators view all notes" on public.notes;
create policy "Admins and facilitators view all notes" on public.notes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

drop policy if exists "Admins and facilitators update notes to respond" on public.notes;
create policy "Admins and facilitators update notes to respond" on public.notes
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- Certificates: store awarded certificates when a course is completed
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_title text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.certificates enable row level security;

create policy "Users see own certificates" on public.certificates
  for select using (user_id = auth.uid());

create policy "Admins view all certificates" on public.certificates
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Insert is done server-side (e.g. when course is completed); allow service or use a trigger/function
-- For app insert we need a policy: only the system can insert (user gets their own when course completes)
-- Allow users to not insert directly; we'll use service role or a function. Simpler: allow insert when user_id = auth.uid() so the app (running as that user) can insert when we detect completion.
create policy "Users insert own certificates" on public.certificates
  for insert with check (user_id = auth.uid());
