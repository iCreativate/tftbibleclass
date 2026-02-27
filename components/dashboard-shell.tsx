"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { BookOpen, LayoutDashboard, Menu, NotebookTabs, Trophy, User, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-slate-50/80 md:flex-row">
      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          mobileMenuOpen ? "flex translate-x-0" : "flex -translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">TFT</p>
              <p className="font-heading text-base font-semibold text-slate-900">Bible Class</p>
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {props.navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
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
          <p className="text-[11px] text-slate-500">&ldquo;Your word is a lamp to my feet.&rdquo;</p>
          <p className="font-scripture mt-0.5 text-xs text-slate-600">Psalm 119:105</p>
        </div>
      </aside>

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

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 min-h-[3.5rem] items-center justify-between gap-3 border-b border-primary-800/30 bg-primary px-4 shadow-soft sm:h-16 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-base font-semibold text-white sm:text-lg">
                {props.title}
              </h1>
              {props.description && (
                <p className="truncate text-xs text-white/80 mt-0.5">{props.description}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <p className="hidden text-xs text-white/80 sm:block">
              <NotebookTabs className="mr-1.5 inline h-4 w-4 text-white/90" />
              One step at a time.
            </p>
            <LogoutButton />
          </div>
        </header>

        <main className={cn("min-w-0 flex-1 px-4 py-4 pb-24 sm:py-6 md:px-6 lg:px-8")}>
          {props.children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-200/80 bg-white/95 shadow-soft backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex w-full max-w-full items-center gap-0.5 overflow-x-auto px-2 py-2">
            {props.navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-none flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                    {item.icon ?? <LayoutDashboard className="h-5 w-5" />}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
