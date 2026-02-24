 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

type AuthMode = "login" | "register";

type LandingAuthModalProps = {
  initialMode?: AuthMode;
};

export function LandingAuthModal(props: LandingAuthModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(props.initialMode ?? "login");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleOpenFromEvent(event: Event) {
      if (
        typeof window === "undefined" ||
        !(event instanceof CustomEvent)
      ) {
        return;
      }
      const detail = event.detail as { mode?: AuthMode } | undefined;
      if (detail?.mode) {
        setMode(detail.mode);
      }
      setOpen(true);
    }
    window.addEventListener(
      "tft-open-auth-modal",
      handleOpenFromEvent as EventListener
    );
    return () => {
      window.removeEventListener(
        "tft-open-auth-modal",
        handleOpenFromEvent as EventListener
      );
    };
  }, []);

  function handleOpen(nextMode: AuthMode) {
    setMode(nextMode);
    setOpen(true);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
          scrolled ? "border-b border-slate-200/80 bg-white/95 shadow-soft backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span
            className={`font-heading text-sm font-semibold tracking-wide ${
              scrolled ? "text-slate-900" : "text-white"
            }`}
          >
            TFT Bible Class
          </span>
          <nav className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => handleOpen("register")}
              className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                scrolled
                  ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => handleOpen("login")}
              className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                scrolled
                  ? "text-primary hover:bg-primary/10"
                  : "rounded-xl bg-white/20 px-4 py-2 text-white hover:bg-white/30"
              }`}
            >
              Login
            </button>
          </nav>
        </div>
      </header>
      {open && (
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
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "login"
                  ? "Sign in to continue your journey in Scripture."
                  : "Join TFT Bible Class and start learning at your own pace."}
              </p>
            </div>
            {mode === "login" ? (
              <LoginForm onSuggestRegister={() => setMode("register")} />
            ) : (
              <RegisterForm onAccountExists={() => setMode("login")} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
