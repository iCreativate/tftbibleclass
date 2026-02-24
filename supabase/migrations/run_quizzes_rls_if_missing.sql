-- Run this in Supabase Dashboard → SQL Editor if you get "new row violates row-level security policy"
-- when creating a quiz, adding quiz questions, or submitting a quiz attempt.
-- Adds policies so admins and facilitators can manage quizzes/quiz_questions, and users can insert own quiz_attempts.

-- ========== QUIZZES ==========
-- Allow admins to do everything on quizzes
drop policy if exists "Admins manage all quizzes" on public.quizzes;
create policy "Admins manage all quizzes" on public.quizzes
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Allow facilitators to manage quizzes for courses they own (or created_by is null)
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

-- ========== QUIZ_QUESTIONS ==========
-- Allow admins to do everything on quiz_questions (so adding questions never fails for admins)
drop policy if exists "Admins manage all quiz_questions" on public.quiz_questions;
create policy "Admins manage all quiz_questions" on public.quiz_questions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Allow facilitators and admins to manage quiz_questions for quizzes in courses they own
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

-- ========== QUIZ_ATTEMPTS ==========
-- Allow users to insert their own quiz attempts (submit quiz)
drop policy if exists "Users insert own quiz_attempts" on public.quiz_attempts;
create policy "Users insert own quiz_attempts" on public.quiz_attempts
  for insert with check (user_id = auth.uid());
