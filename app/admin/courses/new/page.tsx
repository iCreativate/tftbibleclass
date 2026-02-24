import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCourseForm } from "@/components/admin/new-course-form";

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">
          New course
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a course to the catalogue. Publish it to make it visible to all students.
        </p>
        <div className="mt-6">
          <NewCourseForm />
        </div>
      </div>
    </div>
  );
}
