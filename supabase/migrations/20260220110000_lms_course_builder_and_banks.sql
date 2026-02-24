-- LMS: Course builder, lesson bank, question bank, module materials, resume, assignments
-- Run after run_full_schema.sql (or ensure courses, modules, profiles exist).

-- ========== RESUME: last module accessed per enrollment ==========
alter table public.enrollments
  add column if not exists last_accessed_module_id uuid references public.modules(id) on delete set null;

-- Students can update their own enrollment (e.g. last_accessed_module_id for resume)
drop policy if exists "Users can update own enrollment" on public.enrollments;
create policy "Users can update own enrollment" on public.enrollments
  for update using (user_id = auth.uid());

-- ========== MODULE MATERIALS (PDFs, worksheets, slides per lesson) ==========
create table if not exists public.module_materials (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  file_url text not null,
  format text not null check (format in ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'pptx')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.module_materials enable row level security;

create policy "Module materials visible with published course" on public.module_materials
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.is_published = true
    )
  );

create policy "Admins view all module_materials" on public.module_materials
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Facilitators and admins manage module_materials" on public.module_materials
  for all using (
    exists (
      select 1 from public.profiles p
      join public.modules m on m.id = module_id
      join public.courses c on c.id = m.course_id
      where p.id = auth.uid() and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

-- ========== LESSON BANK (reusable lessons across courses) ==========
create table if not exists public.lesson_bank (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  video_url text,
  audio_url text,
  pdf_url text,
  scripture_reference text,
  rich_text jsonb,
  created_at timestamptz not null default now()
);

alter table public.lesson_bank enable row level security;

create policy "Admins and facilitators view lesson_bank" on public.lesson_bank
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

create policy "Admins and facilitators manage lesson_bank" on public.lesson_bank
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- ========== QUESTION BANKS (reusable quiz questions) ==========
create table if not exists public.question_banks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.question_banks enable row level security;

create policy "Admins and facilitators view question_banks" on public.question_banks
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

create policy "Admins and facilitators manage question_banks" on public.question_banks
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

create table if not exists public.question_bank_questions (
  id uuid primary key default gen_random_uuid(),
  question_bank_id uuid not null references public.question_banks(id) on delete cascade,
  type text not null check (type in ('mcq', 'boolean', 'short', 'essay', 'fill_in_blank')),
  prompt text not null,
  options text[],
  correct_answer text,
  scripture_reference text,
  explanation text,
  points integer not null default 1,
  index_in_bank integer not null,
  created_at timestamptz not null default now()
);

alter table public.question_bank_questions enable row level security;

create policy "Question bank questions visible with bank" on public.question_bank_questions
  for select using (
    exists (select 1 from public.question_banks b where b.id = question_bank_id)
  );

create policy "Admins and facilitators manage question_bank_questions" on public.question_bank_questions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- ========== QUIZ: add fill_in_blank question type ==========
alter table public.quiz_questions drop constraint if exists quiz_questions_type_check;
alter table public.quiz_questions add constraint quiz_questions_type_check
  check (type in ('mcq', 'boolean', 'short', 'essay', 'fill_in_blank'));

-- ========== QUIZ ATTEMPTS: time taken (for timed quizzes) ==========
alter table public.quiz_attempts
  add column if not exists time_taken_seconds integer;

-- ========== ASSIGNMENTS (add-on: homework/projects, grading) ==========
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  max_score integer not null default 100,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "Assignments visible with published course" on public.assignments
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

create policy "Admins view all assignments" on public.assignments
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Facilitators and admins manage assignments" on public.assignments
  for all using (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.id = course_id
      where p.id = auth.uid() and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz not null default now(),
  score numeric,
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  unique (assignment_id, user_id)
);

alter table public.assignment_submissions enable row level security;

create policy "Users see own assignment_submissions" on public.assignment_submissions
  for select using (user_id = auth.uid());

create policy "Users submit for self" on public.assignment_submissions
  for insert with check (user_id = auth.uid());

create policy "Users update own submission before graded" on public.assignment_submissions
  for update using (user_id = auth.uid());

create policy "Admins and facilitators view all assignment_submissions" on public.assignment_submissions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

create policy "Admins and facilitators grade assignment_submissions" on public.assignment_submissions
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- Facilitators and admins need to manage quizzes and quiz_questions (insert/update/delete)
drop policy if exists "Facilitators and admins manage quizzes" on public.quizzes;
create policy "Facilitators and admins manage quizzes" on public.quizzes
  for all using (
    exists (
      select 1 from public.profiles p
      join public.modules m on m.id = module_id
      join public.courses c on c.id = m.course_id
      where p.id = auth.uid() and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

drop policy if exists "Facilitators and admins manage quiz_questions" on public.quiz_questions;
create policy "Facilitators and admins manage quiz_questions" on public.quiz_questions
  for all using (
    exists (
      select 1 from public.quizzes q
      join public.modules m on m.id = q.module_id
      join public.courses c on c.id = m.course_id
      join public.profiles p on p.id = auth.uid()
      where q.id = quiz_id and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

-- Students need to insert quiz_attempts
create policy "Users insert own quiz_attempts" on public.quiz_attempts
  for insert with check (user_id = auth.uid());
