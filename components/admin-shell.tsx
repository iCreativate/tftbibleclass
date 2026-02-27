"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  ShieldCheck,
  Users,
  Megaphone,
  BookOpen,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export type AdminNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminShellProps = {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  navItems: AdminNavItem[];
  children: ReactNode;
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const base = { label: "Dashboard", href: "/admin" };
  if (pathname === "/admin") return [base];
  if (pathname === "/admin/courses/new")
    return [base, { label: "Courses", href: "/admin/courses" }, { label: "New course" }];
  if (pathname.startsWith("/admin/courses"))
    return [base, { label: "Courses", href: "/admin/courses" }];
  if (pathname.startsWith("/admin/users"))
    return [base, { label: "Users", href: "/admin/users" }];
  if (pathname.startsWith("/admin/quizzes"))
    return [base, { label: "Quizzes", href: "/admin/quizzes" }];
  if (pathname.startsWith("/admin/announcements"))
    return [base, { label: "Announcements", href: "/admin/announcements" }];
  if (pathname.startsWith("/admin/question-banks"))
    return [base, { label: "Question banks", href: "/admin/question-banks" }];
  if (pathname.startsWith("/admin/assignments"))
    return [base, { label: "Assignments", href: "/admin/assignments" }];
  return [base];
}

function getPageTitle(pathname: string): { title: string; description?: string } {
  if (pathname === "/admin")
    return { title: "Dashboard", description: "Overview of your learning platform." };
  if (pathname.startsWith("/admin/courses"))
    return { title: "Courses", description: "Create and manage Bible courses." };
  if (pathname === "/admin/courses/new")
    return { title: "New course", description: "Add a course to the catalogue." };
  if (pathname.startsWith("/admin/quizzes"))
    return { title: "Quizzes", description: "Manage quizzes and assessments." };
  if (pathname.startsWith("/admin/users"))
    return { title: "Users", description: "Manage learners and roles." };
  if (pathname.startsWith("/admin/announcements"))
    return { title: "Announcements", description: "Platform-wide updates." };
  if (pathname.startsWith("/admin/question-banks"))
    return { title: "Question banks", description: "Reusable questions for quizzes." };
  if (pathname.startsWith("/admin/assignments"))
    return { title: "Assignments", description: "Homework and graded submissions." };
  return { title: "Admin" };
}

export function AdminShell(props: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const breadcrumbs = props.breadcrumbs ?? getBreadcrumbs(pathname);
  const pageMeta = getPageTitle(pathname);
  const title = props.title ?? pageMeta.title;
  const description = props.description ?? pageMeta.description;

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-slate-100">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          mobileMenuOpen ? "flex translate-x-0" : "flex -translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">TFT Bible Class</p>
              <p className="text-sm font-semibold text-slate-800">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {props.navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    isActive ? "text-primary" : "text-slate-400"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              TFT Bible Class
            </p>
            <p className="text-sm font-semibold text-slate-800">Admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {props.navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    isActive ? "text-primary" : "text-slate-400"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 min-h-[3.5rem] items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm text-slate-500">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="hover:text-slate-900 transition-colors"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-slate-500 hover:text-slate-700 sm:block"
            >
              View site
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="font-heading text-xl font-semibold text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {props.children}
        </main>
      </div>
    </div>
  );
}
