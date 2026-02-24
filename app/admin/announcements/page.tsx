import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadAnnouncements() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export default async function AdminAnnouncementsPage() {
  const announcements = await loadAnnouncements();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          Announcements
        </div>
        {announcements.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-slate-500">No announcements yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Create announcements to share updates with all learners.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {a.body}
                  </p>
                </div>
                <span
                  className={
                    a.is_active
                      ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                      : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500"
                  }
                >
                  {a.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
