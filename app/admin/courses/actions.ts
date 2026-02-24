"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { MATERIAL_FORMATS, MODULE_MATERIAL_FORMATS } from "./constants";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type CreateCourseState = { error?: string; id?: string };

export async function createCourse(
  _prev: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? null;
  const difficulty = (formData.get("difficulty") as string) ?? "Beginner";
  const estimatedMinutes = Math.max(
    1,
    parseInt(String(formData.get("estimated_minutes")), 10) || 60
  );
  const slugInput = (formData.get("slug") as string)?.trim();
  const slug = slugInput
    ? slugify(slugInput)
    : slugify(title || "course");
  const publishNow = formData.get("publish_now") === "true";

  if (!title) {
    return { error: "Title is required." };
  }
  if (!DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
    return { error: "Invalid difficulty." };
  }

  const { data, error } = await supabase.from("courses").insert({
    slug: slug || "untitled",
    title,
    description,
    difficulty,
    estimated_minutes: estimatedMinutes,
    is_published: publishNow,
    created_by: user.id,
  }).select("id").single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A course with this slug already exists. Try a different title or slug." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { id: data?.id };
}

export type UpdateCourseState = { error?: string };

export async function updateCourse(
  courseId: string,
  _prev: UpdateCourseState,
  formData: FormData
): Promise<UpdateCourseState> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? null;
  const difficulty = (formData.get("difficulty") as string);
  const estimatedMinutes = parseInt(String(formData.get("estimated_minutes")), 10);
  const slugInput = (formData.get("slug") as string)?.trim();

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (difficulty && DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
    updates.difficulty = difficulty;
  }
  if (!Number.isNaN(estimatedMinutes) && estimatedMinutes >= 1) {
    updates.estimated_minutes = estimatedMinutes;
  }
  if (slugInput) updates.slug = slugify(slugInput);

  const thumbnailInput = (formData.get("thumbnail_url") as string)?.trim();
  if (thumbnailInput !== undefined) updates.thumbnail_url = thumbnailInput || null;

  if (Object.keys(updates).length === 0) {
    return {};
  }

  const { error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", courseId);

  if (error) {
    if (error.code === "23505") return { error: "Slug already in use." };
    return { error: error.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath("/courses");
  return {};
}

export async function updateCourseThumbnail(courseId: string, thumbnailUrl: string | null): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("courses")
    .update({ thumbnail_url: thumbnailUrl || null })
    .eq("id", courseId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath("/courses");
  return {};
}

/** Get thumbnail URL from a YouTube or Vimeo video URL (for auto-setting course thumbnail). */
export async function getThumbnailFromVideoUrl(videoUrl: string): Promise<{ url?: string; error?: string }> {
  const raw = (videoUrl || "").trim();
  if (!raw) return { error: "Enter a video URL." };

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    // YouTube: youtube.com, youtu.be
    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = url.pathname.slice(1).split("/")[0] || null;
      } else {
        videoId = url.searchParams.get("v");
      }
      if (!videoId) return { error: "Could not find YouTube video ID." };
      return { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
    }

    // Vimeo: fetch thumbnail via oEmbed
    if (host === "vimeo.com") {
      const path = url.pathname.replace(/^\/+/, "").split("/")[0];
      if (!path || path === "video") return { error: "Invalid Vimeo URL." };
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${path}`)}`;
      const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
      if (!res.ok) return { error: "Could not fetch Vimeo thumbnail." };
      const data = (await res.json()) as { thumbnail_url?: string };
      if (!data?.thumbnail_url) return { error: "No thumbnail in Vimeo response." };
      return { url: data.thumbnail_url };
    }

    return { error: "Only YouTube and Vimeo video URLs are supported." };
  } catch {
    return { error: "Invalid URL." };
  }
}

export async function toggleCoursePublish(courseId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("is_published")
    .eq("id", courseId)
    .single();

  if (!course) {
    return { error: "Course not found." };
  }

  const { error } = await supabase
    .from("courses")
    .update({ is_published: !course.is_published })
    .eq("id", courseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return {};
}

export async function deleteCourse(courseId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return {};
}

export type CourseMaterialRow = {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  format: string;
  sort_order: number;
};

export async function getCourseMaterials(courseId: string): Promise<CourseMaterialRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("course_materials")
    .select("id, course_id, title, file_url, format, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as CourseMaterialRow[];
}

export async function addCourseMaterial(
  courseId: string,
  payload: { title: string; file_url: string; format: "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png" }
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const title = payload.title?.trim();
  const file_url = payload.file_url?.trim();
  if (!title || !file_url) return { error: "Title and file URL are required." };
  if (!MATERIAL_FORMATS.includes(payload.format as (typeof MATERIAL_FORMATS)[number])) return { error: "Invalid format." };

  const { error } = await supabase.from("course_materials").insert({
    course_id: courseId,
    title,
    file_url,
    format: payload.format,
    sort_order: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return {};
}

export async function deleteCourseMaterial(materialId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("course_materials").delete().eq("id", materialId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return {};
}

/** Upload a file to Supabase Storage and add as course material. Bucket "materials" must exist with policy allowing authenticated upload. Returns the new course_material id when successful. */
export async function uploadAndAddCourseMaterial(
  courseId: string,
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  await requireRole("admin");
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const format = (formData.get("format") as string)?.toLowerCase();

  if (!file || file.size === 0) return { error: "Please select a file." };
  if (!title) return { error: "Title is required." };
  const allowed = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
  if (!format || !allowed.includes(format)) return { error: "Format must be one of: " + allowed.join(", ") };

  const supabase = createSupabaseServerClient();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `${courseId}/${safeName}`;

  const { error: uploadError } = await supabase.storage.from("materials").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
  const file_url = urlData.publicUrl;

  const { data: inserted, error: insertError } = await supabase
    .from("course_materials")
    .insert({
      course_id: courseId,
      title,
      file_url,
      format: format as "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png",
      sort_order: 0,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath("/courses");
  return { id: inserted.id };
}

// ---------- Course builder: modules (lessons) & quizzes ----------
export type ModuleWithQuizzes = {
  id: string;
  course_id: string;
  index_in_course: number;
  title: string;
  description: string | null;
  quizzes: { id: string; title: string }[];
};

export async function getCourseWithModulesAndQuizzes(courseId: string): Promise<{
  course: { id: string; title: string; description: string | null; thumbnail_url: string | null } | null;
  modules: ModuleWithQuizzes[];
} | null> {
  const supabase = createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url")
    .eq("id", courseId)
    .single();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id, index_in_course, title, description")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: true });
  if (!modules?.length) {
    return {
      course: { id: course.id, title: course.title, description: course.description ?? null, thumbnail_url: course.thumbnail_url ?? null },
      modules: [],
    };
  }

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id, title")
    .in("module_id", modules.map((m) => m.id));

  const quizByModule = new Map<string, { id: string; title: string }[]>();
  for (const q of quizzes ?? []) {
    const list = quizByModule.get(q.module_id) ?? [];
    list.push({ id: q.id, title: q.title });
    quizByModule.set(q.module_id, list);
  }

  const moduleList: ModuleWithQuizzes[] = modules.map((m) => ({
    id: m.id,
    course_id: m.course_id,
    index_in_course: m.index_in_course,
    title: m.title,
    description: m.description ?? null,
    quizzes: quizByModule.get(m.id) ?? [],
  }));

  return {
    course: { id: course.id, title: course.title, description: course.description ?? null, thumbnail_url: course.thumbnail_url ?? null },
    modules: moduleList,
  };
}

export async function reorderModules(
  courseId: string,
  orderedModuleIds: string[]
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  for (let i = 0; i < orderedModuleIds.length; i++) {
    const { error } = await supabase
      .from("modules")
      .update({ index_in_course: i })
      .eq("id", orderedModuleIds[i])
      .eq("course_id", courseId);
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  return {};
}

const COURSE_MATERIAL_FORMATS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"] as const;

export async function addModule(
  courseId: string,
  payload: {
    title: string;
    video_url?: string | null;
    description?: string | null;
    /** Attach these course material IDs to the new lesson (creates module_materials). */
    attachCourseMaterialIds?: string[];
    /** Add new materials by URL to the course and attach to this lesson. */
    newMaterials?: { title: string; file_url: string; format: string }[];
  }
): Promise<{ error?: string; id?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const title = payload.title?.trim() || "New lesson";
  const { data: max } = await supabase
    .from("modules")
    .select("index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (max?.index_in_course ?? -1) + 1;
  const insert: Record<string, unknown> = {
    course_id: courseId,
    index_in_course: nextIndex,
    title,
  };
  if (payload.video_url !== undefined) insert.video_url = payload.video_url || null;
  if (payload.description !== undefined) insert.description = payload.description || null;
  const { data: inserted, error } = await supabase
    .from("modules")
    .insert(insert)
    .select("id")
    .single();
  if (error) return { error: error.message };
  const moduleId = inserted.id;

  // Attach existing course materials to this lesson
  const attachIds = payload.attachCourseMaterialIds?.filter(Boolean) ?? [];
  if (attachIds.length > 0) {
    const { data: rows } = await supabase
      .from("course_materials")
      .select("id, title, file_url, format")
      .eq("course_id", courseId)
      .in("id", attachIds);
    for (const row of rows ?? []) {
      const format = row.format as string;
      const { error: matErr } = await supabase.from("module_materials").insert({
        module_id: moduleId,
        title: row.title,
        file_url: row.file_url,
        format: MODULE_MATERIAL_FORMATS.includes(format as (typeof MODULE_MATERIAL_FORMATS)[number]) ? format : "pdf",
        sort_order: 0,
      });
      if (matErr) return { error: "Failed to attach material: " + matErr.message };
    }
  }

  // Add new materials by URL to course and attach to this lesson
  const newMats = payload.newMaterials?.filter((m) => m.title?.trim() && m.file_url?.trim()) ?? [];
  for (const m of newMats) {
    const format = (COURSE_MATERIAL_FORMATS.includes(m.format as (typeof COURSE_MATERIAL_FORMATS)[number]) ? m.format : "pdf") as "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png";
    const { error: courseErr } = await supabase.from("course_materials").insert({
      course_id: courseId,
      title: m.title.trim(),
      file_url: m.file_url.trim(),
      format,
      sort_order: 0,
    });
    if (courseErr) return { error: "Failed to add material: " + courseErr.message };
    const { error: modErr } = await supabase.from("module_materials").insert({
      module_id: moduleId,
      title: m.title.trim(),
      file_url: m.file_url.trim(),
      format: format === "pdf" || format === "doc" || format === "docx" || format === "jpg" || format === "jpeg" || format === "png" ? format : "pdf",
      sort_order: 0,
    });
    if (modErr) return { error: "Failed to attach new material: " + modErr.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  return { id: moduleId };
}

/** Create a lesson and attach materials in one go, including uploading pending files from FormData. */
export async function addModuleWithFormData(
  courseId: string,
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  await requireRole("admin");
  const title = (formData.get("title") as string)?.trim() || "New lesson";
  const video_url = (formData.get("video_url") as string)?.trim() || null;
  const attachCourseMaterialIds = JSON.parse((formData.get("attachCourseMaterialIds") as string) || "[]") as string[];
  const newMaterials = JSON.parse((formData.get("newMaterials") as string) || "[]") as { title: string; file_url: string; format: string }[];

  const supabase = createSupabaseServerClient();
  const { data: max } = await supabase
    .from("modules")
    .select("index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (max?.index_in_course ?? -1) + 1;
  const { data: inserted, error } = await supabase
    .from("modules")
    .insert({
      course_id: courseId,
      index_in_course: nextIndex,
      title,
      video_url,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const moduleId = inserted.id;

  // Attach existing course materials
  const attachIds = attachCourseMaterialIds.filter(Boolean);
  if (attachIds.length > 0) {
    const { data: rows } = await supabase
      .from("course_materials")
      .select("id, title, file_url, format")
      .eq("course_id", courseId)
      .in("id", attachIds);
    for (const row of rows ?? []) {
      const format = row.format as string;
      await supabase.from("module_materials").insert({
        module_id: moduleId,
        title: row.title,
        file_url: row.file_url,
        format: MODULE_MATERIAL_FORMATS.includes(format as (typeof MODULE_MATERIAL_FORMATS)[number]) ? format : "pdf",
        sort_order: 0,
      });
    }
  }

  // Add new materials by URL
  for (const m of newMaterials.filter((m) => m.title?.trim() && m.file_url?.trim())) {
    const format = (COURSE_MATERIAL_FORMATS.includes(m.format as (typeof COURSE_MATERIAL_FORMATS)[number]) ? m.format : "pdf") as "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png";
    await supabase.from("course_materials").insert({
      course_id: courseId,
      title: m.title.trim(),
      file_url: m.file_url.trim(),
      format,
      sort_order: 0,
    });
    await supabase.from("module_materials").insert({
      module_id: moduleId,
      title: m.title.trim(),
      file_url: m.file_url.trim(),
      format,
      sort_order: 0,
    });
  }

  // Upload pending files and add as module_materials
  for (let i = 0; ; i++) {
    const file = formData.get(`file_${i}`) as File | null;
    if (!file || !(file instanceof File) || file.size === 0) break;
    const fileTitle = (formData.get(`title_${i}`) as string)?.trim();
    const fileFormat = ((formData.get(`format_${i}`) as string) || "pdf").toLowerCase();
    if (!fileTitle) continue;
    const allowed = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "pptx"];
    const format = allowed.includes(fileFormat) ? fileFormat : "pdf";
    const safeName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const path = `${courseId}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("materials").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return { error: "Upload failed: " + uploadError.message };
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
    const { error: insertErr } = await supabase.from("module_materials").insert({
      module_id: moduleId,
      title: fileTitle,
      file_url: urlData.publicUrl,
      format: format as "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png" | "pptx",
      sort_order: 0,
    });
    if (insertErr) return { error: "Failed to attach uploaded file: " + insertErr.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  return { id: moduleId };
}

export async function addModuleFromLessonBank(courseId: string, lessonBankId: string): Promise<{ error?: string; id?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { data: template } = await supabase
    .from("lesson_bank")
    .select("title, description, video_url, audio_url, pdf_url, scripture_reference, rich_text")
    .eq("id", lessonBankId)
    .single();
  if (!template) return { error: "Lesson not found in bank." };

  const { data: max } = await supabase
    .from("modules")
    .select("index_in_course")
    .eq("course_id", courseId)
    .order("index_in_course", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (max?.index_in_course ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("modules")
    .insert({
      course_id: courseId,
      index_in_course: nextIndex,
      title: template.title,
      description: template.description,
      video_url: template.video_url,
      audio_url: template.audio_url,
      pdf_url: template.pdf_url,
      scripture_reference: template.scripture_reference,
      rich_text: template.rich_text,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  return { id: inserted.id };
}

export async function deleteModule(moduleId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return {};
}

export async function getLessonBankList(): Promise<{ id: string; title: string }[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("lesson_bank")
    .select("id, title")
    .order("title");
  return (data ?? []) as { id: string; title: string }[];
}

// ---------- Lesson (module) editor ----------
export type ModuleRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  audio_url: string | null;
  pdf_url: string | null;
  scripture_reference: string | null;
  rich_text: unknown;
};

export async function getModule(moduleId: string): Promise<{ module: ModuleRow; courseTitle: string } | null> {
  const supabase = createSupabaseServerClient();
  const { data: module } = await supabase
    .from("modules")
    .select("id, course_id, title, description, video_url, audio_url, pdf_url, scripture_reference, rich_text")
    .eq("id", moduleId)
    .single();
  if (!module) return null;
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", module.course_id)
    .single();
  return { module: module as ModuleRow, courseTitle: course?.title ?? "Course" };
}

export async function updateModule(
  moduleId: string,
  payload: Partial<{
    title: string;
    description: string | null;
    video_url: string | null;
    audio_url: string | null;
    pdf_url: string | null;
    scripture_reference: string | null;
    rich_text: unknown;
  }>
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("modules").update(payload).eq("id", moduleId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return {};
}

export type ModuleMaterialRow = {
  id: string;
  module_id: string;
  title: string;
  file_url: string;
  format: string;
  sort_order: number;
};

export async function getModuleMaterials(moduleId: string): Promise<ModuleMaterialRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("module_materials")
    .select("id, module_id, title, file_url, format, sort_order")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as ModuleMaterialRow[];
}

const MODULE_UPLOAD_FORMATS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "pptx"] as const;

/** Upload a file to Supabase Storage and add as module (lesson) material. */
export async function uploadAndAddModuleMaterial(
  courseId: string,
  moduleId: string,
  formData: FormData
): Promise<{ error?: string }> {
  await requireRole("admin");
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const format = (formData.get("format") as string)?.toLowerCase();

  if (!file || file.size === 0) return { error: "Please select a file." };
  if (!title) return { error: "Title is required." };
  if (!format || !MODULE_UPLOAD_FORMATS.includes(format as (typeof MODULE_UPLOAD_FORMATS)[number])) {
    return { error: "Format must be one of: " + MODULE_UPLOAD_FORMATS.join(", ") };
  }

  const supabase = createSupabaseServerClient();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `${courseId}/${safeName}`;

  const { error: uploadError } = await supabase.storage.from("materials").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
  const file_url = urlData.publicUrl;

  const { error: insertError } = await supabase.from("module_materials").insert({
    module_id: moduleId,
    title,
    file_url,
    format: format as "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png" | "pptx",
    sort_order: 0,
  });
  if (insertError) return { error: insertError.message };
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}/builder`);
  revalidatePath(`/admin/courses/${courseId}/lessons/${moduleId}`);
  return {};
}

export async function addModuleMaterial(
  moduleId: string,
  payload: { title: string; file_url: string; format: "pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png" | "pptx" }
): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const title = payload.title?.trim();
  const file_url = payload.file_url?.trim();
  if (!title || !file_url) return { error: "Title and file URL are required." };
  if (!MODULE_MATERIAL_FORMATS.includes(payload.format as (typeof MODULE_MATERIAL_FORMATS)[number])) return { error: "Invalid format." };
  const { error } = await supabase.from("module_materials").insert({
    module_id: moduleId,
    title,
    file_url,
    format: payload.format,
    sort_order: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return {};
}

export async function deleteModuleMaterial(materialId: string): Promise<{ error?: string }> {
  await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("module_materials").delete().eq("id", materialId);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return {};
}

export async function saveModuleToLessonBank(moduleId: string): Promise<{ error?: string }> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServerClient();
  const { data: mod } = await supabase
    .from("modules")
    .select("title, description, video_url, audio_url, pdf_url, scripture_reference, rich_text")
    .eq("id", moduleId)
    .single();
  if (!mod) return { error: "Module not found." };
  const { error } = await supabase.from("lesson_bank").insert({
    created_by: user.id,
    title: mod.title,
    description: mod.description,
    video_url: mod.video_url,
    audio_url: mod.audio_url,
    pdf_url: mod.pdf_url,
    scripture_reference: mod.scripture_reference,
    rich_text: mod.rich_text,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return {};
}
