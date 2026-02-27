"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { submitQuizAttempt, type StudentQuizQuestion } from "../actions";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type Phase = "start" | "active" | "submitted";

type Props = {
  courseId: string;
  quizId: string;
  userId: string;
  quiz: { id: string; title: string; description: string | null; passing_score: number; time_limit_seconds: number | null };
  questions: StudentQuizQuestion[];
};

/** Parse fill_in_blank correct_answer: single blank = string[], multi-blank = string[][]. */
function parseFillInBlankCorrect(correct_answer: string | null): { multi: true; count: number } | { multi: false } | null {
  if (!correct_answer?.trimStart().startsWith("[")) return null;
  try {
    const parsed = JSON.parse(correct_answer) as string[] | string[][];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (Array.isArray(parsed[0])) return { multi: true, count: (parsed as string[][]).length };
    return { multi: false };
  } catch {
    return null;
  }
}

export function TakeQuizClient({ courseId, quizId, userId, quiz, questions }: Props) {
  const [phase, setPhase] = useState<Phase>("start");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeLimit = quiz.time_limit_seconds ?? null;

  useEffect(() => {
    if (phase !== "active" || !timeLimit || startedAt == null) return;
    const endAt = startedAt + timeLimit * 1000;
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endAt - now) / 1000));
      setTimeRemainingSeconds(left);
      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLimit, startedAt]);

  function handleStart() {
    setStartedAt(Date.now());
    setPhase("active");
  }

  function handleRetake() {
    setPhase("start");
    setResult(null);
    setAnswers({});
    setStartedAt(null);
    setTimeRemainingSeconds(null);
  }

  function handleChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleChangeBlank(questionId: string, blankIndex: number, value: string) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current) ? [...current] : current != null && current !== "" ? [current] : [];
      while (arr.length <= blankIndex) arr.push("");
      arr[blankIndex] = value;
      return { ...prev, [questionId]: arr };
    });
  }

  function handleChangeMcq(questionId: string, option: string, checked: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current) ? [...current] : [];
      if (checked) return { ...prev, [questionId]: arr.includes(option) ? arr : [...arr, option] };
      return { ...prev, [questionId]: arr.filter((s) => s !== option) };
    });
  }

  /** For match: answer is string[] of option indices (one per stem). */
  function handleChangeMatch(questionId: string, stemIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current) ? [...current] : [];
      const next = [...arr];
      while (next.length <= stemIndex) next.push("");
      next[stemIndex] = String(optionIndex);
      return { ...prev, [questionId]: next };
    });
  }

  function computeScore(): { score: number; maxScore: number } {
    const maxScore = questions.reduce((s, q) => s + (q.points ?? 1), 0);
    const autoTypes = ["mcq", "single_choice", "boolean", "fill_in_blank", "short", "match"];
    let score = 0;
    for (const q of questions) {
      if (!autoTypes.includes(q.type)) continue;
      const raw = answers[q.id];
      const correctRaw = q.correct_answer ?? "";
      let isCorrect = false;
      if (q.type === "boolean") {
        const given = String(Array.isArray(raw) ? raw[0] : raw ?? "").trim().toLowerCase();
        isCorrect = given === correctRaw.trim().toLowerCase();
      } else if (q.type === "fill_in_blank" && correctRaw.trimStart().startsWith("[")) {
        try {
          const parsed = JSON.parse(correctRaw) as string[] | string[][];
          if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
            const acceptedPerBlank = (parsed as string[][]).map((arr) =>
              arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
            );
            const studentArr = Array.isArray(raw) ? raw : raw != null && raw !== "" ? [raw] : [];
            isCorrect =
              studentArr.length === acceptedPerBlank.length &&
              acceptedPerBlank.every((accepted, i) => {
                const given = String(studentArr[i] ?? "").trim().toLowerCase();
                return accepted.length > 0 && accepted.includes(given);
              });
          } else {
            const accepted = (parsed as string[]).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
            const given = String(Array.isArray(raw) ? raw[0] : raw ?? "").trim().toLowerCase();
            isCorrect = accepted.length > 0 && accepted.includes(given);
          }
        } catch {
          const given = String(Array.isArray(raw) ? raw[0] : raw ?? "").trim().toLowerCase();
          isCorrect = given === correctRaw.trim().toLowerCase();
        }
      } else if (q.type === "mcq") {
        const studentArr = Array.isArray(raw) ? raw : raw != null && raw !== "" ? [raw] : [];
        const studentSet = new Set(studentArr.map((s) => String(s).trim().toLowerCase()).filter(Boolean));
        if (correctRaw.trimStart().startsWith("[")) {
          try {
            const correctArr = JSON.parse(correctRaw) as string[];
            const correctSet = new Set((correctArr ?? []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
            isCorrect = correctSet.size > 0 && studentSet.size === correctSet.size && [...studentSet].every((s) => correctSet.has(s));
          } catch {
            const given = [...studentSet][0] ?? "";
            isCorrect = given === correctRaw.trim().toLowerCase();
          }
        } else {
          const given = [...studentSet][0] ?? "";
          isCorrect = given === correctRaw.trim().toLowerCase();
        }
      } else if (q.type === "match" && correctRaw.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(correctRaw) as { stems: string[]; mapping: number[] };
          if (Array.isArray(parsed?.stems) && Array.isArray(parsed?.mapping) && parsed.stems.length === parsed.mapping.length) {
            const studentArr = Array.isArray(raw) ? raw : [];
            const studentMapping = parsed.stems.map((_, i) => parseInt(String(studentArr[i] ?? ""), 10));
            isCorrect =
              studentMapping.length === parsed.mapping.length &&
              studentMapping.every((val, i) => !Number.isNaN(val) && val === parsed.mapping[i]);
          }
        } catch {
          /* ignore */
        }
      } else {
        const given = String(Array.isArray(raw) ? raw[0] : raw ?? "").trim().toLowerCase();
        isCorrect = given === correctRaw.trim().toLowerCase();
      }
      if (isCorrect) score += q.points ?? 1;
    }
    return { score, maxScore };
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const timeTaken = startedAt != null ? Math.round((Date.now() - startedAt) / 1000) : 0;
    const res = await submitQuizAttempt(quizId, userId, answers, timeTaken);
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    const { score, maxScore } = computeScore();
    setResult({ score, maxScore, passed: maxScore > 0 && score / maxScore >= quiz.passing_score / 100 });
    setPhase("submitted");
  }

  if (phase === "start") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-semibold text-slate-900">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-sm text-slate-600">{quiz.description}</p>
        )}
        <ul className="mt-4 space-y-1 text-sm text-slate-500">
          <li>{questions.length} question{questions.length !== 1 ? "s" : ""}</li>
          {quiz.time_limit_seconds != null && (
            <li>Time limit: {Math.ceil(quiz.time_limit_seconds / 60)} minutes</li>
          )}
          <li>Passing score: {quiz.passing_score}%</li>
        </ul>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    const timedOut = timeLimit != null && timeRemainingSeconds !== null && timeRemainingSeconds <= 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="font-medium text-slate-900">{quiz.title}</span>
          {timeLimit != null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                timeRemainingSeconds != null && timeRemainingSeconds <= 60
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Clock className="h-4 w-4" />
              {timeRemainingSeconds != null
                ? `${Math.floor(timeRemainingSeconds / 60)}:${String(timeRemainingSeconds % 60).padStart(2, "0")}`
                : "—"}
            </span>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!timedOut) handleSubmit();
          }}
          className="space-y-6"
        >
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-900">
                <span className="mr-1 text-xs font-semibold text-primary">{i + 1}.</span>
                {q.prompt}
              </p>
              {q.scripture_reference && (
                <p className="mt-1 text-xs text-slate-500">{q.scripture_reference}</p>
              )}
              <div className="mt-3 space-y-2">
                {q.type === "mcq" && q.options?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Select all that apply</p>
                    {q.options.map((opt) => {
                      const selectedArr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                      const selected = selectedArr.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                              selected ? "border-primary bg-primary" : "border-slate-300 bg-white"
                            }`}
                            aria-hidden
                          >
                            {selected ? (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12" aria-hidden><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                            ) : null}
                          </span>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => handleChangeMcq(q.id, opt, e.target.checked)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
                {q.type === "single_choice" && q.options?.length ? (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? "border-primary bg-primary" : "border-slate-300 bg-white"
                            }`}
                            aria-hidden
                          >
                            {selected ? (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            ) : null}
                          </span>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={selected}
                            onChange={() => handleChange(q.id, opt)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
                {q.type === "boolean" && (
                  <div className="flex gap-3">
                    {(["true", "false"] as const).map((val) => {
                      const selected = answers[q.id] === val;
                      return (
                        <label
                          key={val}
                          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? "border-primary bg-primary" : "border-slate-300 bg-white"
                            }`}
                            aria-hidden
                          >
                            {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                          </span>
                          <input
                            type="radio"
                            name={q.id}
                            value={val}
                            checked={selected}
                            onChange={() => handleChange(q.id, val)}
                            className="sr-only"
                          />
                          {val === "true" ? "True" : "False"}
                        </label>
                      );
                    })}
                  </div>
                )}
                {(q.type === "fill_in_blank" || q.type === "short") && (() => {
                  const fillMeta = q.type === "fill_in_blank" ? parseFillInBlankCorrect(q.correct_answer) : null;
                  const isMultiBlank = fillMeta?.multi === true && fillMeta.count > 0;
                  if (q.type === "fill_in_blank" && isMultiBlank) {
                    const blankCount = fillMeta.count;
                    const ansArr = answers[q.id];
                    const arr = Array.isArray(ansArr) ? ansArr : [];
                    return (
                      <div className="space-y-3">
                        {Array.from({ length: blankCount }, (_, bi) => (
                          <div key={bi}>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Blank {bi + 1}
                            </label>
                            <input
                              type="text"
                              value={arr[bi] ?? ""}
                              onChange={(e) => handleChangeBlank(q.id, bi, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder="Your answer..."
                            />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <input
                      type="text"
                      value={Array.isArray(answers[q.id]) ? (answers[q.id] as string[])[0] ?? "" : (answers[q.id] ?? "") as string}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Your answer..."
                    />
                  );
                })()}
                {q.type === "match" && (() => {
                  let stems: string[] = [];
                  try {
                    const parsed = JSON.parse(q.correct_answer ?? "{}") as { stems?: string[] };
                    if (Array.isArray(parsed?.stems)) stems = parsed.stems;
                  } catch {
                    /* ignore */
                  }
                  const opts = q.options ?? [];
                  const ansArr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                  if (stems.length === 0 || opts.length === 0) return <p className="text-sm text-slate-500">Invalid match question.</p>;
                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500">Match each statement with the correct option:</p>
                      {stems.map((stem, si) => (
                        <div key={si} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                          <span className="text-xs font-medium text-slate-500 w-6">{si + 1}.</span>
                          <span className="min-w-0 flex-1 text-sm text-slate-800">{stem}</span>
                          <span className="text-slate-400">→</span>
                          <select
                            id={`match-answer-${q.id}-${si}`}
                            name={`match_answer_${q.id}_${si}`}
                            value={ansArr[si] ?? ""}
                            onChange={(e) => handleChangeMatch(q.id, si, parseInt(e.target.value, 10))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">Choose...</option>
                            {opts.map((opt, j) => (
                              <option key={j} value={j}>
                                {String.fromCharCode(97 + j)}) {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {q.type === "essay" && (
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Your response (will be reviewed by instructor)..."
                  />
                )}
                {q.type === "file_upload" && (
                  <>
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Paste a link or note for your submission (instructor will review).
                    </p>
                    <input
                      type="text"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Link or note..."
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || timedOut}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {timedOut ? "Time expired" : submitting ? "Submitting…" : "Submit quiz"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // phase === "submitted"
  const r = result!;
  const percent = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-slate-900">Quiz submitted</h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-lg font-medium text-slate-700">
          Score: {r.score} / {r.maxScore} ({percent}%)
        </span>
        {r.passed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Passed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
            <XCircle className="h-4 w-4" />
            Not passed (need {quiz.passing_score}%)
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        This attempt has been saved. You can review your quiz history anytime.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {!r.passed && (
          <button
            type="button"
            onClick={handleRetake}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Retake quiz
          </button>
        )}
        <Link
          href="/student/quiz-history"
          className={`rounded-lg px-4 py-2 text-sm font-medium ${r.passed ? "bg-primary text-white hover:bg-primary-700" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
          View quiz history
        </Link>
        <Link
          href={`/student/courses/${courseId}`}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to course
        </Link>
      </div>
    </div>
  );
}
