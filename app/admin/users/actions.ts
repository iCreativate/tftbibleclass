"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export type AdminCourseOption = {
  id: string;
  title: string;
  is_published: boolean;
};

export type AdminUserEnrollmentRow = {
  course_id: string;
  course_title: string;
  course_published: boolean;
  enrolled_at: string;
  last_accessed_module_id: string | null;
  last_accessed_module_title: string | null;
  progress_percent: number;
  completed_modules: number;
  total_modules: number;
};

export async function getUserEnrollmentsWithProgress(
  userId: string
): Promise<{ enrollments: AdminUserEnrollmentRow[]; error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { data: enrollments, error: enrollErr } = await supabase
    .from("enrollments")
    .select("course_id, enrolled_at, last_accessed_module_id")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });
  if (enrollErr) return { enrollments: [], error: enrollErr.message };
  if (!enrollments?.length) return { enrollments: [] };

  const courseIds = enrollments.map((e) => e.course_id);
  const { data: courses, error: courseErr } = await supabase
    .from("courses")
    .select("id, title, is_published")
    .in("id", courseIds);
  if (courseErr) return { enrollments: [], error: courseErr.message };

  const { data: modules, error: modErr } = await supabase
    .from("modules")
    .select("id, course_id, title")
    .in("course_id", courseIds);
  if (modErr) return { enrollments: [], error: modErr.message };

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: progressRows, error: progErr } = moduleIds.length
    ? await supabase
        .from("module_progress")
        .select("module_id, progress_percent")
        .eq("user_id", userId)
        .in("module_id", moduleIds)
    : { data: [], error: null };
  if (progErr) return { enrollments: [], error: progErr.message };

  const progressByModule = new Map<string, number>();
  for (const p of progressRows ?? []) {
    progressByModule.set(p.module_id, Number(p.progress_percent ?? 0));
  }

  const modulesByCourse = new Map<string, { id: string; title: string }[]>();
  for (const m of modules ?? []) {
    const list = modulesByCourse.get(m.course_id) ?? [];
    list.push({ id: m.id, title: m.title });
    modulesByCourse.set(m.course_id, list);
  }

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const moduleTitleById = new Map((modules ?? []).map((m) => [m.id, m.title]));

  const rows: AdminUserEnrollmentRow[] = enrollments.map((e) => {
    const course = courseMap.get(e.course_id);
    const courseModules = modulesByCourse.get(e.course_id) ?? [];
    const total = courseModules.length;
    let completed = 0;
    let sum = 0;
    for (const mod of courseModules) {
      const pct = progressByModule.get(mod.id) ?? 0;
      sum += pct;
      if (pct >= 100) completed += 1;
    }
    const progressPercent = total > 0 ? Math.round(sum / total) : 0;
    return {
      course_id: e.course_id,
      course_title: course?.title ?? "Course",
      course_published: Boolean(course?.is_published),
      enrolled_at: e.enrolled_at,
      last_accessed_module_id: e.last_accessed_module_id ?? null,
      last_accessed_module_title: e.last_accessed_module_id
        ? moduleTitleById.get(e.last_accessed_module_id) ?? null
        : null,
      progress_percent: progressPercent,
      completed_modules: completed,
      total_modules: total,
    };
  });

  return { enrollments: rows };
}

export async function adminEnrollUser(
  userId: string,
  courseId: string
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("enrollments").upsert(
    { user_id: userId, course_id: courseId },
    { onConflict: "user_id,course_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin/courses");
  return {};
}

export async function adminUnenrollUser(
  userId: string,
  courseId: string
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin/courses");
  return {};
}

