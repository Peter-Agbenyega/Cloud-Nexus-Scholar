"use client";

import Link from "next/link";

import { ScholarCommandPanel } from "@/components/scholar-command-panel";

export default function WorkspacePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Workspace</div>
        <h1 className="mt-2 text-3xl font-semibold text-text">Assignment Workspace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Run the existing Prof. Scholar pipeline, switch between completed Summer courses and Fall
          2026 prep courses, then save polished answers to the library.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/study"
            className="rounded-full border border-border/70 bg-panelAlt/55 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35"
          >
            Open Study Intelligence →
          </Link>
          <Link
            href="/library"
            className="rounded-full border border-border/70 bg-panelAlt/55 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35"
          >
            Open Library →
          </Link>
        </div>
      </section>

      <ScholarCommandPanel
        title="Prof. Scholar Workspace"
        placeholder={`Paste your assignment, quiz prompt, or discussion topic here.
Prof. Scholar will run the 3-stage pipeline and return a polished answer.`}
        initialCourse="CLCS 605"
        courseStorageKey="cns_workspace_selected_course"
      />
    </div>
  );
}
