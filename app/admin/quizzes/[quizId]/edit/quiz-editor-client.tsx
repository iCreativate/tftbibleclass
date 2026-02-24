"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import {
  addQuizQuestion,
  deleteQuizQuestion,
  type QuizQuestionRow,
  type MatchCorrectAnswer,
} from "../../actions";
import { QUIZ_QUESTION_TYPES, QUIZ_QUESTION_TYPE_LABELS, type QuizQuestionType } from "../../constants";

const BLANK_PATTERN = /_{3,}/g;

/** Count blanks in prompt (each ___ or longer underscore run = one blank). */
function countBlanksInPrompt(text: string): number {
  const m = text.match(BLANK_PATTERN);
  return m ? m.length : 0;
}

/** Optional short label before each blank (e.g. "1.1" from "Man is 1.1 ___"). */
function getBlankLabels(promptText: string): string[] {
  const parts = promptText.split(BLANK_PATTERN).filter(Boolean);
  const labels: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i].trim();
    const match = before.match(/(\d+\.?\d*|\S+)$/);
    labels.push(match ? match[1] : `#${i + 1}`);
  }
  return labels;
}

function formatCorrectAnswer(type: string, correct_answer: string | null): string {
  if (!correct_answer) return "—";
  if (type === "mcq" && correct_answer.trimStart().startsWith("[")) {
    try {
      const parsed = JSON.parse(correct_answer) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return `Correct: ${parsed.join(", ")}`;
    } catch {
      /* ignore */
    }
  }
  if (type === "fill_in_blank" && correct_answer.trimStart().startsWith("[")) {
    try {
      const parsed = JSON.parse(correct_answer) as string[] | string[][];
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        return (parsed as string[][]).map((arr, i) => `Blank ${i + 1}: ${arr.join(" or ")}`).join("; ");
      }
      if (Array.isArray(parsed) && parsed.length > 1) return `Any of: ${(parsed as string[]).join(", ")}`;
      if (Array.isArray(parsed) && parsed.length === 1) return (parsed as string[])[0];
    } catch {
      /* ignore */
    }
  }
  if (type === "match" && correct_answer.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(correct_answer) as MatchCorrectAnswer;
      if (parsed?.stems?.length) return `Match ${parsed.stems.length} statement(s) to options`;
    } catch {
      /* ignore */
    }
  }
  return correct_answer;
}

export function QuizEditorClient({
  quizId,
  quizTitle,
  initialQuestions,
}: {
  quizId: string;
  quizTitle: string;
  initialQuestions: QuizQuestionRow[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<QuizQuestionType>("mcq");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [scriptureReference, setScriptureReference] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1);
  /** Per-blank accepted answers for fill_in_blank (each blank = array of accepted strings). */
  const [blankAnswers, setBlankAnswers] = useState<string[][]>([]);
  /** For MCQ: selected option texts that are correct (multiple allowed). */
  const [correctAnswersMcq, setCorrectAnswersMcq] = useState<string[]>([]);
  /** For match: left column statements (stems) and per-stem correct option index. */
  const [matchStems, setMatchStems] = useState<string[]>([""]);
  const [matchMapping, setMatchMapping] = useState<number[]>([0]);

  const blankCount = type === "fill_in_blank" ? countBlanksInPrompt(prompt) : 0;
  const mcqOptions = (type === "mcq" && options) ? options.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const matchOptions = (type === "match" && options) ? options.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const blankLabels = type === "fill_in_blank" ? getBlankLabels(prompt) : [];

  useEffect(() => {
    if (type !== "mcq") setCorrectAnswersMcq([]);
  }, [type]);

  useEffect(() => {
    if (type !== "match") {
      setMatchStems([""]);
      setMatchMapping([0]);
    }
  }, [type]);

  useEffect(() => {
    if (type !== "fill_in_blank" || blankCount === 0) {
      setBlankAnswers([]);
      return;
    }
    setBlankAnswers((prev) => {
      const next = [...prev];
      while (next.length < blankCount) next.push([]);
      return next.slice(0, blankCount);
    });
  }, [type, blankCount]);

  function toggleMcqCorrect(optionText: string) {
    setCorrectAnswersMcq((prev) =>
      prev.includes(optionText) ? prev.filter((s) => s !== optionText) : [...prev, optionText]
    );
  }

  function setBlankAnswerForIndex(blankIndex: number, value: string) {
    const answers = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    setBlankAnswers((prev) => {
      const next = [...prev];
      next[blankIndex] = answers;
      return next;
    });
  }

  function addMatchStem() {
    setMatchStems((prev) => [...prev, ""]);
    setMatchMapping((prev) => [...prev, 0]);
  }
  function setMatchStemAt(i: number, value: string) {
    setMatchStems((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }
  function setMatchMappingAt(stemIndex: number, optionIndex: number) {
    setMatchMapping((prev) => {
      const next = [...prev];
      next[stemIndex] = optionIndex;
      return next;
    });
  }
  function removeMatchStemAt(i: number) {
    if (matchStems.length <= 1) return;
    setMatchStems((prev) => prev.filter((_, idx) => idx !== i));
    setMatchMapping((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const opts = (type === "mcq" || type === "single_choice" || type === "match") ? options.split("\n").map((s) => s.trim()).filter(Boolean) : null;
    const correctVal: string | string[] | string[][] | MatchCorrectAnswer | undefined =
      type === "fill_in_blank"
        ? blankCount > 0
          ? blankAnswers.map((arr) => (arr.length === 0 ? [] : arr))
          : undefined
        : type === "mcq"
          ? (correctAnswersMcq.length > 0 ? correctAnswersMcq : undefined)
          : type === "match"
            ? (() => {
                const pairs = matchStems
                  .map((s, i) => ({ stem: s.trim(), optionIndex: matchMapping[i] ?? 0 }))
                  .filter((p) => p.stem !== "");
                if (pairs.length === 0 || matchOptions.length === 0) return undefined;
                return { stems: pairs.map((p) => p.stem), mapping: pairs.map((p) => p.optionIndex) };
              })()
            : ["single_choice", "boolean"].includes(type)
              ? (correctAnswer.trim() || undefined)
              : undefined;
    if (type === "fill_in_blank" && Array.isArray(correctVal)) {
      const blanks = correctVal as string[][];
      const allFilled = blanks.length === blankCount && blanks.every((arr) => arr.some(Boolean));
      if (!allFilled) {
        setError(`Add at least one accepted answer for each blank (${blankCount} blank(s) detected).`);
        setPending(false);
        return;
      }
    }
    if (type === "mcq" && (!correctVal || !Array.isArray(correctVal) || correctVal.length === 0)) {
      setError("Select at least one correct answer for the multiple choice question.");
      setPending(false);
      return;
    }
    if (type === "match") {
      const matchVal = correctVal as MatchCorrectAnswer | undefined;
      if (!matchVal || matchVal.stems.length === 0) {
        setError("Add at least one statement and assign its correct option.");
        setPending(false);
        return;
      }
      if (matchOptions.length === 0) {
        setError("Add at least one option (right column, e.g. scripture references).");
        setPending(false);
        return;
      }
      const invalid = matchVal.mapping.some((idx) => idx < 0 || idx >= matchOptions.length);
      if (invalid) {
        setError("Each statement must be matched to a valid option.");
        setPending(false);
        return;
      }
    }
    const res = await addQuizQuestion(quizId, {
      type,
      prompt: prompt.trim() || "Question",
      options: opts ?? undefined,
      correct_answer: correctVal,
      scripture_reference: scriptureReference.trim() || undefined,
      explanation: explanation.trim() || undefined,
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
    setCorrectAnswersMcq([]);
    setBlankAnswers([]);
    setMatchStems([""]);
    setMatchMapping([0]);
    setScriptureReference("");
    setExplanation("");
    setPoints(1);
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await deleteQuizQuestion(id);
    if (!res.error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">
          Build quiz: {quizTitle}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add questions below. Auto-graded (MCQ, True/False, Fill in blank, Match) and manual grading (Essay, File upload) are supported.
        </p>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Add question
        </button>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Question type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuizQuestionType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {QUIZ_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {QUIZ_QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Question / prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={type === "fill_in_blank" ? 4 : 3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder={
                  type === "fill_in_blank"
                    ? "Use ___ (3+ underscores) for each blank. E.g.: Man is 1.1 ___ ; who lives in 1.2 ___ ; possessing 1.3 ___."
                    : "Enter the question text..."
                }
                required
              />
              {type === "fill_in_blank" && prompt.trim() && (
                <p className="mt-1 text-xs text-slate-500">
                  {blankCount === 0
                    ? "Add at least one blank using ___ (three or more underscores) in the text above."
                    : `${blankCount} blank(s) detected — add accepted answers for each below.`}
                </p>
              )}
            </div>

            {(type === "mcq" || type === "single_choice" || type === "match") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  {type === "match" ? "Options (right column — e.g. scripture refs, one per line)" : "Options (one per line)"}
                </label>
                <textarea
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={type === "match" ? "Galatians 3:13&#10;Romans 6:23&#10;Romans 8:1&#10;2 Corinthians 5:18" : "Option A&#10;Option B&#10;Option C&#10;Option D"}
                />
              </div>
            )}

            {type === "match" && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-600">
                  Statements (left column) — add each statement, then choose the correct option for each
                </p>
                {matchStems.map((stem, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-8">{i + 1}.</span>
                    <input
                      type="text"
                      value={stem}
                      onChange={(e) => setMatchStemAt(i, e.target.value)}
                      className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="e.g. We are redeemed from the curse of the law"
                    />
                    <label className="flex items-center gap-1.5 text-sm">
                      <span className="text-slate-500">→</span>
                      <select
                        value={matchMapping[i] ?? 0}
                        onChange={(e) => setMatchMappingAt(i, parseInt(e.target.value, 10))}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      >
                        {matchOptions.length === 0 ? (
                          <option value={0}>Add options above</option>
                        ) : (
                          matchOptions.map((opt, j) => (
                            <option key={j} value={j}>
                              {String.fromCharCode(97 + j)}) {opt}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeMatchStemAt(i)}
                      disabled={matchStems.length <= 1}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label="Remove statement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMatchStem}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add statement
                </button>
              </div>
            )}

            {type === "mcq" && mcqOptions.length > 0 && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-600">
                  Correct answers (select all that apply)
                </p>
                <div className="flex flex-wrap gap-2">
                  {mcqOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={correctAnswersMcq.includes(opt)}
                        onChange={() => toggleMcqCorrect(opt)}
                        className="h-4 w-4 rounded border-slate-300 text-primary"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {["single_choice", "boolean"].includes(type) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Correct answer
                </label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={type === "boolean" ? "true or false" : "Exact option text"}
                />
              </div>
            )}

            {type === "fill_in_blank" && blankCount > 0 && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-600">
                  Accepted answers for each blank (one or more per line; any will be accepted)
                </p>
                {Array.from({ length: blankCount }, (_, i) => (
                  <div key={i}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Blank {i + 1}
                      {blankLabels[i] ? ` (${blankLabels[i]})` : ""}
                    </label>
                    <textarea
                      value={(blankAnswers[i] ?? []).join("\n")}
                      onChange={(e) => setBlankAnswerForIndex(i, e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="spirit&#10;soul"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Scripture reference (optional)
                </label>
                <input
                  type="text"
                  value={scriptureReference}
                  onChange={(e) => setScriptureReference(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. John 3:16"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Points
                </label>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Explanation / feedback (optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Shown after submission (for auto-graded) or after review"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add question"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="mt-8">
          <h3 className="border-b border-slate-100 px-0 pb-2 text-sm font-medium text-slate-700">
            Questions ({questions.length})
          </h3>
          {questions.length === 0 ? (
            <p className="mt-4 text-center text-sm text-slate-500">
              No questions yet. Add one above to build the quiz.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-slate-400">
                      #{i + 1} · {QUIZ_QUESTION_TYPE_LABELS[q.type as QuizQuestionType] ?? q.type}
                    </span>
                    <p className="mt-0.5 font-medium text-slate-900">{q.prompt}</p>
                    {q.correct_answer != null && q.correct_answer !== "" && (
                      <p className="mt-1 text-xs text-slate-500">
                        Answer: {formatCorrectAnswer(q.type, q.correct_answer)}
                      </p>
                    )}
                    {q.scripture_reference && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Ref: {q.scripture_reference}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="shrink-0 rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
