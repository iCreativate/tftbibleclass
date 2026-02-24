import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { getModuleMaterialsForDisplay } from "@/lib/courses";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { Download, FileText, ArrowLeft, Eye, FileQuestion } from "lucide-react";

type Props = { params: { id: string; moduleId: string } };

export default async function LessonPreviewPage({ params }: Props) {
  await requireRole("admin");

  const supabase = createSupabaseServerClient();
  const { data: moduleRow } = await supabase
    .from("modules")
    .select("id, title, description, video_url, audio_url, pdf_url, scripture_reference, rich_text")
    .eq("id", params.moduleId)
    .eq("course_id", params.id)
    .single();

  if (!moduleRow) notFound();

  const materials = await getModuleMaterialsForDisplay(params.moduleId);
  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("module_id", params.moduleId)
    .maybeSingle();
  const quizId = quizRow?.id ?? null;
  const quizTitle = quizRow?.title ?? "Lesson quiz";
  const richContent =
    moduleRow.rich_text && typeof moduleRow.rich_text === "object" && "content" in moduleRow.rich_text
      ? String((moduleRow.rich_text as { content?: string }).content ?? "")
      : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>Preview — this is how students will see this lesson.</span>
      </div>

      <div>
        <Link
          href={`/admin/courses/${params.id}/builder`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course builder
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

        {!moduleRow.video_url && !moduleRow.audio_url && !richContent && !moduleRow.pdf_url && materials.length === 0 && (
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
            No content yet. Edit this lesson to add video, audio, text, or resources.
          </div>
        )}
      </div>

      {quizId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="mb-2 text-sm font-medium text-amber-900">Students will see:</p>
          <Link
            href={`/student/courses/${params.id}/quiz/${quizId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
          >
            <FileQuestion className="h-4 w-4" />
            Take lesson quiz: {quizTitle}
          </Link>
        </div>
      )}

      <div className="flex justify-between border-t border-slate-200 pt-6">
        <Link
          href={`/admin/courses/${params.id}/builder`}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to builder
        </Link>
        <Link
          href={`/admin/courses/${params.id}/lessons/${params.moduleId}`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Edit lesson
        </Link>
      </div>
    </div>
  );
}
