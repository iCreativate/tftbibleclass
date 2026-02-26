import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/server";

const defaultSettings = {
  preferred_translation: "ESV",
  notifications: "Email and in-app",
  timezone: "Africa/Johannesburg",
  profile_photo_mode: "Use initials",
  study_reminders: "Evenings, 3x per week",
  theme: "System default"
};

export async function GET() {
  const supabase = createSupabaseServerClient();
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, preferred_translation, notifications, timezone, profile_photo_mode, study_reminders, theme"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const merged = {
    full_name: data?.full_name ?? null,
    email: user.email ?? null,
    preferred_translation:
      data?.preferred_translation ?? defaultSettings.preferred_translation,
    notifications: data?.notifications ?? defaultSettings.notifications,
    timezone: data?.timezone ?? defaultSettings.timezone,
    profile_photo_mode:
      data?.profile_photo_mode ?? defaultSettings.profile_photo_mode,
    study_reminders:
      data?.study_reminders ?? defaultSettings.study_reminders,
    theme: data?.theme ?? defaultSettings.theme
  };

  return NextResponse.json(merged);
}

export async function PUT(request: Request) {
  const supabase = createSupabaseServerClient();
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const payload = {
    full_name: body.full_name,
    preferred_translation: body.preferred_translation,
    notifications: body.notifications,
    timezone: body.timezone,
    profile_photo_mode: body.profile_photo_mode,
    study_reminders: body.study_reminders,
    theme: body.theme
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
