-- Run this in Supabase Dashboard → SQL Editor if you get:
--   "Could not find the 'time_taken_seconds' column of 'quiz_attempts' in the schema cache"
-- This adds the column so quiz submissions and attempt history can store time taken.

alter table public.quiz_attempts
  add column if not exists time_taken_seconds integer;
