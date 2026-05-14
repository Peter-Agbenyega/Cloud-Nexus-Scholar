"use client";

import { useEffect, useState } from "react";

const welcomeStorageKey = "cns_welcome_seen";

export function WelcomeGuide() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (window.localStorage.getItem(welcomeStorageKey) !== "true") {
        setIsOpen(true);
      }
    } catch {}
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(welcomeStorageKey, "true");
      } catch {}
    }

    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-xl rounded-card border border-border/70 bg-panel p-6 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Welcome</div>
        <h2 className="mt-2 text-3xl font-semibold text-text">Start here</h2>
        <div className="mt-6 space-y-3 text-base text-muted">
          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-4">
            Step 1: Paste your question or assignment here ↑
          </div>
          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-4">
            Step 2: Click Get Full Answer
          </div>
          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-4">
            Step 3: Copy the result and submit on LEO
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-6 w-full rounded-3xl border border-accent bg-accent px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-accent/90"
        >
          Got it — Let me start
        </button>
      </div>
    </div>
  );
}
