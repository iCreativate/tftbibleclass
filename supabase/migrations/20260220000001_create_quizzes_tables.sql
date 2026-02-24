-- Create quizzes, quiz_questions, and quiz_attempts tables (run in Supabase SQL Editor if tables don't exist)

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

create policy "Quizzes visible with module" on public.quizzes
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
      and c.is_published = true
    )
  );

create policy "Admins can view all quizzes" on public.quizzes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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

create policy "Questions visible with quiz" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id
    )
  );

create policy "Admins can view all quiz_questions" on public.quiz_questions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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

create policy "Users see own quiz attempts" on public.quiz_attempts
  for select using (user_id = auth.uid());

create policy "Admins can view all quiz_attempts" on public.quiz_attempts
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Users insert own quiz_attempts" on public.quiz_attempts
  for insert with check (user_id = auth.uid());
