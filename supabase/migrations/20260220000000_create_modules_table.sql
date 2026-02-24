-- Create modules table (required for quizzes). Run this before the quizzes migration.
-- Requires: public.courses and public.profiles must exist.

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  index_in_course integer not null,
  title text not null,
  description text,
  video_url text,
  audio_url text,
  pdf_url text,
  scripture_reference text,
  rich_text jsonb,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "Modules visible with course" on public.modules
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
      and c.is_published = true
    )
  );

create policy "Admins can view all modules" on public.modules
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Allow admins/facilitators to manage modules for courses they can manage
create policy "Facilitators and admins manage modules" on public.modules
  for all using (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.id = course_id
      where p.id = auth.uid()
      and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );
