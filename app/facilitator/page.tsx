export default function FacilitatorHomePage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-medium text-slate-500">
            Active courses
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">3</p>
        </div>
        <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-medium text-slate-500">
            Enrolled students
          </p>
          <p className="mt-2 text-2xl font-semibold text-secondary">64</p>
        </div>
        <div className="rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-medium text-slate-500">
            Average quiz score
          </p>
          <p className="mt-2 text-2xl font-semibold text-accent">86%</p>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold text-slate-900">
          Next steps
        </h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Create a new course outline with modules and Scripture readings.</li>
          <li>Upload teaching videos or audio devotions to Supabase Storage.</li>
          <li>Build formative quizzes with explanations and Scripture references.</li>
        </ul>
      </section>
    </div>
  );
}

