"use client";

import { useEffect, useMemo, useState } from "react";

import { TutorPanel } from "@/components/tutor-panel";
import { WritingScanner } from "@/components/writing-scanner";
import { parseWordCountMinimum, SyllabusAssignmentType } from "@/lib/syllabus-data";

type AssignmentWorkspaceProps = {
  assignmentId: string;
  title: string;
  type: SyllabusAssignmentType;
  points: number;
  description: string;
  wordCount?: string;
  courseCode: string;
  courseName: string;
  rubric?: Record<string, number>;
  dueDate?: string;
};

type WorkspaceTab = "prepare" | "draft" | "review" | "submit";

type PromptState = {
  id: string;
  content: string;
} | null;

const checklistItems = [
  "Word count meets requirement",
  "At least one real personal example included",
  "All factual claims have APA citations",
  "Writing sounds like my authentic voice",
  "Integrity scanner shows score under 20",
  "Reviewed rubric criteria",
  "Proofread for grammar",
  "Ready to submit to UMGC LEO classroom",
] as const;

function getDraftStorageKey(assignmentId: string) {
  return `cns_draft_${assignmentId}`;
}

function getChecklistStorageKey(assignmentId: string, index: number) {
  return `cns_submit_check_${assignmentId}_${index}`;
}

function readDraft(assignmentId: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(getDraftStorageKey(assignmentId)) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(assignmentId: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getDraftStorageKey(assignmentId), value);
  } catch {}
}

function readChecklistItem(assignmentId: string, index: number) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(getChecklistStorageKey(assignmentId, index)) === "true";
  } catch {
    return false;
  }
}

function writeChecklistItem(assignmentId: string, index: number, checked: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getChecklistStorageKey(assignmentId, index), String(checked));
  } catch {}
}

function getTypeLabel(type: SyllabusAssignmentType) {
  if (type === "discussion") {
    return "Discussion";
  }

  if (type === "assignment") {
    return "Assignment";
  }

  return "Quiz";
}

function getDraftTargetTone(percentOfTarget: number) {
  if (percentOfTarget >= 100) {
    return "text-emerald-300";
  }

  if (percentOfTarget >= 80) {
    return "text-amber-300";
  }

  return "text-rose-300";
}

export function AssignmentWorkspace({
  assignmentId,
  title,
  type,
  points,
  description,
  wordCount,
  courseCode,
  courseName,
  rubric,
  dueDate,
}: AssignmentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("prepare");
  const [draft, setDraft] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<PromptState>(null);
  const [reviewScanKey, setReviewScanKey] = useState(0);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});

  const minWordCount = parseWordCountMinimum(wordCount);
  const wordCountValue = useMemo(() => {
    const trimmed = draft.trim();
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  }, [draft]);

  useEffect(() => {
    setDraft(readDraft(assignmentId));

    const nextChecklistState: Record<number, boolean> = {};
    checklistItems.forEach((_, index) => {
      nextChecklistState[index] = readChecklistItem(assignmentId, index);
    });
    setChecklistState(nextChecklistState);
  }, [assignmentId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      writeDraft(assignmentId, draft);
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [assignmentId, draft]);

  const percentOfTarget = minWordCount ? Math.round((wordCountValue / minWordCount) * 100) : 100;
  const allChecklistComplete = checklistItems.every((_, index) => checklistState[index]);

  function queuePrompt(content: string) {
    setPendingPrompt({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content,
    });
  }

  function saveDraftImmediately(nextDraft: string) {
    writeDraft(assignmentId, nextDraft);
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }

  function handleChecklistToggle(index: number) {
    setChecklistState((current) => {
      const nextValue = !current[index];
      writeChecklistItem(assignmentId, index, nextValue);

      return {
        ...current,
        [index]: nextValue,
      };
    });
  }

  const tabButtonClass = (tab: WorkspaceTab) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      activeTab === tab
        ? "border-accent bg-accent/10 text-text"
        : "border-border/70 bg-panelAlt/50 text-muted hover:border-accent/35 hover:text-text"
    }`;

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Assignment intelligence center</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">{title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-text">
              {getTypeLabel(type)}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">{points} points</span>
            {wordCount ? (
              <span className="rounded-full border border-border/70 px-3 py-1">{wordCount}</span>
            ) : null}
            {dueDate ? (
              <span className="rounded-full border border-border/70 px-3 py-1">Due: {dueDate}</span>
            ) : null}
          </div>
        </div>
        {rubric ? (
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Rubric preview</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(rubric).map(([criterion, value]) => (
                <span
                  key={criterion}
                  className="rounded-full border border-border/70 bg-panelAlt/60 px-3 py-1 text-xs text-muted"
                >
                  {criterion}: {value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("prepare")} className={tabButtonClass("prepare")}>
          Prepare
        </button>
        <button type="button" onClick={() => setActiveTab("draft")} className={tabButtonClass("draft")}>
          Draft
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("review");
            if (draft.trim()) {
              setReviewScanKey(Date.now());
            }
          }}
          className={tabButtonClass("review")}
        >
          Review
        </button>
        <button type="button" onClick={() => setActiveTab("submit")} className={tabButtonClass("submit")}>
          Submit Checklist
        </button>
      </div>

      {activeTab === "prepare" ? (
        <TutorPanel
          courseCode={courseCode}
          courseName={courseName}
          topicTitle={title}
          initialMode={type === "discussion" ? "discussion" : "assignment"}
          unitContext={description}
          initialPrompt={`I've reviewed the ${title} assignment. Before you write anything,
tell me: what is your initial take on this topic based on your cloud experience?
What examples from your work with AWS or Kubernetes come to mind?`}
          initialPromptMode={type === "discussion" ? "discussion" : "assignment"}
          pendingPrompt={
            pendingPrompt
              ? {
                  id: pendingPrompt.id,
                  content: pendingPrompt.content,
                  mode: type === "discussion" ? "discussion" : "assignment",
                }
              : null
          }
          onPendingPromptHandled={() => setPendingPrompt(null)}
        />
      ) : null}

      {activeTab === "draft" ? (
        <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="text-sm leading-7 text-muted">{description}</div>
          <textarea
            value={draft}
            onChange={(event) => {
              const nextDraft = event.target.value;
              setDraft(nextDraft);
              saveDraftImmediately(nextDraft);
            }}
            placeholder="Draft your response here in your own voice..."
            className="mt-5 min-h-[320px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className={getDraftTargetTone(percentOfTarget)}>
              {wordCountValue} words
              {minWordCount ? ` · target ${minWordCount}+` : ""}
            </div>
            <div className="text-muted">
              {lastSavedAt ? `Last saved ${lastSavedAt}` : "Auto-save active every 30 seconds"}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                queuePrompt(`Review this draft in assignment mode and coach me Socratically. Focus on argument strength, where my real cloud experience should go, and what sounds too generic.

${draft}`)
              }
              disabled={!draft.trim()}
              className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
            >
              Get Feedback from Prof. Scholar
            </button>
            <button
              type="button"
              onClick={() =>
                queuePrompt(`Read my draft and identify every claim that needs an APA citation. Tell me exactly where support is required and what source type would fit best.

${draft}`)
              }
              disabled={!draft.trim()}
              className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text disabled:cursor-not-allowed"
            >
              Check APA Citations
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "review" ? (
        <WritingScanner initialText={draft} autoScanKey={reviewScanKey} />
      ) : null}

      {activeTab === "submit" ? (
        <div className="space-y-4 rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Submit checklist</div>
          {checklistItems.map((item, index) => (
            <label
              key={item}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-panel/70 px-4 py-3"
            >
              <span className="text-sm text-text">{item}</span>
              <input
                type="checkbox"
                checked={Boolean(checklistState[index])}
                onChange={() => handleChecklistToggle(index)}
                className="h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
              />
            </label>
          ))}
          {allChecklistComplete ? (
            <div className="rounded-card border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Ready to Submit
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
