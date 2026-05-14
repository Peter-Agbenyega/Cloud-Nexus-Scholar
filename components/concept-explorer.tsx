"use client";

import { useState } from "react";
import type { Concept } from "@/lib/programs/clcs";

type ConceptExplorerProps = {
  concept: Concept;
  courseCode: string;
  onRequestTutor?: (prompt: string) => void;
};

type DepthTab = "eli10" | "intermediate" | "advanced";

const depthTabs: { label: string; value: DepthTab }[] = [
  { label: "ELI10", value: "eli10" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

export function ConceptExplorer({ concept, courseCode, onRequestTutor }: ConceptExplorerProps) {
  const [activeDepth, setActiveDepth] = useState<DepthTab>("intermediate");

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-semibold text-text">{concept.title}</h3>
        {concept.sourceType === "course-material-derived" ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-300">
            Course Material Derived
          </span>
        ) : null}
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
          {courseCode}
        </span>
      </div>

      {/* ── Depth Tabs ── */}
      <div className="rounded-card border border-border/70 bg-panel/80 p-5">
        <div className="flex gap-2">
          {depthTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveDepth(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeDepth === tab.value
                  ? "border border-accent bg-accent/15 text-accent"
                  : "border border-border/70 text-muted hover:border-accent/30 hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7 text-text">{concept.depth[activeDepth]}</p>
      </div>

      {/* ── Four Panel Grid ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard label="What Is It" content={concept.whatIsIt} />
        <PanelCard label="Why It Matters" content={concept.whyItMatters} />
        <PanelCard label="How It Works" content={concept.howItWorks} />
        <PanelCard label="Where Used" content={concept.whereUsed} />
      </div>

      {/* ── Risk and Security Row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-amber-400/30 bg-amber-500/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-amber-300">What Can Go Wrong</div>
          <p className="mt-2 text-sm leading-7 text-text">{concept.whatCanGoWrong}</p>
        </div>
        <div className="rounded-card border border-emerald-400/30 bg-emerald-500/5 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">How It Is Secured</div>
          <p className="mt-2 text-sm leading-7 text-text">{concept.howSecured}</p>
        </div>
      </div>

      {/* ── UMGC Exam Intel ── */}
      <div className="rounded-card border border-accent/30 bg-accent/5 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          How UMGC Tests This
        </div>
        <p className="mt-2 text-sm leading-7 text-text">{concept.howUMGCTests}</p>
      </div>

      {/* ── Diagram Spec ── */}
      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Diagram Blueprint</div>
        <p className="mt-2 text-sm leading-7 text-text">{concept.diagramSpec}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted">Ask Prof. Scholar to draw this diagram for you</span>
          {onRequestTutor ? (
            <button
              type="button"
              onClick={() =>
                onRequestTutor(
                  `Draw me a diagram for: ${concept.title}. Spec: ${concept.diagramSpec}`,
                )
              }
              className="rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              Request Diagram
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Connections ── */}
      {concept.relatedConcepts.length > 0 || concept.crossCourseLinks.length > 0 ? (
        <div className="space-y-3">
          {concept.relatedConcepts.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Related Concepts</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {concept.relatedConcepts.map((rc) => (
                  <span
                    key={rc}
                    className="rounded-full border border-border/70 bg-panelAlt/55 px-3 py-1 text-xs text-text"
                  >
                    {rc}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {concept.crossCourseLinks.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Cross-Course Links</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {concept.crossCourseLinks.map((link) => (
                  <span
                    key={link}
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-100"
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PanelCard({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-card border border-border/70 bg-panel/80 p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-accent">{label}</div>
      <p className="mt-2 text-sm leading-7 text-text">{content}</p>
    </div>
  );
}
