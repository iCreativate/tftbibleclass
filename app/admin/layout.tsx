import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { requireRole } from "@/lib/auth/server";
import { ShieldCheck, Users, Megaphone, BookOpen, ClipboardList, Library, FileCheck, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <ShieldCheck className="h-4 w-4" /> },
  { href: "/admin/courses", label: "Courses", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/admin/quizzes", label: "Quizzes", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/admin/question-banks", label: "Question banks", icon: <Library className="h-4 w-4" /> },
  { href: "/admin/messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/admin/assignments", label: "Assignments", icon: <FileCheck className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
];

const AdminShell = dynamic(() => import("@/components/admin-shell").then((m) => m.AdminShell), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default async function AdminLayout(props: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <AdminShell navItems={navItems}>
      {props.children}
    </AdminShell>
  );
}
