import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { getCourseForStudent, getCourseModulesForStudent, setLastAccessedModule, getModuleMaterialsForDisplay, isWithinSchedule } from "@/lib/courses";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { MarkLessonCompleteButton } from "./mark-complete-button";
import { Download, FileText, ArrowLeft, FileQuestion } from "lucide-react";

type Props = { params: Promise<{ id: string; moduleId: string }> | { id: string; moduleId: string } };

export default async function StudentLessonPage({ params }: Props) {
  const resolved =
    typeof (params as Promise<{ id: string; moduleId: string }>).then === "function"
      ? await (params as Promise<{ id: string; moduleId: string }>)
      : (params as { id: string; moduleId: string });
  const { id: courseId, moduleId } = resolved;

  const user = await requireRole(["student", "facilitator", "admin"]);
  const course = await getCourseForStudent(courseId, user.id);
  if (!course) notFound();

  const isStaff = user.profile?.role === "admin" || user.profile?.role === "facilitator";
  if (!isStaff) {
    const modules = await getCourseModulesForStudent(courseId, user.id);
    const currentIndex = modules.findIndex((m) => m.id === moduleId);
    if (currentIndex > 0) {
      const prevComplete = modules.slice(0, currentIndex).every((m) => m.is_complete);
      if (!prevComplete) {
        redirect(`/student/courses/${courseId}?message=complete_previous`);
      }
    }
  }

  const supabase = createSupabaseServerClient();
  const { data: moduleRow } = await supabase
    .from("modules")
    .select("id, title, description, video_url, audio_url, pdf_url, scripture_reference, rich_text, available_from, available_until")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .single();

  if (!moduleRow) notFound();
  if (!isStaff && !isWithinSchedule(moduleRow.available_from, moduleRow.available_until)) notFound();

  await setLastAccessedModule(user.id, courseId, moduleId);

  const materials = await getModuleMaterialsForDisplay(moduleId);
  // RPC works for enrolled students regardless of RLS; fallback for staff
  const { data: quizIdFromRpc } = await supabase.rpc("get_quiz_id_for_enrolled_module", {
    p_module_id: moduleId,
  });
  let quizId: string | null =
    typeof quizIdFromRpc === "string"
      ? quizIdFromRpc
      : Array.isArray(quizIdFromRpc) && quizIdFromRpc?.[0]
        ? String(quizIdFromRpc[0])
        : null;
  if (quizId == null) {
    const { data: quizRow } = await supabase
      .from("quizzes")
      .select("id")
      .eq("module_id", moduleId)
      .maybeSingle();
    quizId = quizRow?.id ?? null;
  }
  const richContent =
    moduleRow.rich_text && typeof moduleRow.rich_text === "object" && "content" in moduleRow.rich_text
      ? String((moduleRow.rich_text as { content?: string }).content ?? "")
      : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {course.title}
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">{moduleRow.title}</h1>
        {moduleRow.description && (
          <p className="mt-2 text-sm text-slate-600">{moduleRow.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {moduleRow.video_url && (
          <LessonVideoPlayer videoUrl={moduleRow.video_url} />
        )}

        {moduleRow.audio_url && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-700">Audio</p>
            <audio src={moduleRow.audio_url} controls className="w-full" />
          </div>
        )}

        {moduleRow.scripture_reference && (
          <div className="rounded-xl border border-slate-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">Scripture:</span> {moduleRow.scripture_reference}
          </div>
        )}

        {richContent && (
          <div className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="whitespace-pre-wrap text-slate-700">{richContent}</div>
          </div>
        )}

        {moduleRow.pdf_url && (
          <a
            href={moduleRow.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-primary/30 hover:bg-primary/5"
          >
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium text-slate-800">Open PDF / document</span>
          </a>
        )}

        {materials.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <Download className="h-5 w-5 text-primary" />
              Lesson resources
            </h2>
            <ul className="space-y-2">
              {materials.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <Download className="h-4 w-4 shrink-0 text-primary" />
                    <span>{m.title}</span>
                    <span className="ml-auto rounded bg-slate-200 px-2 py-0.5 text-xs uppercase text-slate-600">
                      {m.format}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(moduleRow.video_url || moduleRow.audio_url || richContent) && !quizId && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-2 text-sm text-slate-600">Mark this lesson complete when you&apos;ve finished watching or reading.</p>
          <MarkLessonCompleteButton courseId={courseId} moduleId={moduleId} />
        </div>
      )}

      {quizId && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Are you ready to test your knowledge? Take the assessment to see how well you&apos;ve understood this topic.
          </p>
          <Link
            href={`/student/courses/${courseId}/quiz/${quizId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <FileQuestion className="h-4 w-4" />
            Take assessment
          </Link>
        </div>
      )}

      <div className="flex justify-between border-t border-slate-200 pt-6">
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to course
        </Link>
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
