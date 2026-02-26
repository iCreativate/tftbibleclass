import { requireRole } from "@/lib/auth/server";
import { getEnrolledCoursesWithModules } from "@/lib/courses";
import { ModuleChat } from "@/components/module-chat";

export default async function StudentNotesPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const coursesWithModules = await getEnrolledCoursesWithModules(user.id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-lg font-semibold text-slate-900">
          Messages & reflections
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask questions as you study and return to your conversations when you
          need clarity or encouragement. Each message is linked to a course and optional module.
        </p>
      </section>
      <ModuleChat
        courseTitle="Your messages"
        coursesWithModules={coursesWithModules}
      />
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Your facilitator responses will appear here when available.
        </p>
      </section>
    </div>
  );
}
