import { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";
import { LayoutDashboard, BookOpen, Library, Activity, NotebookPen, Award, User, ClipboardList } from "lucide-react";

export default async function StudentLayout(props: { children: ReactNode }) {
  await requireRole(["student", "facilitator", "admin"]);

  const navItems = [
    {
      href: "/student",
      label: "Home",
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      href: "/student/courses",
      label: "My Courses",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      href: "/student/catalog",
      label: "Catalog",
      icon: <Library className="h-4 w-4" />
    },
    {
      href: "/student/progress",
      label: "Progress",
      icon: <Activity className="h-4 w-4" />
    },
    {
      href: "/student/quiz-history",
      label: "Quiz history",
      icon: <ClipboardList className="h-4 w-4" />
    },
    {
      href: "/student/notes",
      label: "Messages",
      icon: <NotebookPen className="h-4 w-4" />
    },
    {
      href: "/student/certificates",
      label: "Certificates",
      icon: <Award className="h-4 w-4" />
    },
    {
      href: "/student/profile",
      label: "Profile",
      icon: <User className="h-4 w-4" />
    }
  ];

  return (
    <DashboardShell
      title="Student Dashboard"
      description="Return to your courses, messages, and progress in Scripture."
      navItems={navItems}
    >
      {props.children}
    </DashboardShell>
  );
}
