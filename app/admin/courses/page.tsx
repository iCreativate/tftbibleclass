import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminCoursesList } from "@/components/admin/courses-list";

async function loadCourses() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, difficulty, estimated_minutes, is_published, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export default async function AdminCoursesPage() {
  const courses = await loadCourses();

  return (
    <div className="space-y-6">
      <AdminCoursesList courses={courses} />
    </div>
  );
}

