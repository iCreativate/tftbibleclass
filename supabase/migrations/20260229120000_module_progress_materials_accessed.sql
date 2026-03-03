-- Track when a student has accessed (e.g. downloaded) learner materials for a module.
-- Used to gate quiz access: student must complete video and access materials before taking the quiz.

alter table public.module_progress
  add column if not exists materials_accessed_at timestamptz;

comment on column public.module_progress.materials_accessed_at is 'When the user first accessed/downloaded at least one learner material for this module (used to allow quiz).';
