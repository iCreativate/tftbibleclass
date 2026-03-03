"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export type ThreadMessage = {
  id: string;
  role: "student" | "facilitator";
  body: string;
  created_at: string;
};

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

export type NoteForAdminWithMessages = NoteForAdmin & {
  messages: ThreadMessage[];
};

export async function getNotesForAdmin(): Promise<NoteForAdmin[]> {
  await requireRole(["admin", "facilitator"]);
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

/** Get notes with full message threads for admin/facilitator. */
export async function getNotesForAdminWithMessages(): Promise<NoteForAdminWithMessages[]> {
  const notes = await getNotesForAdmin();
  if (notes.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const { data: replies } = await supabase
    .from("note_messages")
    .select("id, note_id, role, body, created_at")
    .in("note_id", notes.map((n) => n.id))
    .order("created_at", { ascending: true });
  const repliesByNote = new Map<string, NonNullable<typeof replies>>();
  for (const r of replies ?? []) {
    const list = repliesByNote.get(r.note_id) ?? [];
    list.push(r);
    repliesByNote.set(r.note_id, list);
  }
  return notes.map((note) => {
    const thread: ThreadMessage[] = [
      { id: `${note.id}-q`, role: "student", body: note.content, created_at: note.created_at },
    ];
    if (note.admin_response && note.responded_at) {
      thread.push({
        id: `${note.id}-a`,
        role: "facilitator",
        body: note.admin_response,
        created_at: note.responded_at,
      });
    }
    const extra = repliesByNote.get(note.id) ?? [];
    for (const e of extra) {
      thread.push({
        id: e.id,
        role: e.role as "student" | "facilitator",
        body: e.body,
        created_at: e.created_at,
      });
    }
    return { ...note, messages: thread };
  });
}

/** First response on a note (sets admin_response on notes table). */
export async function respondToNote(noteId: string, adminResponse: string): Promise<{ error?: string }> {
  const user = await requireRole(["admin", "facilitator"]);
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
  revalidatePath("/admin/messages");
  return {};
}

/** Add another facilitator reply to a note thread. */
export async function addFacilitatorReply(noteId: string, body: string): Promise<{ error?: string }> {
  const user = await requireRole(["admin", "facilitator"]);
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message is required." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("note_messages").insert({
    note_id: noteId,
    author_id: user.id,
    role: "facilitator",
    body: trimmed,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/messages");
  return {};
}
