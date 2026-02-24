import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { AdminUsersListClient } from "@/components/admin/users-list-client";

async function loadUsers() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return data ?? [];
}

export default async function AdminUsersPage() {
  await requireRole("admin");
  const users = await loadUsers();
  const supabase = createSupabaseServerClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, is_published")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>
      <AdminUsersListClient users={users as any} courses={(courses ?? []) as any} />
    </div>
  );
}
