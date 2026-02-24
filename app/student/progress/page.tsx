import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { getEnrolledCourses, getCourseCompletionStatus } from "@/lib/courses";
import { ProgressBar } from "@/components/progress-bar";
import { CheckCircle2 } from "lucide-react";

export default async function StudentProgressPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const enrolled = await getEnrolledCourses(user.id);
  const completionStatuses = await Promise.all(
    enrolled.map((c) => getCourseCompletionStatus(user.id, c.id))
  );
  const completedCourses = enrolled.filter((_, i) => completionStatuses[i]?.completed ?? false);
  const activeCourses = enrolled.filter((_, i) => !(completionStatuses[i]?.completed ?? false));

  const overallPercent =
    enrolled.length > 0
      ? Math.round(
          enrolled.reduce((a, c) => a + (c.progressPercent ?? 0), 0) /
            enrolled.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Overall completion
          </p>
          <div className="mt-2">
            <ProgressBar value={overallPercent} />
            <p className="mt-1 text-xs text-slate-500">
              {overallPercent}% across enrolled courses
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Courses enrolled
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {enrolled.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active courses</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Completed
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {completedCourses.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Video + quiz passed</p>
        </div>
      </section>

      {completedCourses.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Completed courses
          </h2>
          <div className="space-y-3">
            {completedCourses.map((course) => (
              <Link
                key={course.id}
                href={`/student/courses/${course.id}`}
                className="block rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm hover:border-emerald-300"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>
                      <span className="block font-medium text-slate-900">{course.title}</span>
                      <span className="block mt-0.5 text-xs text-slate-500">
                        {course.estimated_minutes ? `~${Math.round(course.estimated_minutes / 60)} hr` : ""}
                        {" · Completed"}
                      </span>
                    </span>
                  </span>
                  <ProgressBar value={100} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-slate-900">
          {completedCourses.length > 0 ? "In progress" : "Course progress"}
        </h2>
        {enrolled.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">You’re not enrolled in any courses yet.</p>
            <Link
              href="/student/catalog"
              className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary-700"
            >
              Browse catalog
            </Link>
          </div>
        ) : activeCourses.length === 0 ? (
          <p className="text-sm text-slate-500">All your enrolled courses are completed.</p>
        ) : (
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <Link
                key={course.id}
                href={`/student/courses/${course.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
              >
                <span className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block font-medium text-slate-900">{course.title}</span>
                    <span className="block mt-0.5 text-xs text-slate-500">
                      {course.estimated_minutes
                        ? `~${Math.round(course.estimated_minutes / 60)} hr`
                        : ""}
                    </span>
                  </span>
                  <span className="min-w-[120px] text-right">
                    <ProgressBar value={course.progressPercent ?? 0} />
                    <span className="block mt-1 text-xs text-slate-500">
                      {course.progressPercent ?? 0}%
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
