 "use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SettingsState = {
  name: string;
  email: string;
  preferredTranslation: string;
  notifications: string;
  timezone: string;
  profilePhotoMode: string;
  studyReminders: string;
  theme: string;
};

const defaultState: SettingsState = {
  name: "Demo Student",
  email: "student@example.com",
  preferredTranslation: "ESV",
  notifications: "Email and in-app",
  timezone: "Africa/Johannesburg",
  profilePhotoMode: "Use initials",
  studyReminders: "Evenings, 3x per week",
  theme: "System default"
};

export default function StudentProfilePage() {
  const [settings, setSettings] = useState<SettingsState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const { setTheme } = useTheme();

  function applyThemeFromSetting(value: string) {
    if (value === "Light") {
      setTheme("light");
    } else if (value === "Dark") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/student/settings");
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (cancelled) return;
        setSettings(current => {
          const next: SettingsState = {
            ...current,
            name: data.full_name ?? current.name,
            preferredTranslation:
              data.preferred_translation ?? current.preferredTranslation,
            notifications: data.notifications ?? current.notifications,
            timezone: data.timezone ?? current.timezone,
            profilePhotoMode:
              data.profile_photo_mode ?? current.profilePhotoMode,
            studyReminders:
              data.study_reminders ?? current.studyReminders,
            theme: data.theme ?? current.theme
          };
          return next;
        });
        setDirty(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function persistSettings(next: SettingsState) {
    setSaving(true);
    try {
      const response = await fetch("/api/student/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: next.name,
          preferred_translation: next.preferredTranslation,
          notifications: next.notifications,
          timezone: next.timezone,
          profile_photo_mode: next.profilePhotoMode,
          study_reminders: next.studyReminders,
          theme: next.theme
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Unable to save settings";
        throw new Error(message);
      }
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }

  function updateSettings(partial: Partial<SettingsState>) {
    setSettings(current => ({
      ...current,
      ...partial
    }));
    setDirty(true);
  }

  async function handleSave() {
    try {
      await persistSettings(settings);
      setDirty(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save settings";
      toast.error(message);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      toast.error("Enter and confirm your new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        toast.error(error.message);
        setPasswordSaving(false);
        return;
      }
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch {
      toast.error("Unable to change password right now");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Shape the way you experience Bible Class. Update your details,
          preferences, and security in one gentle, organised place.
        </p>
        <Button
          type="button"
          size="sm"
          disabled={loading || saving || !dirty}
          onClick={handleSave}
          className="h-8 px-3 text-xs"
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-sm text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Profile
          </h2>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-600">Name</span>
              <Input
                id="profile-name"
                name="full_name"
                value={settings.name}
                onChange={event =>
                  updateSettings({ name: event.target.value })
                }
                className="h-9 border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <span className="text-slate-600">Email</span>
              <p className="text-xs font-medium text-slate-900">
                {settings.email}
              </p>
              <p className="text-[11px] text-slate-500">
                Email is managed through your account login.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Security
          </h2>
          <p className="text-xs text-slate-600">
            Refresh your password here whenever you want to strengthen your
            account security.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 h-8 px-3 text-xs"
            onClick={() => setShowPasswordForm(value => !value)}
          >
            Change password
          </Button>
          {showPasswordForm && (
            <form
              className="space-y-2 pt-3 text-xs"
              onSubmit={event => {
                event.preventDefault();
                void handleChangePassword();
              }}
            >
              <div className="space-y-1">
                <span className="text-slate-600">New password</span>
                <Input
                  id="new-password"
                  name="new_password"
                  type="password"
                  value={newPassword}
                  onChange={event => setNewPassword(event.target.value)}
                  className="h-8 border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-1">
                <span className="text-slate-600">Confirm new password</span>
                <Input
                  id="confirm-password"
                  name="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  className="h-8 border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400"
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={passwordSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-sm text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Preferences
          </h2>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-600">Preferred Bible translation</span>
              <select
                value={settings.preferredTranslation}
                onChange={event =>
                  updateSettings({
                    preferredTranslation: event.target.value
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="ESV">ESV</option>
                <option value="NIV">NIV</option>
                <option value="KJV">KJV</option>
                <option value="NKJV">NKJV</option>
                <option value="CSB">CSB</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-slate-600">Notification preferences</span>
              <select
                value={settings.notifications}
                onChange={event =>
                  updateSettings({
                    notifications: event.target.value
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="Email and in-app">Email and in-app</option>
                <option value="Email only">Email only</option>
                <option value="In-app only">In-app only</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-sm text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            More settings
          </h2>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-600">Timezone</span>
              <select
                value={settings.timezone}
                onChange={event =>
                  updateSettings({
                    timezone: event.target.value
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-slate-600">Profile photo</span>
              <select
                value={settings.profilePhotoMode}
                onChange={event =>
                  updateSettings({
                    profilePhotoMode: event.target.value
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="Use initials">Use initials</option>
                <option value="Upload photo">Upload photo</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-slate-600">Study reminders</span>
              <select
                value={settings.studyReminders}
                onChange={event =>
                  updateSettings({
                    studyReminders: event.target.value
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="Evenings, 3x per week">
                  Evenings, 3x per week
                </option>
                <option value="Mornings, daily">Mornings, daily</option>
                <option value="Weekends">Weekends</option>
                <option value="Off">Off</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-slate-600">Theme</span>
              <select
                value={settings.theme}
                onChange={event => {
                  const value = event.target.value;
                  updateSettings({
                    theme: value
                  });
                  applyThemeFromSetting(value);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm outline-none ring-offset-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <option value="System default">System default</option>
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
