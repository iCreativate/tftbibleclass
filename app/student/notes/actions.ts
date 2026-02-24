"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export type NoteMessage = {
  id: string;
  content: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  course_id: string | null;
  module_id: string | null;
};

/** Get current user's notes (questions). Optionally filter by course and module. */
export async function getMyNotes(
  courseId?: string | null,
  moduleId?: string | null
): Promise<NoteMessage[]> {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("notes")
    .select("id, content, admin_response, responded_at, created_at, course_id, module_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (courseId) query = query.eq("course_id", courseId);
  if (moduleId) query = query.eq("module_id", moduleId);
  const { data } = await query;
  return (data ?? []) as NoteMessage[];
}

/** Submit a question (creates a note). Appears on messages page and is visible to admin for response. */
export async function submitQuestion(
  content: string,
  courseId?: string | null,
  moduleId?: string | null
): Promise<{ error?: string }> {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const trimmed = content.trim();
  if (!trimmed) return { error: "Question is required." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    user_id: user.id,
    course_id: courseId || null,
    module_id: moduleId || null,
    content: trimmed,
  });
  if (error) return { error: error.message };
  return {};
}
