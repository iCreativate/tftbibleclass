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

/** Single message in a thread (student or facilitator). */
export type ThreadMessage = {
  id: string;
  role: "student" | "facilitator";
  body: string;
  created_at: string;
};

/** Note with full thread of messages and topic labels. */
export type NoteWithMessages = NoteMessage & {
  messages: ThreadMessage[];
  course_title: string | null;
  module_title: string | null;
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

/** Get notes with full message threads and course/module titles (for 2-way messaging). */
export async function getMyNotesWithMessages(
  courseId?: string | null,
  moduleId?: string | null
): Promise<NoteWithMessages[]> {
  const notes = await getMyNotes(courseId, moduleId);
  if (notes.length === 0) return [];
  const supabase = createSupabaseServerClient();
  const noteIds = notes.map((n) => n.id);
  const courseIds = [...new Set(notes.map((n) => n.course_id).filter(Boolean))] as string[];
  const moduleIds = [...new Set(notes.map((n) => n.module_id).filter(Boolean))] as string[];
  const [replies, courses, modules] = await Promise.all([
    supabase
      .from("note_messages")
      .select("id, note_id, role, body, created_at")
      .in("note_id", noteIds)
      .order("created_at", { ascending: true }),
    courseIds.length
      ? supabase.from("courses").select("id, title").in("id", courseIds)
      : { data: [] as { id: string; title: string }[] },
    moduleIds.length
      ? supabase.from("modules").select("id, title").in("id", moduleIds)
      : { data: [] as { id: string; title: string }[] },
  ]);
  const titleByCourse = new Map((courses.data ?? []).map((c) => [c.id, c.title]));
  const titleByModule = new Map((modules.data ?? []).map((m) => [m.id, m.title]));
  const repliesByNote = new Map<string, NonNullable<typeof replies.data>>();
  for (const r of replies.data ?? []) {
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
    return {
      ...note,
      messages: thread,
      course_title: note.course_id ? titleByCourse.get(note.course_id) ?? null : null,
      module_title: note.module_id ? titleByModule.get(note.module_id) ?? null : null,
    };
  });
}

/** Add a student reply to an existing note thread. */
export async function addStudentReply(noteId: string, body: string): Promise<{ error?: string }> {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message is required." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("note_messages").insert({
    note_id: noteId,
    author_id: user.id,
    role: "student",
    body: trimmed,
  });
  if (error) return { error: error.message };
  return {};
}

/** Submit a question (creates a note). Course is required; module is optional. */
export async function submitQuestion(
  content: string,
  courseId: string | null,
  moduleId?: string | null
): Promise<{ error?: string }> {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const trimmed = content.trim();
  if (!trimmed) return { error: "Question is required." };
  if (!courseId) return { error: "Please select a course or module." };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    user_id: user.id,
    course_id: courseId,
    module_id: moduleId || null,
    content: trimmed,
  });
  if (error) return { error: error.message };
  return {};
}
