"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { QUESTION_TYPES } from "./constants";

export type QuestionBankRow = { id: string; title: string; created_at: string };
export type QuestionBankQuestionRow = {
  id: string;
  question_bank_id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  index_in_bank: number;
};

export async function getQuestionBanks(): Promise<QuestionBankRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("question_banks")
    .select("id, title, created_at")
    .order("title");
  return (data ?? []) as QuestionBankRow[];
}

export async function createQuestionBank(title: string): Promise<{ error?: string; id?: string }> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const t = title?.trim() || "New question bank";
  const { data, error } = await supabase
    .from("question_banks")
    .insert({ title: t, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  return { id: data.id };
}

export async function getQuestionBankWithQuestions(bankId: string): Promise<{
  bank: { id: string; title: string } | null;
  questions: QuestionBankQuestionRow[];
}> {
  const supabase = createSupabaseServerClient();
  const { data: bank } = await supabase
    .from("question_banks")
    .select("id, title")
    .eq("id", bankId)
    .single();
  if (!bank) return { bank: null, questions: [] };
  const { data: questions } = await supabase
    .from("question_bank_questions")
    .select("id, question_bank_id, type, prompt, options, correct_answer, points, index_in_bank")
    .eq("question_bank_id", bankId)
    .order("index_in_bank", { ascending: true });
  return { bank: { id: bank.id, title: bank.title }, questions: (questions ?? []) as QuestionBankQuestionRow[] };
}

export async function addQuestionToBank(
  bankId: string,
  payload: {
    type: "mcq" | "boolean" | "short" | "essay" | "fill_in_blank";
    prompt: string;
    options?: string[] | null;
    correct_answer?: string | null;
    points?: number;
  }
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  if (!QUESTION_TYPES.includes(payload.type)) return { error: "Invalid question type." };
  const { data: max } = await supabase
    .from("question_bank_questions")
    .select("index_in_bank")
    .eq("question_bank_id", bankId)
    .order("index_in_bank", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (max?.index_in_bank ?? -1) + 1;
  const { error } = await supabase.from("question_bank_questions").insert({
    question_bank_id: bankId,
    type: payload.type,
    prompt: payload.prompt?.trim() || "Question",
    options: payload.options ?? null,
    correct_answer: payload.correct_answer ?? null,
    points: payload.points ?? 1,
    index_in_bank: nextIndex,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  revalidatePath(`/admin/question-banks/${bankId}`);
  return {};
}

export async function deleteQuestionFromBank(questionId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("question_bank_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  return {};
}
