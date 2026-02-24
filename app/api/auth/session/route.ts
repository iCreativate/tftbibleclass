import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/session - Returns current auth state (for debugging admin login).
 * In production returns 200 with ok: false (no 404). In development returns user/role.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Not available in production" });
  }
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ ok: false, user: null, role: null, error: error?.message ?? "No user" });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    role: profile?.role ?? "no-profile",
  });
}
