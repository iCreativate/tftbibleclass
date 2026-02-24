"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Library } from "lucide-react";
import { createQuestionBank } from "./actions";
import type { QuestionBankRow } from "./actions";

export function QuestionBanksListClient({ initialBanks }: { initialBanks: QuestionBankRow[] }) {
  const router = useRouter();
  const [banks, setBanks] = useState(initialBanks);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const res = await createQuestionBank(newTitle);
    setCreating(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNewTitle("");
    setShowForm(false);
    router.refresh();
    if (res.id) {
      const id = res.id;
      setBanks((prev) => [...prev, { id, title: newTitle.trim() || "New question bank", created_at: new Date().toISOString() }]);
      router.push(`/admin/question-banks/${id}`);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {banks.length} question bank{banks.length !== 1 ? "s" : ""} — store and reuse questions in quizzes.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          New question bank
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="min-w-[200px] flex-1">
            <span className="block text-xs font-medium text-slate-500 mb-1">Bank name</span>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Bible basics"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
          </label>
          <button type="submit" disabled={creating} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {creating ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={() => { setShowForm(false); setNewTitle(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          All question banks
        </div>
        {banks.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <Library className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No question banks yet.</p>
            <p className="mt-1 text-xs text-slate-400">Create a bank to store reusable quiz questions.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {banks.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <span className="font-medium text-slate-900">{b.title}</span>
                <Link
                  href={`/admin/question-banks/${b.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  View & add questions
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
