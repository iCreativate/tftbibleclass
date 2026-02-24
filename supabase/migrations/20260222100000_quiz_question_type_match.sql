-- Add "match" question type: match statements (stems) to options (e.g. scripture references).
-- correct_answer stores JSON: { "stems": string[], "mapping": number[] } (mapping[i] = option index for stem i).
-- options column = right column (e.g. scripture refs), one per line.

alter table public.quiz_questions drop constraint if exists quiz_questions_type_check;
alter table public.quiz_questions add constraint quiz_questions_type_check
  check (type in ('mcq', 'boolean', 'short', 'essay', 'fill_in_blank', 'file_upload', 'single_choice', 'match'));

comment on column public.quiz_questions.type is 'mcq, boolean, fill_in_blank, match = auto-graded; essay, file_upload = manual grading.';
