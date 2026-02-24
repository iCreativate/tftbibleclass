"use client";

import { useState, FormEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyNotes, submitQuestion, type NoteMessage } from "@/app/student/notes/actions";

type ModuleChatProps = {
  courseTitle: string;
  courseId?: string | null;
};

function noteToMessages(notes: NoteMessage[]): { id: string; author: "student" | "facilitator"; text: string }[] {
  const out: { id: string; author: "student" | "facilitator"; text: string }[] = [];
  for (const n of notes) {
    out.push({ id: `${n.id}-q`, author: "student", text: n.content });
    if (n.admin_response) {
      out.push({ id: `${n.id}-a`, author: "facilitator", text: n.admin_response });
    }
  }
  return out.reverse();
}

export function ModuleChat(props: ModuleChatProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<{ id: string; author: "student" | "facilitator"; text: string }[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const courseId = props.courseId ?? null;
  const moduleId = courseId && pathname?.includes("/lessons/")
    ? pathname.split("/lessons/")[1]?.split("/")[0] ?? null
    : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyNotes(courseId, moduleId).then((notes) => {
      if (!cancelled) {
        setMessages(noteToMessages(notes));
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId, moduleId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { error } = await submitQuestion(trimmed, courseId, moduleId);
      if (error) {
        return;
      }
      setValue("");
      const notes = await getMyNotes(courseId, moduleId);
      setMessages(noteToMessages(notes));
    } finally {
      setSending(false);
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
            through this module.
          </p>
        </div>
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 text-xs text-slate-800">
        {loading && (
          <p className="text-slate-500">Loading...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-slate-500">
            No questions yet. Start by asking what you find unclear in&nbsp;
            {props.courseTitle}.
          </p>
        )}
        {!loading && messages.map(message => (
          <div
            key={message.id}
            className="flex flex-col gap-0.5"
          >
            <span className="text-[10px] font-semibold text-slate-500">
              {message.author === "student" ? "You" : "Facilitator"}
            </span>
            <p className="rounded-lg bg-slate-50 px-2 py-1 text-slate-800">
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
      >
        <Input
          placeholder="Type your question about this module..."
          value={value}
          onChange={event => setValue(event.target.value)}
          disabled={sending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending}
        >
          {sending ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
