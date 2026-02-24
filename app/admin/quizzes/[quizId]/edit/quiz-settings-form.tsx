"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuiz } from "../../actions";

type Props = {
  quizId: string;
  initial: {
    title: string;
    description: string | null;
    passing_score: number;
    time_limit_seconds: number | null;
  };
};

export function QuizSettingsForm({ quizId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [passingScore, setPassingScore] = useState(initial.passing_score);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    initial.time_limit_seconds != null ? initial.time_limit_seconds / 60 : ""
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const timeLimitSeconds =
      timeLimitMinutes === "" || timeLimitMinutes == null
        ? null
        : Math.round(Number(timeLimitMinutes) * 60);
    const res = await updateQuiz(quizId, {
      title: title.trim() || "Quiz",
      description: description.trim() || null,
      passing_score: passingScore,
      time_limit_seconds: timeLimitSeconds,
    });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-slate-900">Quiz settings</h2>
      <p className="mt-1 text-sm text-slate-500">Edit title, description, passing score and time limit.</p>
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Settings saved.
        </div>
      )}
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Passing score (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Time limit (minutes, optional)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="No limit"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
