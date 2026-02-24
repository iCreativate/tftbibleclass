"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  isEnrolled: boolean;
  /** When true, show disabled enroll button with reason (e.g. must complete current course first). */
  enrollmentBlocked?: boolean;
  enrollmentBlockedReason?: string;
};

export function EnrollButton({ courseId, isEnrolled, enrollmentBlocked, enrollmentBlockedReason }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isEnrolled) {
    return (
      <Button asChild size="lg">
        <a href={`/student/courses/${courseId}`}>Go to course</a>
      </Button>
    );
  }

  if (enrollmentBlocked) {
    return (
      <div className="space-y-1.5">
        <Button size="lg" disabled title={enrollmentBlockedReason}>
          Enroll in this course
        </Button>
        {enrollmentBlockedReason && (
          <p className="text-xs text-slate-500">{enrollmentBlockedReason}</p>
        )}
      </div>
    );
  }

  async function handleEnroll() {
    setLoading(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 401) {
        return;
      }
      if (res.ok) {
        router.refresh();
        router.push(`/student/courses/${courseId}`);
      } else {
        window.location.href = "/auth/login?next=" + encodeURIComponent(`/courses/${courseId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleEnroll} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enroll in this course
    </Button>
  );
}
