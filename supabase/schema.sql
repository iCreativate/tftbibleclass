create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'facilitator', 'admin')),
  preferred_translation text,
  notifications text,
  timezone text,
  profile_photo_mode text,
  study_reminders text,
  theme text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owners" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  difficulty text not null default 'Beginner',
  estimated_minutes integer not null default 60,
  thumbnail_url text,
  created_by uuid references public.profiles(id),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Published courses are viewable" on public.courses
  for select using (is_published = true);

create policy "Facilitators manage own courses" on public.courses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('facilitator', 'admin')
      and (created_by = auth.uid() or created_by is null)
    )
  );

create policy "Admins can view all courses" on public.courses
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  file_url text not null,
  format text not null check (format in ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.course_materials enable row level security;

create policy "Course materials visible with published course" on public.course_materials
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

create policy "Admins can view all course materials" on public.course_materials
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Facilitators and admins manage course materials" on public.course_materials
  for all using (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.id = course_id
      where p.id = auth.uid()
      and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Users see own enrollments" on public.enrollments
  for select using (user_id = auth.uid());

create policy "Users can enroll themselves" on public.enrollments
  for insert with check (user_id = auth.uid());

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  completed boolean not null default false,
  progress_percent numeric not null default 0,
  last_accessed_at timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.module_progress enable row level security;

create policy "Users track own module progress" on public.module_progress
  for all using (user_id = auth.uid());

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

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  scripture_reference text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users manage own notes" on public.notes
  for all using (user_id = auth.uid());

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "Active announcements visible" on public.announcements
  for select using (is_active = true);
