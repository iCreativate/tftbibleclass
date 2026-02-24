"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getModulesByCourseId, createQuiz } from "../actions";
import { ASSESSMENT_MODE_LABELS, type AssessmentMode } from "../constants";

type CourseOption = { id: string; title: string };
type ModuleOption = { id: string; title: string; index_in_course: number };

export function CreateQuizForm({
  courses,
  initialCourseId,
  initialModuleId,
}: {
  courses: CourseOption[];
  initialCourseId?: string;
  initialModuleId?: string;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [moduleId, setModuleId] = useState(initialModuleId ?? "");
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [quizType, setQuizType] = useState<AssessmentMode>("practice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [randomize, setRandomize] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourseId) setCourseId(initialCourseId);
    if (initialModuleId) setModuleId(initialModuleId);
  }, [initialCourseId, initialModuleId]);

  useEffect(() => {
    if (!courseId) {
      setModules([]);
      setModuleId("");
      return;
    }
    getModulesByCourseId(courseId).then((list) => {
      setModules(list);
      if (initialModuleId && courseId === initialCourseId && list.some((m) => m.id === initialModuleId)) {
        setModuleId(initialModuleId);
      } else if (!initialModuleId || courseId !== initialCourseId) {
        setModuleId("");
      }
    });
  }, [courseId, initialCourseId, initialModuleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Quiz title is required.");
      return;
    }
    if (!moduleId) {
      setError("Please select a lesson (module) to assign the quiz to.");
      return;
    }
    setPending(true);
    const timeLimitSeconds = timeLimitMinutes ? Math.round(parseFloat(timeLimitMinutes) * 60) : null;
    const res = await createQuiz(moduleId, {
      title: trimmedTitle,
      description: description.trim() || null,
      assessment_mode: quizType,
      passing_score: passingScore,
      time_limit_seconds: timeLimitSeconds,
      randomize_questions: randomize,
    });
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.id) {
      router.push(`/admin/quizzes/${res.id}/edit`);
    } else {
      router.push("/admin/quizzes");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="quiz-type" className="block text-sm font-medium text-slate-700">
          Quiz type
        </label>
        <select
          id="quiz-type"
          value={quizType}
          onChange={(e) => setQuizType(e.target.value as AssessmentMode)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {Object.entries(ASSESSMENT_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="course" className="block text-sm font-medium text-slate-700">
          Course
        </label>
        <select
          id="course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="module" className="block text-sm font-medium text-slate-700">
          Lesson (module)
        </label>
        <select
          id="module"
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          disabled={!courseId || modules.length === 0}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
        >
          <option value="">
            {!courseId ? "Select a course first" : modules.length === 0 ? "No lessons in this course" : "Select a lesson"}
          </option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Quiz title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Week 1 Knowledge Check"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the quiz"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="passing" className="block text-sm font-medium text-slate-700">
            Passing score (%)
          </label>
          <input
            id="passing"
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value) || 70)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-slate-700">
            Time limit (minutes, optional)
          </label>
          <input
            id="time"
            type="number"
            min={0}
            step={0.5}
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(e.target.value)}
            placeholder="No limit"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="randomize"
          type="checkbox"
          checked={randomize}
          onChange={(e) => setRandomize(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <label htmlFor="randomize" className="text-sm text-slate-700">
          Randomize question order
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create quiz"}
        </button>
        <Link
          href="/admin/quizzes"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
