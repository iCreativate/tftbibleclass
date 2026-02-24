import { requireRole } from "@/lib/auth/server";
import {
  getPublishedCourses,
  getEnrolledCourses,
  canEnrollInNewCourse,
} from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { EnrollButton } from "@/components/enroll-button";
import { BookOpen } from "lucide-react";

export default async function StudentCatalogPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const [published, enrolled, enrollCheck] = await Promise.all([
    getPublishedCourses(),
    getEnrolledCourses(user.id),
    canEnrollInNewCourse(user.id),
  ]);

  const enrolledIds = new Set(enrolled.map((c) => c.id));
  const canEnroll = enrollCheck.allowed;
  const enrollBlockedReason = enrollCheck.reason;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Course catalog
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
          Explore Bible classes
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Choose a journey through Scripture. Complete your current course before
          enrolling in another.
        </p>
      </header>

      {published.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No courses available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            if (isEnrolled) {
              const enrolledCourse = enrolled.find((c) => c.id === course.id);
              return (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  href={`/student/courses/${course.id}`}
                  title={course.title}
                  description={course.description ?? ""}
                  thumbnailUrl={course.thumbnail_url}
                  difficulty={
                    course.difficulty as "Beginner" | "Intermediate" | "Advanced"
                  }
                  estimatedMinutes={course.estimated_minutes ?? 60}
                  progressPercent={enrolledCourse?.progressPercent}
                />
              );
            }
            return (
              <div
                key={course.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card"
              >
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/40">
                      <BookOpen className="h-12 w-12" strokeWidth={1.25} />
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-soft">
                    {course.difficulty}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="font-heading text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-slate-600 leading-relaxed flex-1">
                    {course.description ?? ""}
                  </p>
                  <div className="mt-auto pt-2">
                    <EnrollButton
                      courseId={course.id}
                      isEnrolled={false}
                      enrollmentBlocked={!canEnroll}
                      enrollmentBlockedReason={canEnroll ? undefined : enrollBlockedReason}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
