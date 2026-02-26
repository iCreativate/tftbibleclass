import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CourseForCard = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimated_minutes: number;
  thumbnail_url: string | null;
};

/** Published courses (catalog). */
export async function getPublishedCourses(): Promise<CourseForCard[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title, description, difficulty, estimated_minutes, thumbnail_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Enrolled courses for the current user (requires auth). */
export async function getEnrolledCourses(userId: string): Promise<(CourseForCard & { progressPercent?: number })[]> {
  const supabase = createSupabaseServerClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId);

  if (!enrollments?.length) return [];

  const courseIds = enrollments.map((e) => e.course_id);
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, difficulty, estimated_minutes, thumbnail_url")
    .in("id", courseIds)
    .eq("is_published", true);

  if (!courses?.length) return [];

  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, progress_percent")
    .eq("user_id", userId);

  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", courseIds);

  const progressByCourse: Record<string, { total: number; sum: number }> = {};
  for (const c of courses) {
    progressByCourse[c.id] = { total: 0, sum: 0 };
  }
  for (const m of modules ?? []) {
    if (progressByCourse[m.course_id]) progressByCourse[m.course_id].total += 1;
  }
  for (const p of progressRows ?? []) {
    const mod = modules?.find((m) => m.id === p.module_id);
    if (mod && progressByCourse[mod.course_id]) {
      progressByCourse[mod.course_id].sum += Number(p.progress_percent ?? 0);
    }
  }

  return courses.map((c) => {
    const prog = progressByCourse[c.id];
    const progressPercent =
      prog && prog.total > 0
        ? Math.round(prog.sum / prog.total)
        : undefined;
    return { ...c, progressPercent };
  });
}

/** Enrolled courses with their modules (for message topic dropdown). */
export async function getEnrolledCoursesWithModules(
  userId: string
): Promise<{ id: string; title: string; modules: { id: string; title: string }[] }[]> {
  const enrolled = await getEnrolledCourses(userId);
  if (!enrolled.length) return [];
  const supabase = createSupabaseServerClient();
  const courseIds = enrolled.map((c) => c.id);
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, title, index_in_course")
    .in("course_id", courseIds)
    .order("index_in_course", { ascending: true });
  const modulesByCourse = new Map<string, { id: string; title: string }[]>();
  for (const m of modules ?? []) {
    const list = modulesByCourse.get(m.course_id) ?? [];
    list.push({ id: m.id, title: m.title });
    modulesByCourse.set(m.course_id, list);
  }
  return enrolled.map((c) => ({
    id: c.id,
    title: c.title,
    modules: modulesByCourse.get(c.id) ?? [],
  }));
}

/** Whether the user can enroll in a new course. Students must complete their current course before enrolling in another. Staff (admin/facilitator) can always enroll. */
export async function canEnrollInNewCourse(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = (profile?.role as string) ?? "student";
  if (role === "admin" || role === "facilitator") return { allowed: true };

  const enrolled = await getEnrolledCourses(userId);
  if (enrolled.length === 0) return { allowed: true };
  const hasCompleted = enrolled.some((c) => (c.progressPercent ?? 0) >= 100);
  if (hasCompleted) return { allowed: true };
  return {
    allowed: false,
    reason: "Complete your current course before enrolling in another.",
  };
}

/** Single course by id (published only). Returns null if not found or not published. */
export async function getPublishedCourseById(courseId: string): Promise<CourseForCard & { slug: string } | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, difficulty, estimated_minutes, thumbnail_url")
    .eq("id", courseId)
    .eq("is_published", true)
    .single();
  return data;
}

/** Course by id for a student: must be published OR user enrolled. When allowStaffBypass is true, admins and facilitators get the course even if not enrolled (e.g. for Test quiz). */
export async function getCourseForStudent(
  courseId: string,
  userId: string,
  options?: { allowStaffBypass?: boolean }
): Promise<(CourseForCard & { slug: string }) | null> {
  const supabase = createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, description, difficulty, estimated_minutes, thumbnail_url, is_published")
    .eq("id", courseId)
    .single();

  if (!course) return null;
  const { is_published: _, ...rest } = course;
  if (course.is_published) return rest as CourseForCard & { slug: string };

  if (options?.allowStaffBypass) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    const role = (profile?.role as string) ?? "student";
    if (role === "admin" || role === "facilitator") return rest as CourseForCard & { slug: string };
  }

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();

  return enrolled ? (rest as CourseForCard & { slug: string }) : null;
}

export type CourseMaterial = {
  id: string;
  title: string;
  file_url: string;
  format: string;
};

/** Downloadable materials for a course (visible when course is published). */
export async function getCourseMaterialsForDisplay(courseId: string): Promise<CourseMaterial[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("course_materials")
    .select("id, title, file_url, format")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CourseMaterial[];
}

/** Module (lesson) materials for student display. */
export async function getModuleMaterialsForDisplay(moduleId: string): Promise<CourseMaterial[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("module_materials")
    .select("id, title, file_url, format")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CourseMaterial[];
}

/** Modules (lessons) for a course with their attached materials and quiz flag. For course preview / catalog. */
export async function getCourseModulesWithMaterials(courseId: string): Promise<
  { id: string; title: string; index_in_course: number; materials: CourseMaterial[]; hasQuiz: boolean; quiz_id: string | null }[]
> {
  const supabase = createSupabaseServerClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: true });
  if (!modules?.length) return [];
  const moduleIds = modules.map((m) => m.id);
  const { data: matRows } = await supabase
    .from("module_materials")
    .select("id, module_id, title, file_url, format")
    .in("module_id", moduleIds)
    .order("sort_order", { ascending: true });
  const materialsByModule = new Map<string, CourseMaterial[]>();
  for (const row of matRows ?? []) {
    const list = materialsByModule.get(row.module_id) ?? [];
    list.push({ id: row.id, title: row.title, file_url: row.file_url, format: row.format });
    materialsByModule.set(row.module_id, list);
  }
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id")
    .in("module_id", moduleIds);
  const quizIdByModuleId = new Map<string, string>();
  for (const q of quizzes ?? []) {
    quizIdByModuleId.set(q.module_id, q.id);
  }
  return modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    index_in_course: mod.index_in_course,
    materials: materialsByModule.get(mod.id) ?? [],
    hasQuiz: quizIdByModuleId.has(mod.id),
    quiz_id: quizIdByModuleId.get(mod.id) ?? null,
  }));
}

/** Course progress percent for a user (0–100). */
export async function getCourseProgressPercent(
  userId: string,
  courseId: string
): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (!modules?.length) return 0;

  const moduleIds = modules.map((m) => m.id);
  const { data: progress } = await supabase
    .from("module_progress")
    .select("progress_percent")
    .eq("user_id", userId)
    .in("module_id", moduleIds);

  if (!progress?.length) return 0;
  const sum = progress.reduce((a, p) => a + Number(p.progress_percent ?? 0), 0);
  return Math.round(sum / modules.length);
}

/** Get the module id the student last accessed in this course (for Resume). */
export async function getResumeModuleId(
  userId: string,
  courseId: string
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("enrollments")
    .select("last_accessed_module_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();
  return data?.last_accessed_module_id ?? null;
}

/** Update last accessed module for a student in a course (call when they view a lesson). */
export async function setLastAccessedModule(
  userId: string,
  courseId: string,
  moduleId: string
): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("enrollments")
    .update({ last_accessed_module_id: moduleId })
    .eq("user_id", userId)
    .eq("course_id", courseId);
}

export type CourseModuleForStudent = {
  id: string;
  title: string;
  description: string | null;
  index_in_course: number;
  has_quiz: boolean;
  quiz_id: string | null;
  materials: CourseMaterial[];
  is_complete: boolean;
};

/** Modules (lessons) for a course the student can access, ordered, with attached materials and completion. */
export async function getCourseModulesForStudent(
  courseId: string,
  userId: string
): Promise<CourseModuleForStudent[]> {
  const supabase = createSupabaseServerClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: true });
  if (!modules?.length) return [];
  const moduleIds = modules.map((m) => m.id);
  // Use RPC so enrolled students see quizzes even if RLS policies are restrictive
  const { data: quizRows } = await supabase.rpc("get_quizzes_for_enrolled_modules", {
    p_module_ids: moduleIds,
  });
  const quizByModuleId = new Map<string, string>();
  if (Array.isArray(quizRows)) {
    for (const row of quizRows as { module_id: string; quiz_id: string }[]) {
      if (row?.module_id && row?.quiz_id) quizByModuleId.set(row.module_id, row.quiz_id);
    }
  }
  // Fallback: direct query (works when RLS allows, e.g. admin/facilitator or enrolled policy present)
  if (quizByModuleId.size === 0) {
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, module_id")
      .in("module_id", moduleIds);
    for (const q of quizzes ?? []) {
      quizByModuleId.set(q.module_id, q.id);
    }
  }
  const quizModuleIds = new Set(quizByModuleId.keys());
  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, progress_percent")
    .eq("user_id", userId)
    .in("module_id", moduleIds);
  const progressByModule = new Map<string, number>();
  for (const p of progressRows ?? []) {
    progressByModule.set(p.module_id, Number(p.progress_percent ?? 0));
  }
  const { data: matRows } = await supabase
    .from("module_materials")
    .select("id, module_id, title, file_url, format")
    .in("module_id", moduleIds)
    .order("sort_order", { ascending: true });
  const materialsByModule = new Map<string, CourseMaterial[]>();
  for (const row of matRows ?? []) {
    const list = materialsByModule.get(row.module_id) ?? [];
    list.push({ id: row.id, title: row.title, file_url: row.file_url, format: row.format });
    materialsByModule.set(row.module_id, list);
  }
  return modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? null,
    index_in_course: m.index_in_course,
    has_quiz: quizModuleIds.has(m.id),
    quiz_id: quizByModuleId.get(m.id) ?? null,
    materials: materialsByModule.get(m.id) ?? [],
    is_complete: (progressByModule.get(m.id) ?? 0) >= 100,
  }));
}

/** Course is completed when every module has video watched fully (progress >= 100%) and every quiz passed. */
export async function getCourseCompletionStatus(
  userId: string,
  courseId: string
): Promise<{ completed: boolean }> {
  const supabase = createSupabaseServerClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);
  if (!modules?.length) return { completed: true };

  const moduleIds = modules.map((m) => m.id);
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id")
    .in("module_id", moduleIds);
  const quizIdsByModuleId = new Map<string, string>();
  for (const q of quizzes ?? []) {
    quizIdsByModuleId.set(q.module_id, q.id);
  }

  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, progress_percent")
    .eq("user_id", userId)
    .in("module_id", moduleIds);
  const progressByModule = new Map<string, number>();
  for (const p of progressRows ?? []) {
    progressByModule.set(p.module_id, Number(p.progress_percent ?? 0));
  }

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const { data: passedAttempts } = quizIds.length
    ? await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .eq("user_id", userId)
        .eq("passed", true)
        .in("quiz_id", quizIds)
    : { data: [] };
  const passedQuizIds = new Set((passedAttempts ?? []).map((a) => a.quiz_id));

  for (const mod of modules) {
    const videoComplete = (progressByModule.get(mod.id) ?? 0) >= 100;
    const quizId = quizIdsByModuleId.get(mod.id);
    const quizPassed = !quizId || passedQuizIds.has(quizId);
    if (!videoComplete || !quizPassed) return { completed: false };
  }
  return { completed: true };
}

/** Set module progress (e.g. 100 when video watched fully). Call from server action. */
export async function setModuleProgress(
  userId: string,
  moduleId: string,
  progressPercent: number
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const value = Math.min(100, Math.max(0, progressPercent));
  await supabase.from("module_progress").upsert(
    {
      user_id: userId,
      module_id: moduleId,
      progress_percent: value,
      completed: value >= 100,
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_id" }
  );
}

export type CertificateRecord = {
  id: string;
  course_id: string;
  course_title: string;
  awarded_at: string;
};

/** Get certificates awarded to the user (from DB). */
export async function getCertificates(userId: string): Promise<CertificateRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("certificates")
    .select("id, course_id, course_title, awarded_at")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  return (data ?? []) as CertificateRecord[];
}

/** Award a course certificate if the user has completed the course and not already awarded. */
export async function awardCertificateIfCompleted(
  userId: string,
  courseId: string
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { completed } = await getCourseCompletionStatus(userId, courseId);
  if (!completed) return;
  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return;
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();
  if (!course) return;
  await supabase.from("certificates").insert({
    user_id: userId,
    course_id: courseId,
    course_title: course.title ?? "Course",
  });
}
