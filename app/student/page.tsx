import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { getEnrolledCourses } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { ScriptureHighlighter } from "@/components/scripture-highlighter";

export default async function StudentHomePage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const enrolled = await getEnrolledCourses(user.id);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Welcome back to Bible Class
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-slate-900">
              Your courses
            </h2>
            <p className="text-sm text-slate-600">
              Pick up where you left off or explore the catalog to start a new
              course.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Enrolled
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {enrolled.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Courses you’re currently in
              </p>
            </div>
          </div>
        </div>
        <ScriptureHighlighter
          reference="Psalm 1:2–3"
          text="But his delight is in the law of the Lord, and on his law he meditates day and night..."
        >
          May every lesson move from information to meditation to prayerful
          obedience.
        </ScriptureHighlighter>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-slate-900">
            My courses
          </h2>
          <Link
            href="/student/catalog"
            className="text-sm font-medium text-primary hover:text-primary-700"
          >
            Browse catalog
          </Link>
        </div>
        {enrolled.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">You’re not enrolled in any courses yet.</p>
            <Link
              href="/student/catalog"
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Explore courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {enrolled.map((course) => (
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
                progressPercent={course.progressPercent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
