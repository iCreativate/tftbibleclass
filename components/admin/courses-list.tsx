"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Plus, Pencil, LayoutDashboard, Globe, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditCourseForm } from "@/components/admin/edit-course-form";
import { deleteCourse, toggleCoursePublish } from "@/app/admin/courses/actions";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimated_minutes: number;
  is_published: boolean;
  created_at: string;
  available_from: string | null;
  available_until: string | null;
};

export function AdminCoursesList({ courses }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [editCourse, setEditCourse] = useState<CourseRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleTogglePublish(course: CourseRow) {
    setTogglingId(course.id);
    await toggleCoursePublish(course.id);
    setTogglingId(null);
    router.refresh();
  }

  async function handleDelete(course: CourseRow) {
    const ok = window.confirm(
      `Delete “${course.title}”? This will permanently remove the course and its lessons/quizzes/materials.`
    );
    if (!ok) return;

    setDeletingId(course.id);
    const res = await deleteCourse(course.id);
    setDeletingId(null);

    if (res?.error) {
      window.alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-600">
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </p>
        <Button asChild size="sm" className="shadow-sm">
          <Link href="/admin/courses/new" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new course
          </Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-700">All courses</h2>
        </div>
        {courses.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-slate-500">No courses yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Go to &quot;Add new course&quot; to create your first course.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    {course.title}
                  </p>
                  <p className="line-clamp-2 text-[11px] text-slate-600">
                    {course.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {course.difficulty}
                    </span>
                    <span>
                      ~{Math.round((course.estimated_minutes ?? 60) / 60)} hours
                    </span>
                    <span
                      className={
                        course.is_published
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"
                          : "rounded-full bg-amber-50 px-2 py-0.5 text-amber-700"
                      }
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 px-3 text-xs font-medium">
                    <Link href={`/admin/courses/${course.id}/builder`}>
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Build
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                    onClick={() => setEditCourse(course)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={
                      course.is_published
                        ? "h-8 gap-1.5 px-3 text-xs font-medium hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                        : "h-8 gap-1.5 px-3 text-xs font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    }
                    onClick={() => handleTogglePublish(course)}
                    disabled={togglingId === course.id}
                  >
                    {togglingId === course.id ? (
                      <span className="animate-pulse">…</span>
                    ) : course.is_published ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" />
                        Publish
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(course)}
                    disabled={deletingId === course.id}
                  >
                    {deletingId === course.id ? (
                      <span className="animate-pulse">…</span>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-fade-in">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setEditCourse(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Edit course
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Update title, description, difficulty, or estimated time.
            </p>
            <div className="mt-4">
              <EditCourseForm
                course={editCourse}
                onSuccess={() => {
                  setEditCourse(null);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
