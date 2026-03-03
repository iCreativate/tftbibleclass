"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { markLessonComplete } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  moduleId: string;
};

export function MarkLessonCompleteButton({ courseId, moduleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleClick() {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const result = await markLessonComplete(courseId, moduleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
      // Force full navigation so the server re-fetches and sees updated progress
      router.push(`/student/courses/${courseId}/lessons/${moduleId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Lesson marked complete. You can take the assessment below.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        I&apos;ve watched this lesson
      </Button>
    </div>
  );
}
