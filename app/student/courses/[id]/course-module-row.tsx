"use client";

import Link from "next/link";
import { Download, FileQuestion, ChevronRight, Lock } from "lucide-react";
import type { CourseModuleForStudent } from "@/lib/courses";

type Props = {
  courseId: string;
  module: CourseModuleForStudent;
  index: number;
  isLocked: boolean;
};

const rowContent = (mod: CourseModuleForStudent, index: number, isLocked: boolean) => (
  <>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
      {index + 1}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-medium text-slate-900">{mod.title}</span>
      {mod.description && (
        <span className="block text-xs text-slate-500 line-clamp-1">{mod.description}</span>
      )}
    </span>
    {mod.has_quiz && mod.quiz_id && (
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600" title="This topic has an assessment">
        <FileQuestion className="h-3 w-3" />
        Assessment
      </span>
    )}
    {isLocked ? (
      <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-label="Complete the previous topic first" />
    ) : (
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    )}
  </>
);

export function CourseModuleRow({ courseId, module: mod, index, isLocked }: Props) {
  return (
    <li className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${isLocked ? "bg-slate-50/50" : "transition hover:bg-slate-50"}`}>
      {isLocked ? (
        <span className="flex min-w-0 flex-1 cursor-not-allowed items-center gap-3 text-slate-500" title="Complete the previous topic first">
          {rowContent(mod, index, isLocked)}
        </span>
      ) : (
        <Link href={`/student/courses/${courseId}/lessons/${mod.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          {rowContent(mod, index, isLocked)}
        </Link>
      )}
      {mod.materials.length > 0 && (
        <span className="flex shrink-0 flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {mod.materials.map((m) => (
            <a
              key={m.id}
              href={m.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-primary/10 hover:text-primary"
            >
              <Download className="h-3 w-3" />
              {m.title}
            </a>
          ))}
        </span>
      )}
    </li>
  );
}
