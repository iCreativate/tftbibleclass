import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canEnrollInNewCourse } from "@/lib/courses";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to enroll." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.courseId as string | undefined;

  if (!courseId) {
    return NextResponse.json({ error: "Course ID required." }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("is_published", true)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found or not available." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!existing) {
    const { allowed, reason } = await canEnrollInNewCourse(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: reason ?? "Complete your current course before enrolling in another." },
        { status: 403 }
      );
    }
  }

  const { error } = await supabase.from("enrollments").insert({
    user_id: session.user.id,
    course_id: courseId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyEnrolled: true });
    }
    if (error.code === "42501") {
      return NextResponse.json(
        { error: "Enrollment is not allowed. Check database policies." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
