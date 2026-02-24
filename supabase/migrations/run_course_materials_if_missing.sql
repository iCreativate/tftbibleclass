-- Run this in Supabase Dashboard → SQL Editor if you get "Could not find the table 'public.course_materials'".
-- Requires: public.courses and public.profiles must already exist.

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  file_url text not null,
  format text not null check (format in ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.course_materials enable row level security;

drop policy if exists "Course materials visible with published course" on public.course_materials;
create policy "Course materials visible with published course" on public.course_materials
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

drop policy if exists "Admins can view all course materials" on public.course_materials;
create policy "Admins can view all course materials" on public.course_materials
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Facilitators and admins manage course materials" on public.course_materials;
create policy "Facilitators and admins manage course materials" on public.course_materials
  for all using (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.id = course_id
      where p.id = auth.uid()
      and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );
