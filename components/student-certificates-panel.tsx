"use client";

type CertificateItem = {
  id: string;
  course_id: string;
  course_title: string;
  awarded_at: string;
};

export function StudentCertificatesPanel({
  certificates = [],
}: {
  certificates?: CertificateItem[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
        <h1 className="font-heading text-base font-semibold text-slate-900">
          Certificates
        </h1>
        <p className="mt-1 text-xs text-slate-700">
          A certificate is added here each time you complete a course (all
          modules and quizzes passed).
        </p>
      </section>
      <section className="space-y-3">
        {certificates.length === 0 && (
          <p className="text-xs text-slate-600">
            No certificates yet. Complete a course to receive your first
            certificate.
          </p>
        )}
        {certificates.map((item) => (
          <article
            key={item.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-xs shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {item.course_title}
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                Course completed
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <p>Completed</p>
              <p>{new Date(item.awarded_at).toLocaleDateString()}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
