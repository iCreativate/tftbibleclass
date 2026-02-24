import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileCheck } from "lucide-react";

async function loadAssignments() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("assignments")
    .select("id, title, course_id, due_at, max_score")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (!data?.length) return [];
  const courseIds = [...new Set(data.map((a) => a.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds);
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  return data.map((a) => ({
    ...a,
    course_title: courseMap.get(a.course_id)?.title ?? "—",
  }));
}

export default async function AssignmentsPage() {
  const assignments = await loadAssignments();

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Assignments (add-on): create homework or projects per course, then grade student submissions.
      </p>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          Assignments
        </div>
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-5">
            <FileCheck className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No assignments yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Create assignments from a course (or add an assignment builder here).
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <div>
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.course_title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {a.due_at && (
                    <span>Due {new Date(a.due_at).toLocaleDateString()}</span>
                  )}
                  <span>Max {a.max_score} pts</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
