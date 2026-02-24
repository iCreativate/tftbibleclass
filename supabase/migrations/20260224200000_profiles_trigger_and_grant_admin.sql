-- 1) Auto-create a profile for every new auth user (and backfill existing users).
-- 2) Helper: select grant_admin('your@email.com'); to set role = 'admin'.

-- Trigger function: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger on auth.users (drop first if re-running)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: ensure every existing auth user has a profile
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  'student'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- One-line helper to grant admin: run in SQL Editor as: select grant_admin('your@email.com');
create or replace function public.grant_admin(user_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = user_email limit 1;
  if uid is null then
    return 'User not found: ' || user_email;
  end if;
  insert into public.profiles (id, full_name, role)
  select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), 'admin'
  from auth.users u
  where u.id = uid
  on conflict (id) do update set role = 'admin';
  return 'Granted admin to: ' || user_email;
end;
$$;
