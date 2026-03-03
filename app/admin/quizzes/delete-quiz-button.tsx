"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteQuiz } from "./actions";

export function DeleteQuizButton({
  quizId,
  quizTitle,
  className,
  onDeleted,
  redirectTo,
}: {
  quizId: string;
  quizTitle?: string | null;
  className?: string;
  onDeleted?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      }
      disabled={pending}
      onClick={async () => {
        const ok = window.confirm(
          `Delete this quiz${quizTitle ? ` “${quizTitle}”` : ""}?\n\nThis will permanently delete the quiz, its questions, and all student attempts.`
        );
        if (!ok) return;
        setPending(true);
        const res = await deleteQuiz(quizId);
        setPending(false);
        if (res?.error) {
          window.alert(res.error);
          return;
        }
        onDeleted?.();
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      }}
      aria-label="Delete quiz"
      title="Delete quiz"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

