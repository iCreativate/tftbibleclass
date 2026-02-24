import { requireRole } from "@/lib/auth/server";
import { getNotesForAdmin } from "./actions";
import { AdminMessagesClient } from "./admin-messages-client";

export default async function AdminMessagesPage() {
  await requireRole("admin");
  const notes = await getNotesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-slate-900">
          Student questions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          View and respond to questions students submit from courses and the messages page.
        </p>
      </div>
      <AdminMessagesClient initialNotes={notes} />
    </div>
  );
}
