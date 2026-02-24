"use client";

import { ArrowRight } from "lucide-react";

export function HeroAuthButton() {
  function handleClick() {
    const event = new CustomEvent("tft-open-auth-modal", {
      detail: { mode: "login" },
    });
    window.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:bg-primary-700 hover:shadow-card-hover active:scale-[0.98]"
      onClick={handleClick}
    >
      Login or create account
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
