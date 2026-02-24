import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { getEnrolledCourses } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";

export default async function StudentCoursesPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const enrolled = await getEnrolledCourses(user.id);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Courses you’re enrolled in. Pick up where you left off or revisit
        completed modules.
      </p>
      {enrolled.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">You’re not enrolled in any courses yet.</p>
          <Link
            href="/student/catalog"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Browse catalog
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
    </div>
  );
}
