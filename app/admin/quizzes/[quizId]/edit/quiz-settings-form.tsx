"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoursesForQuizCreate, getModulesByCourseId, reassignQuizToModule, updateQuiz } from "../../actions";

type Props = {
  quizId: string;
  initial: {
    title: string;
    description: string | null;
    passing_score: number;
    time_limit_seconds: number | null;
    module_id: string;
    course_id: string | null;
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

  // Assignment
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseId, setCourseId] = useState(initial.course_id ?? "");
  const [modules, setModules] = useState<{ id: string; title: string; index_in_course: number }[]>([]);
  const [moduleId, setModuleId] = useState(initial.module_id);
  const [assignPending, setAssignPending] = useState(false);
  const [assignSaved, setAssignSaved] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    getCoursesForQuizCreate().then(setCourses);
  }, []);

  useEffect(() => {
    if (!courseId) {
      setModules([]);
      return;
    }
    getModulesByCourseId(courseId).then((list) => {
      setModules(list);
      // If current module doesn't belong to this course, clear it.
      if (moduleId && !list.some((m) => m.id === moduleId)) setModuleId("");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

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

  async function handleReassign(e: React.FormEvent) {
    e.preventDefault();
    setAssignError(null);
    setAssignSaved(false);
    if (!courseId) {
      setAssignError("Please select a course.");
      return;
    }
    if (!moduleId) {
      setAssignError("Please select a topic/lesson (module).");
      return;
    }
    setAssignPending(true);
    const res = await reassignQuizToModule(quizId, moduleId);
    setAssignPending(false);
    if (res.error) {
      setAssignError(res.error);
      return;
    }
    setAssignSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
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
              id="quiz-title"
              name="title"
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
              id="quiz-description"
              name="description"
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
                id="quiz-passing-score"
                name="passing_score"
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
                id="quiz-time-limit"
                name="time_limit_minutes"
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

      <form onSubmit={handleReassign} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Assignment</h2>
        <p className="mt-1 text-sm text-slate-500">Assign this quiz to a course and topic (module).</p>
        {assignError && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{assignError}</div>
        )}
        {assignSaved && (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Assignment updated.
          </div>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="assign-course" className="mb-1 block text-xs font-medium text-slate-500">
              Course
            </label>
            <select
              id="assign-course"
              name="course_id"
              value={courseId}
              onChange={(e) => {
                setAssignSaved(false);
                setAssignError(null);
                setCourseId(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
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
            <label htmlFor="assign-module" className="mb-1 block text-xs font-medium text-slate-500">
              Topic / lesson (module)
            </label>
            <select
              id="assign-module"
              name="module_id"
              value={moduleId}
              onChange={(e) => {
                setAssignSaved(false);
                setAssignError(null);
                setModuleId(e.target.value);
              }}
              disabled={!courseId || modules.length === 0}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">
                {!courseId ? "Select a course first" : modules.length === 0 ? "No topics in this course" : "Select a topic"}
              </option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={assignPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {assignPending ? "Saving…" : "Save assignment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
