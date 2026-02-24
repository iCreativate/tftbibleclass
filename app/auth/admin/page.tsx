import Link from "next/link";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          TFT Bible Class
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-900">
          Admin login
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your admin email and password to access the admin panel.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Sent back here after signing in? Add to <code className="rounded bg-slate-100 px-1">.env.local</code>:{" "}
          <code className="rounded bg-slate-100 px-1">ADMIN_EMAIL_OVERRIDE=your@email.com</code> (your login email), then restart the dev server. Or in Supabase: run migration <strong>20260224200000_profiles_trigger_and_grant_admin.sql</strong>, then <code className="rounded bg-slate-100 px-1">select grant_admin(&apos;your@email.com&apos;);</code>
        </p>
      </div>
      <AdminLoginForm />
      <p className="text-center text-sm text-slate-500">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
