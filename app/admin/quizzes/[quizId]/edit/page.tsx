import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizWithQuestions, getQuizAttemptsAndStats } from "../../actions";
import { QuizEditorClient } from "./quiz-editor-client";
import { QuizSettingsForm } from "./quiz-settings-form";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function QuizEditPage({ params }: { params: Promise<{ quizId: string }> | { quizId: string } }) {
  const resolved = typeof (params as Promise<{ quizId: string }>).then === "function" ? await (params as Promise<{ quizId: string }>) : (params as { quizId: string });
  const quizId = resolved?.quizId;
  if (!quizId) notFound();
  const [data, attemptsData] = await Promise.all([
    getQuizWithQuestions(quizId),
    getQuizAttemptsAndStats(quizId),
  ]);
  if (!data?.quiz) notFound();

  const { attempts, stats } = attemptsData ?? {
    attempts: [],
    stats: { totalAttempts: 0, averageScorePercent: 0, passRatePercent: 0 },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/quizzes"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Quizzes
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold text-slate-900">
            Edit quiz: {data.quiz.title}
          </h1>
          {data.quiz.description && (
            <p className="mt-1 text-sm text-slate-600">{data.quiz.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.course_id && (
            <>
              <Link
                href={`/student/courses/${data.course_id}/quiz/${quizId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Test quiz
              </Link>
              <Link
                href={`/admin/courses/${data.course_id}/builder`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Course builder
              </Link>
            </>
          )}
        </div>
      </div>

      <QuizSettingsForm
        quizId={quizId}
        initial={{ title: data.quiz.title, description: data.quiz.description, passing_score: data.quiz.passing_score, time_limit_seconds: data.quiz.time_limit_seconds }}
      />

      <QuizEditorClient
        quizId={quizId}
        quizTitle={data.quiz.title}
        initialQuestions={data.questions}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">
          Quiz attempts & performance
        </h2>
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <span className="font-medium text-slate-700">
            Total attempts: <strong>{stats.totalAttempts}</strong>
          </span>
          <span className="text-slate-600">
            Average score: <strong>{stats.averageScorePercent}%</strong>
          </span>
          <span className="text-slate-600">
            Pass rate: <strong>{stats.passRatePercent}%</strong>
          </span>
        </div>
        {attempts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No attempts yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase text-slate-500">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Result</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">
                      {a.student_name ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {a.score} / {a.max_score}
                    </td>
                    <td className="py-2 pr-4">
                      {a.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <XCircle className="h-3.5 w-3.5" /> Not passed
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {a.time_taken_seconds != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.floor(a.time_taken_seconds / 60)}m {a.time_taken_seconds % 60}s
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-slate-500">
                      {new Date(a.created_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
