"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BookOpen, LayoutDashboard, NotebookTabs, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

type DashboardShellProps = {
  title: string;
  description?: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
};

export function DashboardShell(props: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50/80 md:flex-row">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white shadow-soft lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              TFT
            </p>
            <p className="font-heading text-base font-semibold text-slate-900">
              Bible Class
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {props.navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center", isActive ? "text-primary" : "text-slate-400")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="text-[11px] text-slate-500">“Your word is a lamp to my feet.”</p>
          <p className="font-scripture mt-0.5 text-xs text-slate-600">Psalm 119:105</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-soft backdrop-blur-sm md:px-6 lg:px-8">
          <div>
            <h1 className="font-heading text-lg font-semibold text-slate-900">
              {props.title}
            </h1>
            {props.description && (
              <p className="text-xs text-slate-500 mt-0.5">{props.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-xs text-slate-500 sm:block">
              <NotebookTabs className="mr-1.5 inline h-4 w-4 text-primary" />
              One step at a time.
            </p>
            <LogoutButton />
          </div>
        </header>

        <main className={cn("flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8")}>
          {props.children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-200/80 bg-white/95 shadow-soft backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1 px-2 py-2">
            <Link
              href={props.navItems[0]?.href ?? "/student"}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                pathname === (props.navItems[0]?.href ?? "/student")
                  ? "text-primary bg-primary/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/student/courses"
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                pathname.startsWith("/student/courses")
                  ? "text-primary bg-primary/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <BookOpen className="h-5 w-5" />
              <span>Courses</span>
            </Link>
            <Link
              href="/student/progress"
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                pathname.startsWith("/student/progress")
                  ? "text-primary bg-primary/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <Trophy className="h-5 w-5" />
              <span>Progress</span>
            </Link>
            <Link
              href="/student/profile"
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                pathname.startsWith("/student/profile")
                  ? "text-primary bg-primary/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
