"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-heading text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">An error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Try again
      </button>
    </main>
  );
}
