-- Run this in Supabase SQL Editor if you get "Could not find table 'public.question_banks'".
-- Requires: public.profiles must exist.

-- ========== QUESTION BANKS ==========
create table if not exists public.question_banks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.question_banks enable row level security;

drop policy if exists "Admins and facilitators view question_banks" on public.question_banks;
create policy "Admins and facilitators view question_banks" on public.question_banks
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

drop policy if exists "Admins and facilitators manage question_banks" on public.question_banks;
create policy "Admins and facilitators manage question_banks" on public.question_banks
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

-- ========== QUESTION BANK QUESTIONS ==========
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

drop policy if exists "Question bank questions visible with bank" on public.question_bank_questions;
create policy "Question bank questions visible with bank" on public.question_bank_questions
  for select using (
    exists (select 1 from public.question_banks b where b.id = question_bank_id)
  );

drop policy if exists "Admins and facilitators manage question_bank_questions" on public.question_bank_questions;
create policy "Admins and facilitators manage question_bank_questions" on public.question_bank_questions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );
