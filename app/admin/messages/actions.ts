"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export type NoteForAdmin = {
  id: string;
  user_id: string;
  content: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  course_id: string | null;
  module_id: string | null;
  user_name: string | null;
  course_title: string | null;
  module_title: string | null;
};

export async function getNotesForAdmin(): Promise<NoteForAdmin[]> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("id, user_id, content, admin_response, responded_at, created_at, course_id, module_id")
    .order("created_at", { ascending: false });
  if (!notes?.length) return [];
  const userIds = [...new Set(notes.map((n) => n.user_id))];
  const courseIds = [...new Set(notes.map((n) => n.course_id).filter(Boolean))] as string[];
  const moduleIds = [...new Set(notes.map((n) => n.module_id).filter(Boolean))] as string[];
  const [profiles, courses, modules] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", userIds),
    courseIds.length ? supabase.from("courses").select("id, title").in("id", courseIds) : { data: [] },
    moduleIds.length ? supabase.from("modules").select("id, title").in("id", moduleIds) : { data: [] },
  ]);
  const nameByUser = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name ?? null]));
  const titleByCourse = new Map((courses.data ?? []).map((c) => [c.id, c.title]));
  const titleByModule = new Map((modules.data ?? []).map((m) => [m.id, m.title]));
  return notes.map((n) => ({
    ...n,
    user_name: nameByUser.get(n.user_id) ?? null,
    course_title: n.course_id ? titleByCourse.get(n.course_id) ?? null : null,
    module_title: n.module_id ? titleByModule.get(n.module_id) ?? null : null,
  })) as NoteForAdmin[];
}

export async function respondToNote(noteId: string, adminResponse: string): Promise<{ error?: string }> {
  const user = await requireRole("admin");
  const trimmed = adminResponse.trim();
  if (!trimmed) return { error: "Response is required." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("notes")
    .update({
      admin_response: trimmed,
      responded_at: new Date().toISOString(),
      responded_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId);
  if (error) return { error: error.message };
  return {};
}
