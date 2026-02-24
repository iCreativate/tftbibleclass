export default function FaqPage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-slate-50/60 to-slate-100/80">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-semibold text-slate-900">
          Frequently Asked Questions
        </h1>
        <div className="mt-6 space-y-4 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">
              Is TFT Bible Class free to use?
            </p>
            <p className="mt-1">
              Yes. You can enroll in core courses at no cost. Facilitators may
              optionally add premium content in the future, but the goal is to
              keep rich Bible teaching widely accessible.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              Do I have to join at a specific time?
            </p>
            <p className="mt-1">
              No. Courses are fully self-paced. You can study early in the
              morning, on your lunch break, or at night. Your place is saved
              across devices.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

