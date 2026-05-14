"use client";

import { PromptInputTemplate } from "@/components/prompt-input-template";
import { EMPTY_PROMPT_TEMPLATE, PROMPT_INPUT_TEMPLATE } from "@/lib/prompt-template";

export default function HelpPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Submission template help</div>
        <h1 className="mt-2 text-3xl font-semibold text-text">Strict academic input format</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Cloud Nexus Scholar now expects every academic prompt in one standard structure so the compliance
          controller can verify the header, rubric, APA 7, source recency, peer reply tracking, and humanization checks before a draft is treated as final.
        </p>
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-6">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Copy template</div>
        <pre className="mt-4 overflow-x-auto rounded-3xl border border-border/70 bg-panel/70 p-5 text-sm leading-7 text-text">
          {PROMPT_INPUT_TEMPLATE}
        </pre>
      </div>

      <PromptInputTemplate value={EMPTY_PROMPT_TEMPLATE} onChange={() => undefined} />
    </section>
  );
}
