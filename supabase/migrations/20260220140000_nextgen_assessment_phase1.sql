-- Next-Gen Assessment System — Phase 1
-- Skill tagging, question metadata, weighted skill scoring, mastery tracking.
-- Run after quizzes / quiz_questions / quiz_attempts exist.
-- Requires: public.quizzes, public.quiz_questions, public.quiz_attempts, public.courses, public.profiles.

-- ========== 1. SKILL TAGS (for skill-based scoring and mastery) ==========
create table if not exists public.skill_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  course_id uuid references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, course_id)
);

comment on table public.skill_tags is 'Skills assessed by quizzes. course_id null = global skill.';

alter table public.skill_tags enable row level security;

drop policy if exists "Skill tags visible with course or global" on public.skill_tags;
create policy "Skill tags visible with course or global" on public.skill_tags
  for select using (
    course_id is null
    or exists (select 1 from public.courses c where c.id = course_id and c.is_published = true)
  );

drop policy if exists "Admins view all skill_tags" on public.skill_tags;
create policy "Admins view all skill_tags" on public.skill_tags
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Facilitators and admins manage skill_tags" on public.skill_tags;
create policy "Facilitators and admins manage skill_tags" on public.skill_tags
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('facilitator', 'admin')
    )
  );

-- ========== 2. QUIZ QUESTION METADATA (difficulty, Bloom, time, topic) ==========
alter table public.quiz_questions
  add column if not exists difficulty integer check (difficulty >= 1 and difficulty <= 5),
  add column if not exists bloom_level text check (bloom_level in ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  add column if not exists estimated_time_seconds integer,
  add column if not exists topic_category text,
  add column if not exists cognitive_category text;

comment on column public.quiz_questions.difficulty is '1–5 scale for adaptive logic.';
comment on column public.quiz_questions.bloom_level is 'Bloom taxonomy level.';
comment on column public.quiz_questions.points is 'Weight for weighted scoring (same as before).';

-- ========== 3. QUESTION ↔ SKILL (many-to-many) ==========
create table if not exists public.quiz_question_skills (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  skill_tag_id uuid not null references public.skill_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (question_id, skill_tag_id)
);

alter table public.quiz_question_skills enable row level security;

drop policy if exists "Question skills visible with quiz" on public.quiz_question_skills;
create policy "Question skills visible with quiz" on public.quiz_question_skills
  for select using (
    exists (
      select 1 from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      join public.modules m on m.id = q.module_id
      join public.courses c on c.id = m.course_id
      where qq.id = question_id and c.is_published = true
    )
  );

drop policy if exists "Admins manage quiz_question_skills" on public.quiz_question_skills;
create policy "Admins manage quiz_question_skills" on public.quiz_question_skills
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Facilitators manage quiz_question_skills" on public.quiz_question_skills;
create policy "Facilitators manage quiz_question_skills" on public.quiz_question_skills
  for all using (
    exists (
      select 1 from public.quiz_questions qq
      join public.quizzes q on q.id = qq.quiz_id
      join public.modules m on m.id = q.module_id
      join public.courses c on c.id = m.course_id
      join public.profiles p on p.id = auth.uid()
      where qq.id = question_id and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );

-- ========== 4. ASSESSMENT MODE on quizzes (practice | mastery | exam | diagnostic) ==========
alter table public.quizzes
  add column if not exists assessment_mode text not null default 'practice'
    check (assessment_mode in ('diagnostic', 'practice', 'mastery', 'exam'));

comment on column public.quizzes.assessment_mode is 'diagnostic=pre-course level; practice=unlimited attempts; mastery=must hit threshold; exam=locked, timed, secure.';

-- ========== 5. SKILL MASTERY (per user per skill, optional per course) ==========
create table if not exists public.skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_tag_id uuid not null references public.skill_tags(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  mastery_percent numeric(5,2) not null default 0 check (mastery_percent >= 0 and mastery_percent <= 100),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_tag_id, course_id)
);

comment on table public.skill_mastery is 'Mastery % per skill (and optionally per course). Updated from attempt skill scores.';

alter table public.skill_mastery enable row level security;

drop policy if exists "Users see own skill_mastery" on public.skill_mastery;
create policy "Users see own skill_mastery" on public.skill_mastery
  for select using (user_id = auth.uid());

drop policy if exists "Users update own skill_mastery" on public.skill_mastery;
create policy "Users update own skill_mastery" on public.skill_mastery
  for all using (user_id = auth.uid());

drop policy if exists "Admins view all skill_mastery" on public.skill_mastery;
create policy "Admins view all skill_mastery" on public.skill_mastery
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ========== 6. ATTEMPT SKILL SCORES (per-attempt breakdown by skill) ==========
create table if not exists public.quiz_attempt_skill_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  skill_tag_id uuid not null references public.skill_tags(id) on delete cascade,
  score numeric not null default 0,
  max_score numeric not null default 0,
  mastery_percent numeric(5,2) check (mastery_percent is null or (mastery_percent >= 0 and mastery_percent <= 100)),
  created_at timestamptz not null default now(),
  unique (attempt_id, skill_tag_id)
);

comment on table public.quiz_attempt_skill_scores is 'Per-skill score for each attempt; used for weighted skill-based reporting and mastery updates.';

alter table public.quiz_attempt_skill_scores enable row level security;

drop policy if exists "Users see own attempt_skill_scores" on public.quiz_attempt_skill_scores;
create policy "Users see own attempt_skill_scores" on public.quiz_attempt_skill_scores
  for select using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );

drop policy if exists "Users insert own attempt_skill_scores" on public.quiz_attempt_skill_scores;
create policy "Users insert own attempt_skill_scores" on public.quiz_attempt_skill_scores
  for insert with check (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );

drop policy if exists "Admins view all quiz_attempt_skill_scores" on public.quiz_attempt_skill_scores;
create policy "Admins view all quiz_attempt_skill_scores" on public.quiz_attempt_skill_scores
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ========== 7. ADAPTIVE LOGIC RULES (Phase 2 – structure only) ==========
create table if not exists public.adaptive_logic_rules (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  rule_type text not null,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.adaptive_logic_rules is 'Phase 2: rules for adaptive question delivery (e.g. difficulty step based on previous answer).';

alter table public.adaptive_logic_rules enable row level security;

drop policy if exists "Admins manage adaptive_logic_rules" on public.adaptive_logic_rules;
create policy "Admins manage adaptive_logic_rules" on public.adaptive_logic_rules
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ========== 8. MASTERY THRESHOLDS (reference / future certs) ==========
-- Beginner 0–50%, Developing 51–75%, Proficient 76–90%, Mastery 91–100%
-- No table needed; use in app logic. Optional: add column certificates.mastery_skills jsonb later.
