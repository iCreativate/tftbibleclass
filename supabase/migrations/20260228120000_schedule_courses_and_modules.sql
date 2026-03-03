-- Schedule when a course or module (topic) is available to students.
-- Null = no restriction (always available within publish window).

alter table public.courses
  add column if not exists available_from timestamptz,
  add column if not exists available_until timestamptz;

alter table public.modules
  add column if not exists available_from timestamptz,
  add column if not exists available_until timestamptz;

comment on column public.courses.available_from is 'When the course becomes visible to students (null = immediately when published).';
comment on column public.courses.available_until is 'When the course stops being visible (null = no end).';
comment on column public.modules.available_from is 'When this topic/lesson becomes available (null = with course).';
comment on column public.modules.available_until is 'When this topic stops being available (null = no end).';
