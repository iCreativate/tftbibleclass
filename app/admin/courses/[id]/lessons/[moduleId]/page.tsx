import { notFound } from "next/navigation";
import Link from "next/link";
import { getModule, getModuleMaterials } from "@/app/admin/courses/actions";
import { LessonEditorClient } from "./lesson-editor-client";

type Props = { params: { id: string; moduleId: string } };

export default async function LessonEditorPage({ params }: Props) {
  const { module: moduleData, courseTitle } = await getModule(params.moduleId) ?? {};
  if (!moduleData || moduleData.course_id !== params.id) notFound();

  const materials = await getModuleMaterials(params.moduleId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/courses/${params.id}/builder`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          ← Back to course builder
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-slate-900">
          Edit lesson: {moduleData.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {courseTitle} — video, audio, text, and attachments
        </p>
      </div>

      <LessonEditorClient
        courseId={params.id}
        module={moduleData}
        initialMaterials={materials}
      />
    </div>
  );
}
