# Storage bucket for course materials uploads

The course builder can **upload** course materials (PDF, Word, images) to Supabase Storage. For that to work:

1. **Create the bucket** (once): In **Supabase Dashboard** → **Storage** → **New bucket**. Name: `materials`. Set **Public bucket** to **On**. Create.
2. **Apply RLS policies**: Run the migration `supabase/migrations/20260220130000_storage_materials_policies.sql`. It adds policies so that:
   - Authenticated users with `profiles.role` in `('admin', 'facilitator')` can **INSERT** (upload), **UPDATE**, and **DELETE** in the `materials` bucket.
   - **SELECT** (read) is public so download links work.

If you see **"Upload failed: new row violates row-level security policy"**, the bucket exists but Storage RLS is blocking the upload. Fix by running the migration above (e.g. `supabase db push` or run the SQL in the Dashboard SQL editor).
