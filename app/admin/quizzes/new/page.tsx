import Link from "next/link";
import { getCoursesForQuizCreate } from "../actions";
import { CreateQuizForm } from "./create-quiz-form";
import { ArrowLeft } from "lucide-react";

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; moduleId?: string }>;
}) {
  const sp = await searchParams;
  const courses = await getCoursesForQuizCreate();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to quizzes
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
          Create quiz
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose the quiz type, assign it to a course and lesson, then create it.
        </p>
      </div>

      <CreateQuizForm courses={courses} initialCourseId={sp.courseId} initialModuleId={sp.moduleId} />
    </div>
  );
}
