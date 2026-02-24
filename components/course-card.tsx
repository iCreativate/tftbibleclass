import Link from "next/link";
import { BookOpen, Clock, Users } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";

export type CourseDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type CourseCardProps = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  enrollmentCount?: number;
  progressPercent?: number;
  href?: string;
};

export function CourseCard(props: CourseCardProps) {
  const {
    id,
    title,
    description,
    thumbnailUrl,
    difficulty,
    estimatedMinutes,
    enrollmentCount,
    progressPercent,
    href,
  } = props;

  const targetHref = href ?? `/courses/${id}`;

  return (
    <Link
      href={targetHref}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary/40">
            <BookOpen className="h-12 w-12" strokeWidth={1.25} />
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-soft">
          {difficulty}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-heading text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {Math.round(estimatedMinutes / 60)} hr
          </span>
          {typeof enrollmentCount === "number" && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {enrollmentCount.toLocaleString()} enrolled
            </span>
          )}
        </div>
        {typeof progressPercent === "number" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Progress</span>
              <span className="font-medium text-slate-700">{Math.round(progressPercent)}%</span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>
        )}
      </div>
    </Link>
  );
}
