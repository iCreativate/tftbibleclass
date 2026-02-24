import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/course-card";

async function loadPublishedCourses() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title, description, difficulty, estimated_minutes, thumbnail_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export default async function CoursesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    const role = (profile?.role as string) ?? "student";
    if (["student", "facilitator", "admin"].includes(role)) {
      redirect("/student/catalog");
    }
  }

  const courses = await loadPublishedCourses();

  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Course catalog
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
            Explore Bible classes
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Choose a journey through Scripture that fits your season. Each class
            is self-paced, reflective, and rooted in faithful teaching.
          </p>
        </header>
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-card">
              <p className="text-slate-500">No courses available yet. Check back soon.</p>
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description ?? ""}
                thumbnailUrl={course.thumbnail_url}
                difficulty={
                  course.difficulty as "Beginner" | "Intermediate" | "Advanced"
                }
                estimatedMinutes={course.estimated_minutes ?? 60}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
