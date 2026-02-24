import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourseWithModulesAndQuizzes, getCourseMaterials } from "@/app/admin/courses/actions";
import { CourseBuilderClient } from "./course-builder-client";

type Props = { params: { id: string }; searchParams: { new?: string } };

export default async function CourseBuilderPage({ params, searchParams }: Props) {
  const data = await getCourseWithModulesAndQuizzes(params.id);
  if (!data?.course) notFound();
  const materials = await getCourseMaterials(data.course.id);
  const isNewCourse = searchParams?.new === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/courses"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Back to courses
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-semibold text-slate-900">
            Course builder: {data.course.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag to reorder lessons, add video lessons, assign course materials, and reuse from the lesson bank.
          </p>
        </div>
      </div>

      <CourseBuilderClient
        courseId={data.course.id}
        course={{ ...data.course }}
        initialModules={data.modules}
        initialMaterials={materials}
        isNewCourse={isNewCourse}
      />
    </div>
  );
}
