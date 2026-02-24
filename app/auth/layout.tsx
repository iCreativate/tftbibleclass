import { ReactNode } from "react";

export default function AuthLayout(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50/60 to-slate-100/80 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            TFT Bible Class
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to continue your journey in Scripture.
          </p>
        </div>
        {props.children}
      </div>
    </div>
  );
}
