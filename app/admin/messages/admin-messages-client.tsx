"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { respondToNote, type NoteForAdmin } from "./actions";
import { Button } from "@/components/ui/button";

export function AdminMessagesClient({ initialNotes }: { initialNotes: NoteForAdmin[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleRespond(noteId: string) {
    if (!responseText.trim() || saving) return;
    setSaving(true);
    try {
      const { error } = await respondToNote(noteId, responseText);
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
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-slate-900">{note.content}</p>
            <p className="text-xs text-slate-500">
              {note.user_name ?? "Student"} · {note.course_title ?? "General"}
              {note.module_title ? ` · ${note.module_title}` : ""} ·{" "}
              {new Date(note.created_at).toLocaleString()}
            </p>
            {note.admin_response && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-slate-700">
                <p className="text-xs font-semibold text-slate-500">Your response</p>
                <p className="mt-1">{note.admin_response}</p>
                {note.responded_at && (
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(note.responded_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {respondingId === note.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={saving}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(note.id)}
                    disabled={saving || !responseText.trim()}
                  >
                    {saving ? "Sending..." : "Send response"}
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
            ) : !note.admin_response ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-fit"
                onClick={() => setRespondingId(note.id)}
              >
                Respond
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
