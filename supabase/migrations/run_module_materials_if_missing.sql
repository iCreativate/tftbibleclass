-- Run this in Supabase Dashboard → SQL Editor if you get "Could not find the table 'public.module_materials'".
-- Requires: public.modules, public.courses, and public.profiles must already exist.

create table if not exists public.module_materials (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  file_url text not null,
  format text not null check (format in ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'pptx')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.module_materials enable row level security;

drop policy if exists "Module materials visible with published course" on public.module_materials;
create policy "Module materials visible with published course" on public.module_materials
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.is_published = true
    )
  );

drop policy if exists "Admins view all module_materials" on public.module_materials;
create policy "Admins view all module_materials" on public.module_materials
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Facilitators and admins manage module_materials" on public.module_materials;
create policy "Facilitators and admins manage module_materials" on public.module_materials
  for all using (
    exists (
      select 1 from public.profiles p
      join public.modules m on m.id = module_id
      join public.courses c on c.id = m.course_id
      where p.id = auth.uid() and p.role in ('facilitator', 'admin')
      and (c.created_by = auth.uid() or c.created_by is null)
    )
  );
