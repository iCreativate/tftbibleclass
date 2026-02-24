import { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";
import { LayoutDashboard, BookOpenCheck, Users, ListChecks, LineChart, UploadCloud } from "lucide-react";

export default async function FacilitatorLayout(props: { children: ReactNode }) {
  await requireRole(["facilitator", "admin"]);

  const navItems = [
    {
      href: "/facilitator",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      href: "/facilitator/courses",
      label: "Courses",
      icon: <BookOpenCheck className="h-4 w-4" />
    },
    {
      href: "/facilitator/students",
      label: "Students",
      icon: <Users className="h-4 w-4" />
    },
    {
      href: "/facilitator/quizzes",
      label: "Quizzes",
      icon: <ListChecks className="h-4 w-4" />
    },
    {
      href: "/facilitator/analytics",
      label: "Analytics",
      icon: <LineChart className="h-4 w-4" />
    },
    {
      href: "/facilitator/content",
      label: "Content upload",
      icon: <UploadCloud className="h-4 w-4" />
    }
  ];

  return (
    <DashboardShell
      title="Facilitator Dashboard"
      description="Create courses, manage students, and shepherd learners through Scripture."
      navItems={navItems}
    >
      {props.children}
    </DashboardShell>
  );
}

