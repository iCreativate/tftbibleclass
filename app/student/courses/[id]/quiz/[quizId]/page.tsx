import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/server";
import { getCourseForStudent } from "@/lib/courses";
import { getQuizForStudent } from "../actions";
import { TakeQuizClient } from "./take-quiz-client";

type Props = { params: Promise<{ id: string; quizId: string }> };

export default async function StudentTakeQuizPage({ params }: Props) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const { id: courseId, quizId } = await params;

  const course = await getCourseForStudent(courseId, user.id, {
    allowStaffBypass: user.profile?.role === "admin" || user.profile?.role === "facilitator",
  });
  if (!course) notFound();

  const data = await getQuizForStudent(courseId, quizId, user.id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link
          href={`/student/courses/${courseId}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back to {course.title}
        </Link>
      </div>

      <TakeQuizClient
        courseId={courseId}
        quizId={quizId}
        userId={user.id}
        quiz={data.quiz}
        questions={data.questions}
      />
    </div>
  );
}
