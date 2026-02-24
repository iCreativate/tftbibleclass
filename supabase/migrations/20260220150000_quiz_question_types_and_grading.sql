-- Add file_upload question type (manual grading) and ensure all grading types are supported.
-- Run after quiz_questions table exists.

alter table public.quiz_questions drop constraint if exists quiz_questions_type_check;
alter table public.quiz_questions add constraint quiz_questions_type_check
  check (type in ('mcq', 'boolean', 'short', 'essay', 'fill_in_blank', 'file_upload', 'single_choice'));

comment on column public.quiz_questions.type is 'mcq, boolean, fill_in_blank = auto-graded; essay, file_upload = manual grading (instructor review).';
