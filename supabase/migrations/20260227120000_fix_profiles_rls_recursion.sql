-- Fix infinite recursion: policies on profiles must not query profiles.
-- Use a SECURITY DEFINER function so the role check does not trigger RLS on profiles.

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

comment on function public.get_my_role() is 'Returns the current user profile role without triggering RLS recursion on profiles.';

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.get_my_role() to service_role;

-- Replace policies that caused recursion (they queried profiles from inside profiles RLS).
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (public.get_my_role() = 'admin');

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (public.get_my_role() = 'admin');
