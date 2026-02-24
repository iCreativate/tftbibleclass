-- Storage RLS: allow admins and facilitators to upload to the "materials" bucket.
-- The bucket "materials" must exist (create it in Dashboard: Storage → New bucket, name: materials, Public: On).
-- Without these policies, uploads fail with: "new row violates row-level security policy".

-- Allow authenticated admins and facilitators to INSERT (upload) into materials bucket
drop policy if exists "Admins and facilitators can upload to materials" on storage.objects;
create policy "Admins and facilitators can upload to materials"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'facilitator')
  )
);

-- Allow admins and facilitators to UPDATE/DELETE their uploads (optional, for replace/remove)
drop policy if exists "Admins and facilitators can update materials" on storage.objects;
create policy "Admins and facilitators can update materials"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'materials'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'facilitator')
  )
);

drop policy if exists "Admins and facilitators can delete materials" on storage.objects;
create policy "Admins and facilitators can delete materials"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'materials'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'facilitator')
  )
);

-- Allow public read so getPublicUrl() works for downloads
drop policy if exists "Public read for materials bucket" on storage.objects;
create policy "Public read for materials bucket"
on storage.objects
for select
to public
using (bucket_id = 'materials');
