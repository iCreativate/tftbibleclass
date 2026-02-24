import { requireRole } from "@/lib/auth/server";
import { getCertificates } from "@/lib/courses";
import { StudentCertificatesPanel } from "@/components/student-certificates-panel";

export default async function StudentCertificatesPage() {
  const user = await requireRole(["student", "facilitator", "admin"]);
  const certificates = await getCertificates(user.id);
  return <StudentCertificatesPanel certificates={certificates} />;
}
