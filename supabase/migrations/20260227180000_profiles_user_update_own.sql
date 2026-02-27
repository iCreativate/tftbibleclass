-- Allow users to update their own profile (e.g. full_name from sign-up and profile page).
-- Required so register-form upsert and profile settings can save name.

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow users to insert their own profile (trigger usually does this; allows client upsert on sign-up).
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
