-- Allow admins and facilitators to view all quizzes (and quiz_questions) so the admin quizzes list shows.
-- Allow enrolled students to view quizzes for their courses so assessments appear on the student dashboard
-- (Assessment badge and Take assessment on course/lesson pages).

-- quizzes: drop old admin-only, create admin+facilitator and enrolled-student policies
drop policy if exists "Admins can view all quizzes" on public.quizzes;
drop policy if exists "Admins and facilitators can view all quizzes" on public.quizzes;
create policy "Admins and facilitators can view all quizzes" on public.quizzes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

drop policy if exists "Enrolled users can view quizzes for their courses" on public.quizzes;
create policy "Enrolled users can view quizzes for their courses" on public.quizzes
  for select using (
    exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id and e.user_id = auth.uid()
      where m.id = module_id
    )
  );

-- quiz_questions: drop old admin-only, create admin+facilitator and enrolled-student policies
drop policy if exists "Admins can view all quiz_questions" on public.quiz_questions;
drop policy if exists "Admins and facilitators can view all quiz_questions" on public.quiz_questions;
create policy "Admins and facilitators can view all quiz_questions" on public.quiz_questions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'facilitator'))
  );

drop policy if exists "Enrolled users can view quiz_questions for their courses" on public.quiz_questions;
create policy "Enrolled users can view quiz_questions for their courses" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      join public.modules m on m.id = q.module_id
      join public.enrollments e on e.course_id = m.course_id and e.user_id = auth.uid()
      where q.id = quiz_id
    )
  );
