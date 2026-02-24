"use server";

import { requireRole } from "@/lib/auth/server";
import { setModuleProgress, awardCertificateIfCompleted } from "@/lib/courses";

export async function markLessonComplete(courseId: string, moduleId: string) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  await setModuleProgress(user.id, moduleId, 100);
  await awardCertificateIfCompleted(user.id, courseId);
}
