import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCourseMaterialsForDisplay, getCourseModulesWithMaterials, canEnrollInNewCourse } from "@/lib/courses";
import { CourseCard } from "@/components/course-card";
import { EnrollButton } from "@/components/enroll-button";
import { Download, FileText, BookOpen, FileQuestion } from "lucide-react";

type CoursePageProps = {
  params: { id: string };
};

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { id } = params;
  const supabase = createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, difficulty, estimated_minutes, thumbnail_url")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!course) {
    notFound();
  }

  const { data: { session } } = await supabase.auth.getSession();
  let isEnrolled = false;
  let enrollBlocked = false;
  let enrollBlockedReason: string | undefined;
  if (session?.user) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("course_id", id)
      .single();
    isEnrolled = !!enrollment;
    if (!isEnrolled) {
      const check = await canEnrollInNewCourse(session.user.id);
      enrollBlocked = !check.allowed;
      enrollBlockedReason = check.reason;
    }
  }

  const materials = await getCourseMaterialsForDisplay(id);
  const modulesWithMaterials = await getCourseModulesWithMaterials(id);

  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Course detail
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            {course.description ?? ""}
          </p>
          <div className="mt-6">
            {session?.user ? (
              <EnrollButton
                courseId={course.id}
                isEnrolled={isEnrolled}
                enrollmentBlocked={enrollBlocked}
                enrollmentBlockedReason={enrollBlockedReason}
              />
            ) : (
              <Link
                href={`/auth/login?next=${encodeURIComponent(`/courses/${id}`)}`}
                className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Sign in to enroll
              </Link>
            )}
          </div>
        </header>
        <section>
          <CourseCard
            id={course.id}
            title={course.title}
            description={course.description ?? ""}
            thumbnailUrl={course.thumbnail_url}
            difficulty={
              course.difficulty as "Beginner" | "Intermediate" | "Advanced"
            }
            estimatedMinutes={course.estimated_minutes ?? 60}
          />
        </section>

        {modulesWithMaterials.length > 0 && (
          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <BookOpen className="h-5 w-5 text-primary" />
              Curriculum
            </h2>
            <ul className="space-y-4">
              {modulesWithMaterials.map((mod, i) => (
                <li key={mod.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="font-medium text-slate-900">
                    <span className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">
                      {i + 1}
                    </span>
                    {mod.title}
                    {mod.hasQuiz && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        <FileQuestion className="h-3.5 w-3.5" />
                        Quiz
                      </span>
                    )}
                  </p>
                  {mod.materials.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-9">
                      {mod.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-primary/30 hover:bg-primary/5"
                        >
                          <Download className="h-3.5 w-3.5 text-primary" />
                          {m.title}
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{m.format}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {materials.length > 0 && (
          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-primary" />
              Downloadable materials
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
          </section>
        )}

        {modulesWithMaterials.some((mod) => mod.hasQuiz && mod.quiz_id) && (
          <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-amber-900">
              <FileQuestion className="h-5 w-5 text-amber-700" />
              Test your knowledge
            </h2>
            <ul className="space-y-3">
              {modulesWithMaterials
                .filter((mod) => mod.hasQuiz && mod.quiz_id)
                .map((mod) => (
                  <li key={mod.id}>
                    {session?.user && isEnrolled ? (
                      <Link
                        href={`/student/courses/${id}/quiz/${mod.quiz_id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
                      >
                        <FileQuestion className="h-4 w-4" />
                        Test your knowledge – {mod.title}
                      </Link>
                    ) : (
                      <p className="text-sm text-amber-800">
                        Sign in and enroll to take the quiz for {mod.title}.
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
