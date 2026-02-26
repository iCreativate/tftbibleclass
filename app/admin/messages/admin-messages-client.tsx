"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  respondToNote,
  addFacilitatorReply,
  type NoteForAdminWithMessages,
} from "./actions";
import { Button } from "@/components/ui/button";

export function AdminMessagesClient({
  initialNotes,
}: {
  initialNotes: NoteForAdminWithMessages[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSendReply(noteId: string) {
    const trimmed = responseText.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const note = notes.find((n) => n.id === noteId);
      const isFirstResponse = !note?.admin_response;
      const { error } = isFirstResponse
        ? await respondToNote(noteId, trimmed)
        : await addFacilitatorReply(noteId, trimmed);
      if (!error) {
        setRespondingId(null);
        setResponseText("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        No student questions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 text-xs text-slate-500">
            {note.user_name ?? "Student"} · {note.course_title ?? "General"}
            {note.module_title ? ` · ${note.module_title}` : ""} ·{" "}
            {new Date(note.created_at).toLocaleString()}
          </div>
          <div className="space-y-3">
            {note.messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "facilitator"
                    ? "bg-primary/10 text-slate-800"
                    : "bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-xs font-semibold text-slate-500">
                  {msg.role === "student" ? "Student" : "You"}
                </span>
                <p className="mt-0.5">{msg.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {respondingId === note.id ? (
              <div className="space-y-2">
                <textarea
                  id={`facilitator-reply-${note.id}`}
                  name="facilitatorReply"
                  className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={saving}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSendReply(note.id)}
                    disabled={saving || !responseText.trim()}
                  >
                    {saving ? "Sending..." : "Send"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRespondingId(null);
                      setResponseText("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => setRespondingId(note.id)}
              >
                {note.admin_response ? "Reply again" : "Respond"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
