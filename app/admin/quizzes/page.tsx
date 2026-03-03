import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { Plus, Pencil, Eye, Play } from "lucide-react";
import { DeleteQuizButton } from "./delete-quiz-button";

async function loadQuizzes() {
  const supabase = createSupabaseServerClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id, title, description, passing_score, time_limit_seconds, randomize_questions")
    .order("title");

  if (!quizzes?.length) return [];

  const moduleIds = [...new Set(quizzes.map((q) => q.module_id))];
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, title")
    .in("id", moduleIds);

  const courseIds = [...new Set((modules ?? []).map((m) => m.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const { data: questionCounts } = await supabase
    .from("quiz_questions")
    .select("quiz_id");

  const { data: attemptCounts } = await supabase
    .from("quiz_attempts")
    .select("quiz_id");

  const moduleMap = new Map((modules ?? []).map((m) => [m.id, m]));
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const questionsByQuiz = (questionCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.quiz_id] = (acc[row.quiz_id] ?? 0) + 1;
    return acc;
  }, {});
  const attemptsByQuiz = (attemptCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.quiz_id] = (acc[row.quiz_id] ?? 0) + 1;
    return acc;
  }, {});

  return quizzes.map((q) => {
    const mod = moduleMap.get(q.module_id);
    const course = mod ? courseMap.get(mod.course_id) : null;
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      passing_score: q.passing_score,
      time_limit_seconds: q.time_limit_seconds,
      randomize_questions: q.randomize_questions,
      module_title: mod?.title ?? "—",
      course_title: course?.title ?? "—",
      course_id: course?.id,
      question_count: questionsByQuiz[q.id] ?? 0,
      attempt_count: attemptsByQuiz[q.id] ?? 0,
    };
  });
}

export default async function AdminQuizzesPage() {
  await requireRole(["admin", "facilitator"]);
  const quizzes = await loadQuizzes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
        </p>
        <Link
          href="/admin/quizzes/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create quiz
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          All quizzes & assessments
        </div>
        {quizzes.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-slate-500">No quizzes yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Quizzes are attached to modules. Create a course, add modules, then add
              quizzes from the course editor (or a future quiz builder).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/quizzes/${quiz.id}/edit`}
                    className="font-medium text-slate-900 hover:text-primary hover:underline"
                  >
                    {quiz.title}
                  </Link>
                  {quiz.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {quiz.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{quiz.course_title}</span>
                    <span aria-hidden>·</span>
                    <span>{quiz.module_title}</span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4">
                  <div className="text-right text-xs">
                    <p className="font-medium text-slate-700">{quiz.question_count} questions</p>
                    <p className="text-slate-500">{quiz.attempt_count} attempts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      Pass: {quiz.passing_score}%
                    </span>
                    {quiz.time_limit_seconds ? (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {Math.round(quiz.time_limit_seconds / 60)} min
                      </span>
                    ) : null}
                    <Link
                      href={`/admin/quizzes/${quiz.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      title="View and edit quiz"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <Link
                      href={`/admin/quizzes/${quiz.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      title="Edit questions"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    {quiz.course_id && (
                      <Link
                        href={`/student/courses/${quiz.course_id}/quiz/${quiz.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                        title="Take quiz as a test"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Test
                      </Link>
                    )}
                    <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
