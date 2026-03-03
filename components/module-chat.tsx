"use client";

import { useState, FormEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMyNotesWithMessages,
  submitQuestion,
  addStudentReply,
  type NoteWithMessages,
} from "@/app/student/notes/actions";

export type CourseWithModules = {
  id: string;
  title: string;
  modules: { id: string; title: string }[];
};

type ModuleChatProps = {
  courseTitle: string;
  courseId?: string | null;
  moduleId?: string | null;
  /** When provided, new questions require selecting course (and optional module). If empty, form is disabled. */
  coursesWithModules?: CourseWithModules[];
};

export function ModuleChat(props: ModuleChatProps) {
  const pathname = usePathname();
  const [threads, setThreads] = useState<NoteWithMessages[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [replyByNoteId, setReplyByNoteId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingNoteId, setSendingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseId = props.courseId ?? null;
  const moduleId =
    courseId && pathname?.includes("/lessons/")
      ? pathname.split("/lessons/")[1]?.split("/")[0] ?? null
      : null;

  const coursesWithModules = props.coursesWithModules ?? [];
  const hasCourses = coursesWithModules.length > 0;
  const selectedCourse = coursesWithModules.find((c) => c.id === selectedCourseId);
  const modulesForSelected = selectedCourse?.modules ?? [];

  useEffect(() => {
    if (props.courseId && !selectedCourseId && coursesWithModules.length > 0) {
      setSelectedCourseId(props.courseId);
      const pathModule =
        pathname?.includes("/lessons/") ? pathname.split("/lessons/")[1]?.split("/")[0] ?? null : null;
      if (pathModule) setSelectedModuleId(pathModule);
      else if (props.moduleId) setSelectedModuleId(props.moduleId);
    }
  }, [props.courseId, props.moduleId, coursesWithModules.length, selectedCourseId, pathname]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyNotesWithMessages(courseId, moduleId).then((data) => {
      if (cancelled) return;
      const sorted = [...data].sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.created_at ?? a.created_at;
        const bLast = b.messages[b.messages.length - 1]?.created_at ?? b.created_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
      setThreads(sorted);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId, moduleId]);

  async function handleNewQuestion(event: FormEvent) {
    event.preventDefault();
    const trimmed = newQuestion.trim();
    if (!trimmed || sending || !hasCourses) return;
    const topicCourseId = selectedCourseId || null;
    if (!topicCourseId) return;
    setError(null);
    setSending(true);
    try {
      const result = await submitQuestion(
        trimmed,
        topicCourseId,
        selectedModuleId || null
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setNewQuestion("");
      const data = await getMyNotesWithMessages(courseId, moduleId);
      const sorted = [...data].sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.created_at ?? a.created_at;
        const bLast = b.messages[b.messages.length - 1]?.created_at ?? b.created_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
      setThreads(sorted);
    } finally {
      setSending(false);
    }
  }

  async function handleReply(noteId: string) {
    const body = replyByNoteId[noteId]?.trim();
    if (!body || sendingNoteId) return;
    setError(null);
    setSendingNoteId(noteId);
    try {
      const result = await addStudentReply(noteId, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReplyByNoteId((prev) => ({ ...prev, [noteId]: "" }));
      const data = await getMyNotesWithMessages(courseId, moduleId);
      const sorted = [...data].sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.created_at ?? a.created_at;
        const bLast = b.messages[b.messages.length - 1]?.created_at ?? b.created_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      });
      setThreads(sorted);
    } finally {
      setSendingNoteId(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Questions & notes
          </p>
          <p className="text-xs text-slate-500">
            Capture what stands out, what feels unclear, and how God is speaking
            through this module. You can keep the conversation going with your facilitator.
          </p>
        </div>
      </div>

      {/* Chat history: all threads with topic and messages */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-800">Chat history</h2>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="max-h-80 space-y-4 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800">
          {loading && <p className="text-slate-500">Loading...</p>}
          {!loading && threads.length === 0 && (
            <p className="text-slate-500">
              No messages yet. Choose a course (and optional module) below and type your question to start a conversation.
            </p>
          )}
          {!loading &&
            threads.map((thread) => (
              <div
                key={thread.id}
                className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                  <span className="font-semibold">Topic:</span>
                  <span>
                    {thread.course_title ?? "General"}
                    {thread.module_title ? ` · ${thread.module_title}` : ""}
                  </span>
                </div>
                {thread.messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {msg.role === "student" ? "You" : "Facilitator"}
                      <span className="ml-2 font-normal text-slate-400">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </span>
                    <p className="rounded-lg bg-slate-50 px-2 py-1 text-slate-800">
                      {msg.body}
                    </p>
                  </div>
                ))}
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReply(thread.id);
                  }}
                >
                  <Input
                    id={`reply-${thread.id}`}
                    name="reply"
                    placeholder="Reply in this thread..."
                    value={replyByNoteId[thread.id] ?? ""}
                    onChange={(e) =>
                      setReplyByNoteId((prev) => ({
                        ...prev,
                        [thread.id]: e.target.value,
                      }))
                    }
                    disabled={sendingNoteId !== null}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      sendingNoteId !== null ||
                      !(replyByNoteId[thread.id]?.trim())
                    }
                  >
                    {sendingNoteId === thread.id ? "Sending..." : "Reply"}
                  </Button>
                </form>
              </div>
            ))}
        </div>
      </div>

      {/* New question: course + module dropdowns (greyed out if no courses) */}
      <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
        <p className="text-xs font-medium text-slate-600">Ask a new question</p>
        {!hasCourses ? (
          <p className="text-sm text-slate-500">
            Enroll in a course to ask questions. Go to the catalog to get started.
          </p>
        ) : (
          <form onSubmit={handleNewQuestion} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="message-course" className="text-xs">
                  Course
                </Label>
                <select
                  id="message-course"
                  name="courseId"
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedModuleId("");
                  }}
                  required
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select course…</option>
                  {coursesWithModules.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message-module" className="text-xs">
                  Module (optional)
                </Label>
                <select
                  id="message-module"
                  name="moduleId"
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">This course generally</option>
                  {modulesForSelected.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                id="new-question"
                name="newQuestion"
                placeholder="Type your question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                disabled={sending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  sending ||
                  !newQuestion.trim() ||
                  !selectedCourseId
                }
              >
                {sending ? "Sending..." : "Ask"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
