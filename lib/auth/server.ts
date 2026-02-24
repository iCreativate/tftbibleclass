import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, SessionUser, UserRole } from "./types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const overrideAdminEmail = process.env.ADMIN_EMAIL_OVERRIDE?.trim();
  const isOverrideAdmin =
    overrideAdminEmail &&
    user.email &&
    user.email.toLowerCase() === overrideAdminEmail.toLowerCase();

  const effectiveProfile: Profile | null = isOverrideAdmin
    ? ({
        id: user.id,
        full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        role: "admin"
      } as Profile)
    : (profile ?? ({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        role: "student"
      } as Profile));

  return {
    id: user.id,
    email: user.email ?? null,
    profile: effectiveProfile
  };
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await getSessionUser();

  const loginPath =
    allowed.length === 1 && allowed[0] === "admin" ? "/auth/admin" : "/auth/login";

  if (!user) {
    redirect(loginPath);
  }

  if (user.profile && !allowed.includes(user.profile.role)) {
    redirect(loginPath);
  }

  return user;
}
