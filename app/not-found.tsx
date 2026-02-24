import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-heading text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or was moved.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Back to home
      </Link>
    </main>
  );
}
