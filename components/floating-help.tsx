"use client";

import { useState } from "react";

import { ScholarCommandPanel } from "@/components/scholar-command-panel";

export function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-accent bg-accent px-5 py-4 text-sm font-semibold text-slate-950 shadow-card transition hover:bg-accent/90"
      >
        🎓 Ask Prof. Scholar
      </button>

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-panel/95 px-4 pb-4 pt-5 shadow-card backdrop-blur">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-accent">Quick Help</div>
                <div className="mt-1 text-lg font-semibold text-text">Ask Prof. Scholar</div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-border/70 bg-panelAlt/70 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
              >
                Close
              </button>
            </div>

            <ScholarCommandPanel
              title="Quick Question"
              placeholder="Quick question..."
              compact
              showCourseSelector={false}
              initialCourse="CLCS 605"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
