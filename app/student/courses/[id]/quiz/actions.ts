"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { awardCertificateIfCompleted, setModuleProgress } from "@/lib/courses";

export type StudentQuizQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  scripture_reference: string | null;
  explanation: string | null;
  points: number;
};

export type StudentQuizData = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    passing_score: number;
    time_limit_seconds: number | null;
  };
  questions: StudentQuizQuestion[];
};

/** Get quiz and questions for a student; verifies enrollment and that quiz belongs to course. Admins and facilitators can open any quiz for testing without enrollment. */
export async function getQuizForStudent(
  courseId: string,
  quizId: string,
  userId: string
): Promise<StudentQuizData | null> {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const supabase = createSupabaseServerClient();

  const isStaff = user.profile?.role === "admin" || user.profile?.role === "facilitator";
  if (!isStaff) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .single();
    if (!enrollment) return null;
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, description, module_id, passing_score, time_limit_seconds")
    .eq("id", quizId)
    .single();
  if (!quiz) return null;

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("course_id")
    .eq("id", quiz.module_id)
    .single();
  if (!moduleRow || moduleRow.course_id !== courseId) return null;

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, type, prompt, options, correct_answer, scripture_reference, explanation, points")
    .eq("quiz_id", quizId)
    .order("index_in_quiz", { ascending: true });

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? null,
      passing_score: quiz.passing_score ?? 70,
      time_limit_seconds: quiz.time_limit_seconds ?? null,
    },
    questions: (questions ?? []) as StudentQuizQuestion[],
  };
}

/** Submit a quiz attempt: compute score for auto-graded questions, save attempt. */
export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: Record<string, string | string[]>,
  timeTakenSeconds: number
): Promise<{ error?: string; attemptId?: string }> {
  await requireRole(["student", "facilitator", "admin"]);
  const supabase = createSupabaseServerClient();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, type, correct_answer, points")
    .eq("quiz_id", quizId);
  if (!questions?.length) return { error: "Quiz has no questions." };

  const autoTypes = ["mcq", "single_choice", "boolean", "fill_in_blank", "short", "match"];
  let score = 0;
  let maxScore = 0;
  for (const q of questions) {
    maxScore += q.points ?? 1;
    if (!autoTypes.includes(q.type)) continue;
    const correctRaw = q.correct_answer ?? "";
    let isCorrect = false;

    if (q.type === "match" && typeof correctRaw === "string" && correctRaw.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(correctRaw) as { stems: string[]; mapping: number[] };
        if (Array.isArray(parsed?.stems) && Array.isArray(parsed?.mapping) && parsed.stems.length === parsed.mapping.length) {
          const raw = answers[q.id];
          const studentArr = Array.isArray(raw) ? raw : [];
          const studentMapping = parsed.stems.map((_, i) => parseInt(String(studentArr[i] ?? ""), 10));
          isCorrect =
            studentMapping.length === parsed.mapping.length &&
            studentMapping.every((val, i) => !Number.isNaN(val) && val === parsed.mapping[i]);
        }
      } catch {
        /* ignore */
      }
    } else if (q.type === "boolean") {
      const raw = answers[q.id];
      const answer = Array.isArray(raw) ? raw[0] : raw;
      const given = String(answer ?? "").trim().toLowerCase();
      isCorrect = given === correctRaw.trim().toLowerCase();
    } else if (q.type === "fill_in_blank" && typeof correctRaw === "string" && correctRaw.trimStart().startsWith("[")) {
      try {
        const parsed = JSON.parse(correctRaw) as string[] | string[][];
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
          const acceptedPerBlank = (parsed as string[][]).map((arr) =>
            arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
          );
          const raw = answers[q.id];
          const studentArr = Array.isArray(raw) ? raw : raw != null && raw !== "" ? [raw] : [];
          isCorrect =
            studentArr.length === acceptedPerBlank.length &&
            acceptedPerBlank.every((accepted, i) => {
              const given = String(studentArr[i] ?? "").trim().toLowerCase();
              return accepted.length > 0 && accepted.includes(given);
            });
        } else {
          const accepted = (parsed as string[]).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
          const raw = answers[q.id];
          const answer = Array.isArray(raw) ? raw[0] : raw;
          const given = String(answer ?? "").trim().toLowerCase();
          isCorrect = accepted.length > 0 && accepted.includes(given);
        }
      } catch {
        const raw = answers[q.id];
        const answer = Array.isArray(raw) ? raw[0] : raw;
        const given = String(answer ?? "").trim().toLowerCase();
        isCorrect = given === correctRaw.trim().toLowerCase();
      }
    } else if (q.type === "mcq") {
      const raw = answers[q.id];
      const studentArr = Array.isArray(raw) ? raw : raw != null && raw !== "" ? [raw] : [];
      const studentSet = new Set(studentArr.map((s) => String(s).trim().toLowerCase()).filter(Boolean));
      if (correctRaw.trimStart().startsWith("[")) {
        try {
          const correctArr = JSON.parse(correctRaw) as string[];
          const correctSet = new Set((correctArr ?? []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
          isCorrect = correctSet.size > 0 && studentSet.size === correctSet.size && [...studentSet].every((s) => correctSet.has(s));
        } catch {
          const given = [...studentSet][0] ?? "";
          isCorrect = given === correctRaw.trim().toLowerCase();
        }
      } else {
        const given = [...studentSet][0] ?? "";
        isCorrect = given === correctRaw.trim().toLowerCase();
      }
    } else if (q.type === "single_choice" || q.type === "short") {
      const raw = answers[q.id];
      const answer = Array.isArray(raw) ? raw[0] : raw;
      const given = String(answer ?? "").trim().toLowerCase();
      isCorrect = given === correctRaw.trim().toLowerCase();
    }

    if (isCorrect) score += q.points ?? 1;
  }

  const passingScorePercent = await (async () => {
    const { data: q } = await supabase
      .from("quizzes")
      .select("passing_score")
      .eq("id", quizId)
      .single();
    return (q?.passing_score ?? 70) / 100;
  })();
  const passed = maxScore > 0 && score / maxScore >= passingScorePercent;

  const { data: inserted, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      max_score: maxScore,
      passed,
      answers: answers as unknown as Record<string, unknown>,
      time_taken_seconds: timeTakenSeconds,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("module_id")
    .eq("id", quizId)
    .single();
  if (quizRow?.module_id) {
    if (passed) {
      await setModuleProgress(userId, quizRow.module_id, 100);
    }
    const { data: moduleRow } = await supabase
      .from("modules")
      .select("course_id")
      .eq("id", quizRow.module_id)
      .single();
    if (moduleRow?.course_id) {
      await awardCertificateIfCompleted(userId, moduleRow.course_id);
    }
  }

  return { attemptId: inserted.id };
}
