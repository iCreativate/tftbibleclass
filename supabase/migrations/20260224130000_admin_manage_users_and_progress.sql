-- Admin support tooling: allow admins to view users and troubleshoot progress.
-- This enables Admin → Users to:
-- - view profiles
-- - view/manage enrollments
-- - view module progress for any user

-- Ensure users can always read their own profile (required for login and requireRole('admin'))
drop policy if exists "Profiles are viewable by owners" on public.profiles;
create policy "Profiles are viewable by owners" on public.profiles
  for select using (auth.uid() = id);

-- PROFILES: admins can view all profiles (and optionally update roles)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ENROLLMENTS: admins can view and manage any enrollment
drop policy if exists "Admins manage all enrollments" on public.enrollments;
create policy "Admins manage all enrollments" on public.enrollments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- MODULE_PROGRESS: admins can view (and manage) progress records for troubleshooting
drop policy if exists "Admins manage all module progress" on public.module_progress;
create policy "Admins manage all module progress" on public.module_progress
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

