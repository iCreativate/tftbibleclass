-- Returns (module_id, quiz_id) for quizzes in modules that belong to courses the current user is enrolled in.
-- Used by the app so the student dashboard shows Assessment badges and Take assessment regardless of RLS.
-- SECURITY DEFINER allows reading quizzes; the function restricts to enrolled courses only.

create or replace function public.get_quizzes_for_enrolled_modules(p_module_ids uuid[])
returns table(module_id uuid, quiz_id uuid)
language sql
security definer
set search_path = public
as $$
  select q.module_id, q.id as quiz_id
  from public.quizzes q
  where q.module_id = any(p_module_ids)
  and exists (
    select 1 from public.modules m
    join public.enrollments e on e.course_id = m.course_id and e.user_id = auth.uid()
    where m.id = q.module_id
  );
$$;

comment on function public.get_quizzes_for_enrolled_modules(uuid[]) is
  'Returns quiz ids for given module ids when the current user is enrolled in those modules'' courses. Used for student course/lesson pages.';

grant execute on function public.get_quizzes_for_enrolled_modules(uuid[]) to authenticated;
grant execute on function public.get_quizzes_for_enrolled_modules(uuid[]) to service_role;

-- Single module: returns quiz id if the user is enrolled in the course that contains this module.
create or replace function public.get_quiz_id_for_enrolled_module(p_module_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select q.id
  from public.quizzes q
  where q.module_id = p_module_id
  and exists (
    select 1 from public.modules m
    join public.enrollments e on e.course_id = m.course_id and e.user_id = auth.uid()
    where m.id = q.module_id
  )
  limit 1;
$$;

comment on function public.get_quiz_id_for_enrolled_module(uuid) is
  'Returns the quiz id for a module when the current user is enrolled in that module''s course.';

grant execute on function public.get_quiz_id_for_enrolled_module(uuid) to authenticated;
grant execute on function public.get_quiz_id_for_enrolled_module(uuid) to service_role;
