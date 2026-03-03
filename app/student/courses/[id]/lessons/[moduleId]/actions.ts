"use server";

import { requireRole } from "@/lib/auth/server";
import { setModuleProgress, awardCertificateIfCompleted, recordModuleMaterialsAccessed } from "@/lib/courses";

export async function markLessonComplete(courseId: string, moduleId: string) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  await setModuleProgress(user.id, moduleId, 100);
  await awardCertificateIfCompleted(user.id, courseId);
}

/** Record that the student has accessed a learner material for this module (e.g. clicked to download). */
export async function recordMaterialAccessed(moduleId: string) {
  const user = await requireRole(["student", "facilitator", "admin"]);
  await recordModuleMaterialsAccessed(user.id, moduleId);
}
