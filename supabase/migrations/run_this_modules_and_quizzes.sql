-- Run this entire file in Supabase SQL Editor.
-- Creates: modules, quizzes, quiz_questions, quiz_attempts (and their RLS policies).
-- Requires: public.courses and public.profiles must already exist.

-- ========== MODULES ==========
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

comment on table public.modules is 'Course modules (lessons). Required before creating quizzes.';

alter table public.modules enable row level security;

drop policy if exists "Modules visible with course" on public.modules;
create policy "Modules visible with course" on public.modules
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
      and c.is_published = true
    )
  );

drop policy if exists "Admins can view all modules" on public.modules;
create policy "Admins can view all modules" on public.modules
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Facilitators and admins manage modules" on public.modules;
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

-- ========== QUIZZES ==========
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  passing_score integer not null default 70,
  time_limit_seconds integer,
  randomize_questions boolean not null default false
);

alter table public.quizzes enable row level security;

drop policy if exists "Quizzes visible with module" on public.quizzes;
create policy "Quizzes visible with module" on public.quizzes
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
      and c.is_published = true
    )
  );

drop policy if exists "Admins can view all quizzes" on public.quizzes;
create policy "Admins can view all quizzes" on public.quizzes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ========== QUIZ_QUESTIONS ==========
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null check (type in ('mcq', 'boolean', 'short', 'essay')),
  prompt text not null,
  options text[],
  correct_answer text,
  scripture_reference text,
  explanation text,
  points integer not null default 1,
  index_in_quiz integer not null
);

alter table public.quiz_questions enable row level security;

drop policy if exists "Questions visible with quiz" on public.quiz_questions;
create policy "Questions visible with quiz" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id
    )
  );

drop policy if exists "Admins can view all quiz_questions" on public.quiz_questions;
create policy "Admins can view all quiz_questions" on public.quiz_questions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ========== QUIZ_ATTEMPTS ==========
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  max_score integer not null,
  passed boolean not null,
  answers jsonb,
  time_taken_seconds integer,
  created_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;

drop policy if exists "Users see own quiz attempts" on public.quiz_attempts;
create policy "Users see own quiz attempts" on public.quiz_attempts
  for select using (user_id = auth.uid());

drop policy if exists "Admins can view all quiz_attempts" on public.quiz_attempts;
create policy "Admins can view all quiz_attempts" on public.quiz_attempts
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Users insert own quiz_attempts" on public.quiz_attempts;
create policy "Users insert own quiz_attempts" on public.quiz_attempts
  for insert with check (user_id = auth.uid());
