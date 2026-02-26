import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import {
  getCourseForStudent,
  getCourseProgressPercent,
  getEnrolledCoursesWithModules,
} from "@/lib/courses";
import { StudentCourseSidebar } from "@/components/student-course-sidebar";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export default async function StudentCourseLayout({ params, children }: Props) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const { id: courseId } = await params;
  const [course, coursesWithModules] = await Promise.all([
    getCourseForStudent(courseId, user.id),
    getEnrolledCoursesWithModules(user.id),
  ]);

  if (!course) {
    notFound();
  }

  const progressPercent = await getCourseProgressPercent(user.id, course.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="min-w-0 space-y-6">
        {children}
      </div>
      <StudentCourseSidebar
        title={course.title}
        difficulty={course.difficulty}
        estimatedMinutes={course.estimated_minutes ?? 60}
        progressPercent={progressPercent}
        courseId={courseId}
        coursesWithModules={coursesWithModules}
      />
    </div>
  );
}
