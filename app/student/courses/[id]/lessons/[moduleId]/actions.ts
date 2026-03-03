"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { setModuleProgress, awardCertificateIfCompleted, recordModuleMaterialsAccessed } from "@/lib/courses";

export async function markLessonComplete(
  courseId: string,
  moduleId: string
): Promise<{ error?: string }> {
  try {
    const user = await requireRole(["student", "facilitator", "admin"]);
    const err = await setModuleProgress(user.id, moduleId, 100);
    if (err) return { error: err };
    await awardCertificateIfCompleted(user.id, courseId);
    revalidatePath(`/student/courses/${courseId}`);
    revalidatePath(`/student/courses/${courseId}/lessons/${moduleId}`);
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to mark lesson complete.";
    return { error: message };
  }
}

/** Record that the student has accessed a learner material for this module (e.g. clicked to download). */
export async function recordMaterialAccessed(moduleId: string) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  await recordModuleMaterialsAccessed(user.id, moduleId);
}
