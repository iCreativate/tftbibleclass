"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export function AdminAuthModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("tft-open-admin-modal", handleOpen);
    return () => {
      window.removeEventListener("tft-open-admin-modal", handleOpen);
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-fade-in">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            TFT Bible Class
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-slate-900">
            Admin login
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your admin email and password to access the admin panel.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
