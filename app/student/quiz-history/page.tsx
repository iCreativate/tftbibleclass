import { requireRole } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default async function QuizHistoryPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const supabase = createSupabaseServerClient();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, score, max_score, passed, time_taken_seconds, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!attempts?.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">No quiz attempts yet.</p>
        <p className="mt-1 text-xs text-slate-500">When you take quizzes in your courses, they will appear here.</p>
      </div>
    );
  }

  const quizIds = [...new Set(attempts.map((a) => a.quiz_id))];
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, module_id")
    .in("id", quizIds);
  const moduleIds = [...new Set((quizzes ?? []).map((q) => q.module_id))];
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, course_id")
    .in("id", moduleIds);
  const courseIds = [...new Set((modules ?? []).map((m) => m.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const quizMap = new Map((quizzes ?? []).map((q) => [q.id, q]));
  const moduleMap = new Map((modules ?? []).map((m) => [m.id, m]));
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Your quiz attempts and scores. Timed quizzes show duration.
      </p>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          Quiz history
        </div>
        <ul className="divide-y divide-slate-100">
          {attempts.map((a) => {
            const quiz = quizMap.get(a.quiz_id);
            const mod = quiz ? moduleMap.get(quiz.module_id) : null;
            const course = mod ? courseMap.get(mod.course_id) : null;
            const date = new Date(a.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div>
                  <p className="font-medium text-slate-900">{quiz?.title ?? "Quiz"}</p>
                  <p className="text-xs text-slate-500">
                    {course?.title}
                    {mod?.title ? ` · ${mod.title}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.time_taken_seconds != null && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.floor(a.time_taken_seconds / 60)}m {a.time_taken_seconds % 60}s
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {a.score} / {a.max_score}
                  </span>
                  {a.passed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <XCircle className="h-3.5 w-3.5" />
                      Not passed
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{date}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
