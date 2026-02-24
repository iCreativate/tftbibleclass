"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markLessonComplete } from "./actions";
import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  moduleId: string;
};

export function MarkLessonCompleteButton({ courseId, moduleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await markLessonComplete(courseId, moduleId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
