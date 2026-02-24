import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, BookOpen, UserCheck, Plus, Megaphone, ClipboardList } from "lucide-react";

async function loadAdminOverview() {
  const supabase = createSupabaseServerClient();
  const [
    { count: userCount },
    { count: courseCount },
    { count: enrollmentCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
  ]);

  return {
    userCount: userCount ?? 0,
    courseCount: courseCount ?? 0,
    enrollmentCount: enrollmentCount ?? 0,
  };
}

export default async function AdminHomePage() {
  const { userCount, courseCount, enrollmentCount } = await loadAdminOverview();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Users className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Total users</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{userCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Learners, facilitators, admins</p>
          </div>
        </div>
        <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Courses</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{courseCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Draft and published</p>
          </div>
        </div>
        <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Enrollments</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollmentCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Active enrollments</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Getting started</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Create courses, add modules, and publish so learners can enroll. Use the
            Users section to view roles and adjust permissions. Announcements let you
            share updates with everyone on the platform.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/admin/courses"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Create new course
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/quizzes"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Quizzes & assessments
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Manage users
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/announcements"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Announcements
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
