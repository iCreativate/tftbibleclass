"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Trash2, X } from "lucide-react";
import {
  adminEnrollUser,
  adminUnenrollUser,
  getUserEnrollmentsWithProgress,
  type AdminCourseOption,
  type AdminUserEnrollmentRow,
} from "@/app/admin/users/actions";

type UserRow = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export function AdminUsersListClient({
  users,
  courses,
}: {
  users: UserRow[];
  courses: AdminCourseOption[];
}) {
  const [activeUser, setActiveUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<AdminUserEnrollmentRow[]>([]);
  const [courseToAdd, setCourseToAdd] = useState<string>("");

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.course_id)),
    [enrollments]
  );

  const availableCourseOptions = useMemo(() => {
    return courses.filter((c) => !enrolledCourseIds.has(c.id));
  }, [courses, enrolledCourseIds]);

  async function openUser(user: UserRow) {
    setActiveUser(user);
    setEnrollments([]);
    setCourseToAdd("");
    setLoading(true);
    try {
      const res = await getUserEnrollmentsWithProgress(user.id);
      if (res.error) {
        window.alert(res.error);
        return;
      }
      setEnrollments(res.enrollments);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!activeUser || !courseToAdd) return;
    setLoading(true);
    try {
      const res = await adminEnrollUser(activeUser.id, courseToAdd);
      if (res?.error) {
        window.alert(res.error);
        return;
      }
      const refreshed = await getUserEnrollmentsWithProgress(activeUser.id);
      if (refreshed.error) window.alert(refreshed.error);
      setEnrollments(refreshed.enrollments);
      setCourseToAdd("");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnenroll(courseId: string, courseTitle: string) {
    if (!activeUser) return;
    const ok = window.confirm(`Remove enrollment from “${courseTitle}”?`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await adminUnenrollUser(activeUser.id, courseId);
      if (res?.error) {
        window.alert(res.error);
        return;
      }
      setEnrollments((prev) => prev.filter((e) => e.course_id !== courseId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:px-5">
          All users
        </div>
        {users.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-slate-500">No users yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Users will appear here when they sign up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {u.full_name || "Unnamed"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Joined{" "}
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      u.role === "admin"
                        ? "rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        : u.role === "facilitator"
                          ? "rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary"
                          : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    }
                  >
                    {u.role}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                    onClick={() => openUser(u)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setActiveUser(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold text-slate-900">
                {activeUser.full_name || "Unnamed"}
              </h2>
              <p className="text-xs text-slate-500">
                User ID: <span className="font-mono">{activeUser.id}</span>
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Enroll in a course</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={courseToAdd}
                  onChange={(e) => setCourseToAdd(e.target.value)}
                  className="h-9 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">Select a course…</option>
                  {availableCourseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.is_published ? "" : "(Draft)"}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={handleEnroll}
                  disabled={!courseToAdd || loading}
                >
                  <UserPlus className="h-4 w-4" />
                  Enroll
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Note: unpublished courses won’t show on the student dashboard.
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Enrollments & progress</h3>
                {loading && <span className="text-xs text-slate-500">Loading…</span>}
              </div>

              {enrollments.length === 0 && !loading ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  This user isn’t enrolled in any courses yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {enrollments.map((e) => (
                    <div key={e.course_id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {e.course_title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {e.course_published ? "Published" : "Draft"} · Enrolled{" "}
                            {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—"}
                          </p>
                          {e.last_accessed_module_title && (
                            <p className="mt-1 text-xs text-slate-500">
                              Last accessed: <span className="font-medium text-slate-700">{e.last_accessed_module_title}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 px-3 text-xs font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleUnenroll(e.course_id, e.course_title)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {e.completed_modules}/{e.total_modules} topics complete
                          </span>
                          <span className="font-medium text-slate-700">{e.progress_percent}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(0, e.progress_percent))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

