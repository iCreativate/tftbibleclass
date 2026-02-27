"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { addQuestionToBank, deleteQuestionFromBank, type QuestionBankQuestionRow } from "../actions";
import { QUESTION_TYPES } from "../constants";

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  boolean: "True/False",
  short: "Short answer",
  essay: "Essay",
  fill_in_blank: "Fill in the blank",
};

export function QuestionBankDetailClient({
  bankId,
  bankTitle,
  initialQuestions,
}: {
  bankId: string;
  bankTitle: string;
  initialQuestions: QuestionBankQuestionRow[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  useEffect(() => { setQuestions(initialQuestions); }, [initialQuestions]);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"mcq" | "boolean" | "short" | "essay" | "fill_in_blank">("mcq");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState(1);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const opts = type === "mcq" ? options.split("\n").map((s) => s.trim()).filter(Boolean) : null;
    const res = await addQuestionToBank(bankId, {
      type,
      prompt: prompt.trim() || "Question",
      options: opts ?? undefined,
      correct_answer: correctAnswer.trim() || undefined,
      points: points >= 1 ? points : 1,
    });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setPrompt("");
    setOptions("");
    setCorrectAnswer("");
    setPoints(1);
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await deleteQuestionFromBank(id);
    if (!res.error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" />
        Add question
      </button>

          {showForm && (
        <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label htmlFor="bank-question-type" className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select
              id="bank-question-type"
              name="bank_question_type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Question / prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          {type === "mcq" && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Options (one per line)</label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="A\nB\nC\nD"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Correct answer</label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={type === "boolean" ? "true or false" : "Answer"}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Points</label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {pending ? "Adding…" : "Add question"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          Questions ({questions.length})
        </div>
        {questions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No questions yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {questions.map((q, i) => (
              <li key={q.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-slate-400">#{i + 1} · {TYPE_LABELS[q.type] ?? q.type}</span>
                  <p className="mt-0.5 font-medium text-slate-900">{q.prompt}</p>
                  {q.correct_answer && <p className="mt-1 text-xs text-slate-500">Answer: {q.correct_answer}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  className="shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
