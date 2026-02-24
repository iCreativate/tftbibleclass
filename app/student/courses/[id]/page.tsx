import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import {
  getCourseForStudent,
  getCourseMaterialsForDisplay,
  getCourseModulesForStudent,
  getResumeModuleId,
} from "@/lib/courses";
import { CourseModuleRow } from "./course-module-row";
import { Download, FileText, PlayCircle, ChevronRight } from "lucide-react";

type StudentCoursePageProps = {
  params: { id: string };
  searchParams: Promise<{ message?: string }> | { message?: string };
};

export default async function StudentCourseDetailPage({
  params,
  searchParams,
}: StudentCoursePageProps) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const course = await getCourseForStudent(params.id, user.id);

  if (!course) {
    notFound();
  }

  const materials = await getCourseMaterialsForDisplay(course.id);
  const modules = await getCourseModulesForStudent(course.id, user.id);
  const resumeModuleId = await getResumeModuleId(user.id, course.id);

  const resolvedSearchParams = typeof (searchParams as Promise<{ message?: string }>).then === "function"
    ? await (searchParams as Promise<{ message?: string }>)
    : (searchParams as { message?: string });
  const showCompletePreviousMessage = resolvedSearchParams?.message === "complete_previous";

  return (
    <div className="space-y-5">
      {showCompletePreviousMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Complete each topic in order. Finish the previous topic (and its assessment, if any) to unlock the next.
        </div>
      )}
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Your course
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
          {course.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {course.description ?? ""}
        </p>
      </header>

      <section className="space-y-5">
          {resumeModuleId && modules.some((m) => m.id === resumeModuleId) && (
            <Link
              href={`/student/courses/${course.id}/lessons/${resumeModuleId}`}
              className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 text-left transition hover:border-primary hover:bg-primary/10"
            >
              <PlayCircle className="h-8 w-8 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">Resume where you left off</span>
                <span className="block text-sm text-slate-600">Continue with this lesson</span>
              </span>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-primary" />
            </Link>
          )}

          {modules.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-100 px-4 py-3 font-heading text-lg font-semibold text-slate-900 sm:px-5">
                Curriculum
              </h2>
              <ul className="divide-y divide-slate-100">
                {modules.map((mod, i) => (
                  <CourseModuleRow
                    key={mod.id}
                    courseId={course.id}
                    module={mod}
                    index={i}
                    isLocked={i > 0 && !modules.slice(0, i).every((m) => m.is_complete)}
                  />
                ))}
              </ul>
            </div>
          )}

          {modules.length === 0 && !resumeModuleId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
              <p className="text-sm text-slate-600">
                No lessons in this course yet. Check back later.
              </p>
            </div>
          )}

          {materials.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-primary" />
                Downloadable materials
              </h2>
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <Download className="h-4 w-4 shrink-0 text-primary" />
                      <span>{m.title}</span>
                      <span className="ml-auto rounded bg-slate-200 px-2 py-0.5 text-xs uppercase text-slate-600">
                        {m.format}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

      </section>
    </div>
  );
}
