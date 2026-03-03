import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase client is not configured");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const all = cookieStore.getAll();
        return all.map((c) => ({ name: c.name, value: c.value }));
      }
      // setAll omitted: Server Components cannot set cookies; middleware handles refresh
    },
  });
}

/** Server-only client that bypasses RLS. Use only for trusted server-side writes (e.g. module progress) with validated user id. */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
