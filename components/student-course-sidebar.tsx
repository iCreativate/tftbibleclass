"use client";

import { ProgressBar } from "@/components/progress-bar";
import { BibleReader } from "@/components/bible-reader";
import { ModuleChat } from "@/components/module-chat";

type Props = {
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  progressPercent: number;
  courseId?: string;
};

export function StudentCourseSidebar({
  title,
  difficulty,
  estimatedMinutes,
  progressPercent,
  courseId,
}: Props) {
  return (
    <div className="sticky top-24 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Your progress</h3>
      <ProgressBar value={progressPercent} />
      <p className="text-xs text-slate-600">
        {progressPercent}% of modules completed
      </p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium text-slate-900">Difficulty</p>
          <p className="text-slate-600">{difficulty}</p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Estimated time</p>
          <p className="text-slate-600">{Math.round(estimatedMinutes / 60)} hr</p>
        </div>
      </div>
      <BibleReader />
      <ModuleChat courseTitle={title} courseId={courseId ?? undefined} />
    </div>
  );
}
