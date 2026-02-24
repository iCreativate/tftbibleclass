"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { ASSESSMENT_MODES, type AssessmentMode } from "./constants";

/** Courses for quiz creation dropdown (admin). */
export async function getCoursesForQuizCreate(): Promise<{ id: string; title: string }[]> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title")
    .order("title");
  return (data ?? []) as { id: string; title: string }[];
}

/** Modules (lessons) for a course, for quiz assignment dropdown. */
export async function getModulesByCourseId(courseId: string): Promise<{ id: string; title: string; index_in_course: number }[]> {
  await requireRole("admin");
  if (!courseId) return [];
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("modules")
    .select("id, title, index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: true });
  return (data ?? []) as { id: string; title: string; index_in_course: number }[];
}

/** Create a new quiz assigned to a module (lesson). */
export async function createQuiz(
  moduleId: string,
  payload: {
    title: string;
    description?: string | null;
    assessment_mode?: string;
    passing_score?: number;
    time_limit_seconds?: number | null;
    randomize_questions?: boolean;
  }
): Promise<{ error?: string; id?: string; course_id?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("id, course_id")
    .eq("id", moduleId)
    .single();
  if (!moduleRow) return { error: "Lesson not found." };

  const title = payload.title?.trim() || "New quiz";
  const assessment_mode =
    payload.assessment_mode && ASSESSMENT_MODES.includes(payload.assessment_mode as (typeof ASSESSMENT_MODES)[number])
      ? payload.assessment_mode
      : "practice";

  const baseInsert = {
    module_id: moduleId,
    title,
    description: payload.description?.trim() || null,
    passing_score: payload.passing_score ?? 70,
    time_limit_seconds: payload.time_limit_seconds ?? null,
    randomize_questions: payload.randomize_questions ?? false,
  };

  const { data: inserted, error } = await supabase
    .from("quizzes")
    .insert({ ...baseInsert, assessment_mode })
    .select("id")
    .single();

  if (error && error.message.includes("assessment_mode")) {
    const { data: fallback, error: err2 } = await supabase
      .from("quizzes")
      .insert(baseInsert)
      .select("id")
      .single();
    if (err2) return { error: err2.message };
    revalidatePath("/admin/quizzes");
    revalidatePath(`/admin/courses/${moduleRow.course_id}/builder`);
    return { id: fallback?.id, course_id: moduleRow.course_id };
  }
  if (error) return { error: error.message };

  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/courses/${moduleRow.course_id}/builder`);
  return { id: inserted.id, course_id: moduleRow.course_id };
}

/** Update quiz settings (title, description, passing score, time limit). */
export async function updateQuiz(
  quizId: string,
  payload: {
    title?: string;
    description?: string | null;
    passing_score?: number;
    time_limit_seconds?: number | null;
  }
): Promise<{ error?: string }> {
  await requireRole(["admin", "facilitator"]);
  const supabase = createSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (payload.title != null) updates.title = payload.title.trim() || "Quiz";
  if (payload.description != null) updates.description = payload.description?.trim() || null;
  if (payload.passing_score != null) updates.passing_score = Math.min(100, Math.max(0, payload.passing_score));
  if (payload.time_limit_seconds != null) updates.time_limit_seconds = payload.time_limit_seconds;
  const { error } = await supabase.from("quizzes").update(updates).eq("id", quizId);
  if (error) return { error: error.message };
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quizId}/edit`);
  return {};
}

export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  scripture_reference: string | null;
  explanation: string | null;
  points: number;
  index_in_quiz: number;
};

/** Get quiz with its questions for the editor. */
export async function getQuizWithQuestions(quizId: string): Promise<{
  quiz: { id: string; title: string; description: string | null; module_id: string; passing_score: number; time_limit_seconds: number | null } | null;
  questions: QuizQuestionRow[];
  course_id: string | null;
} | null> {
  await requireRole(["admin", "facilitator"]);
  const supabase = createSupabaseServerClient();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, description, module_id, passing_score, time_limit_seconds")
    .eq("id", quizId)
    .single();
  if (!quiz) return null;
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, quiz_id, type, prompt, options, correct_answer, scripture_reference, explanation, points, index_in_quiz")
    .eq("quiz_id", quizId)
    .order("index_in_quiz", { ascending: true });
  const { data: mod } = await supabase.from("modules").select("course_id").eq("id", quiz.module_id).single();
  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description ?? null,
      module_id: quiz.module_id,
      passing_score: quiz.passing_score ?? 70,
      time_limit_seconds: quiz.time_limit_seconds ?? null,
    },
    questions: (questions ?? []) as QuizQuestionRow[],
    course_id: mod?.course_id ?? null,
  };
}

const QUIZ_Q_TYPES = ["mcq", "single_choice", "boolean", "short", "essay", "fill_in_blank", "file_upload", "match"] as const;

/** Match question correct_answer: { stems: string[], mapping: number[] } (mapping[i] = option index for stem i). */
export type MatchCorrectAnswer = { stems: string[]; mapping: number[] };

/** Normalize correct_answer for DB: fill_in_blank can be string[] (single blank) or string[][] (multi-blank) stored as JSON; match = { stems, mapping }. */
function normalizeCorrectAnswer(
  type: string,
  correct_answer: string | string[] | string[][] | MatchCorrectAnswer | null | undefined
): string | null {
  if (correct_answer == null) return null;
  if (type === "match" && typeof correct_answer === "object" && !Array.isArray(correct_answer) && "stems" in correct_answer && "mapping" in correct_answer) {
    const { stems, mapping } = correct_answer as MatchCorrectAnswer;
    if (!Array.isArray(stems) || !Array.isArray(mapping) || stems.length !== mapping.length) return null;
    const trimmed = { stems: stems.map((s) => String(s).trim()).filter(Boolean), mapping };
    if (trimmed.stems.length === 0) return null;
    return JSON.stringify(trimmed);
  }
  if (type === "mcq" && Array.isArray(correct_answer)) {
    const arr = (correct_answer as string[]).map((s) => String(s).trim()).filter(Boolean);
    if (arr.length === 0) return null;
    if (arr.length === 1) return arr[0];
    return JSON.stringify(arr);
  }
  if (type === "fill_in_blank" && Array.isArray(correct_answer)) {
    if (correct_answer.length === 0) return null;
    const first = correct_answer[0];
    if (Array.isArray(first)) {
      const multi = (correct_answer as string[][]).map((arr) =>
        arr.map((s) => String(s).trim()).filter(Boolean)
      ).filter((arr) => arr.length > 0);
      return multi.length > 0 ? JSON.stringify(multi) : null;
    }
    const single = (correct_answer as string[]).map((s) => String(s).trim()).filter(Boolean);
    if (single.length === 0) return null;
    if (single.length === 1) return single[0];
    return JSON.stringify(single);
  }
  return typeof correct_answer === "string" ? (correct_answer.trim() || null) : null;
}

/** Add a question to a quiz. */
export async function addQuizQuestion(
  quizId: string,
  payload: {
    type: string;
    prompt: string;
    options?: string[] | null;
    correct_answer?: string | string[] | string[][] | MatchCorrectAnswer | null;
    scripture_reference?: string | null;
    explanation?: string | null;
    points?: number;
  }
): Promise<{ error?: string; id?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const type = payload.type?.toLowerCase();
  if (!type || !QUIZ_Q_TYPES.includes(type as (typeof QUIZ_Q_TYPES)[number])) {
    return { error: "Invalid question type. Use: mcq, single_choice, boolean, fill_in_blank, match, essay, file_upload." };
  }
  const { data: max } = await supabase
    .from("quiz_questions")
    .select("index_in_quiz")
    .eq("quiz_id", quizId)
    .order("index_in_quiz", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (max?.index_in_quiz ?? -1) + 1;
  const correctAnswerDb = normalizeCorrectAnswer(type, payload.correct_answer);
  const { data: inserted, error } = await supabase
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      type,
      prompt: payload.prompt?.trim() || "Question",
      options: payload.options ?? null,
      correct_answer: correctAnswerDb,
      scripture_reference: payload.scripture_reference?.trim() || null,
      explanation: payload.explanation?.trim() || null,
      points: payload.points ?? 1,
      index_in_quiz: nextIndex,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quizId}/edit`);
  return { id: inserted.id };
}

/** Update a quiz question. */
export async function updateQuizQuestion(
  questionId: string,
  payload: {
    type?: string;
    prompt?: string;
    options?: string[] | null;
    correct_answer?: string | string[] | string[][] | MatchCorrectAnswer | null;
    scripture_reference?: string | null;
    explanation?: string | null;
    points?: number;
  }
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const updates: Record<string, unknown> = {};
  if (payload.type != null) updates.type = payload.type;
  if (payload.prompt != null) updates.prompt = payload.prompt.trim();
  if (payload.options != null) updates.options = payload.options;
  if (payload.correct_answer != null) {
    let qType = payload.type;
    if (qType == null) {
      const { data: q } = await supabase.from("quiz_questions").select("type").eq("id", questionId).single();
      qType = q?.type ?? "short";
    }
    updates.correct_answer = normalizeCorrectAnswer(qType ?? "short", payload.correct_answer);
  }
  if (payload.scripture_reference != null) updates.scripture_reference = payload.scripture_reference?.trim() || null;
  if (payload.explanation != null) updates.explanation = payload.explanation?.trim() || null;
  if (payload.points != null) updates.points = payload.points;
  const { error } = await supabase.from("quiz_questions").update(updates).eq("id", questionId);
  if (error) return { error: error.message };
  const { data: q } = await supabase.from("quiz_questions").select("quiz_id").eq("id", questionId).single();
  if (q?.quiz_id) revalidatePath(`/admin/quizzes/${q.quiz_id}/edit`);
  revalidatePath("/admin/quizzes");
  return {};
}

/** Delete a quiz question. */
export async function deleteQuizQuestion(questionId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { data: q } = await supabase.from("quiz_questions").select("quiz_id").eq("id", questionId).single();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };
  if (q?.quiz_id) revalidatePath(`/admin/quizzes/${q.quiz_id}/edit`);
  revalidatePath("/admin/quizzes");
  return {};
}

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  score: number;
  max_score: number;
  passed: boolean;
  time_taken_seconds: number | null;
  created_at: string;
};

/** Get attempts and performance stats for a quiz (admin). */
export async function getQuizAttemptsAndStats(quizId: string): Promise<{
  attempts: (QuizAttemptRow & { student_name: string | null })[];
  stats: { totalAttempts: number; averageScorePercent: number; passRatePercent: number };
} | null> {
  await requireRole(["admin", "facilitator"]);
  const supabase = createSupabaseServerClient();
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, score, max_score, passed, time_taken_seconds, created_at")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });
  if (!attempts?.length) {
    return { attempts: [], stats: { totalAttempts: 0, averageScorePercent: 0, passRatePercent: 0 } };
  }
  const userIds = [...new Set(attempts.map((a) => a.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? null]));
  const withNames = attempts.map((a) => ({
    ...a,
    student_name: nameMap.get(a.user_id) ?? null,
  })) as (QuizAttemptRow & { student_name: string | null })[];
  const totalAttempts = attempts.length;
  const withMax = attempts.filter((a) => a.max_score > 0);
  const averageScorePercent =
    withMax.length > 0
      ? Math.round(
          (withMax.reduce((s, a) => s + (a.score / a.max_score) * 100, 0) / withMax.length) * 10
        ) / 10
      : 0;
  const passRatePercent =
    totalAttempts > 0
      ? Math.round((attempts.filter((a) => a.passed).length / totalAttempts) * 1000) / 10
      : 0;
  return {
    attempts: withNames,
    stats: { totalAttempts, averageScorePercent, passRatePercent },
  };
}
