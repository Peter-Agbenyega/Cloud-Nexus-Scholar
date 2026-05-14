"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { appendActivityEvent } from "@/lib/app-state";
import { patchAssignmentRecord, readAssignmentRecords } from "@/lib/assignment-store";
import {
  formatUnitWeekLabel,
  getUnitPointsTotal,
  parseWordCountMinimum,
  SyllabusAssignment,
  SyllabusCourse,
  SyllabusUnit,
} from "@/lib/syllabus-data";
import { AssignmentWorkspace } from "@/components/assignment-workspace";
import { TutorPanel } from "@/components/tutor-panel";
import { AssignmentRecord, AssignmentStatus } from "@/lib/types";

type UnitWorkspaceProps = {
  course: SyllabusCourse;
  unit: SyllabusUnit;
};

type PromptMode = "assignment" | "discussion" | "quiz";

type PromptState = {
  id: string;
  content: string;
  mode?: PromptMode;
} | null;

const assignmentStatuses: { label: string; value: AssignmentStatus }[] = [
  { label: "Not started", value: "not_started" },
  { label: "Draft started", value: "draft_started" },
  { label: "Needs revision", value: "needs_revision" },
  { label: "Ready to submit", value: "ready_to_submit" },
  { label: "Submitted", value: "submitted" },
  { label: "Peer replies needed", value: "peer_replies_needed" },
  { label: "Overdue", value: "overdue" },
  { label: "Quiz pending", value: "quiz_pending" },
  { label: "Practical evidence needed", value: "practical_needed" },
];

function getTopicKey(courseCode: string, unitNumber: number, index: number) {
  return `cns_topic_${courseCode}_${unitNumber}_${index}_understood`;
}

function getUnitStartedKey(courseCode: string, unitNumber: number) {
  return `cns_unit_${courseCode}_${unitNumber}_started`;
}

function getDraftKey(assignmentId: string) {
  return `cns_draft_${assignmentId}`;
}

function getGradeKey(courseCode: string, assignmentId: string) {
  return `cns_grade_${courseCode}_${assignmentId}`;
}

function readString(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeString(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function readBoolean(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, String(value));
  } catch {}
}

function getTypeBadge(type: SyllabusAssignment["type"]) {
  if (type === "discussion") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }

  if (type === "assignment") {
    return "border-accent/30 bg-accent/10 text-text";
  }

  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
}

function getStatusBadge(status?: AssignmentStatus) {
  switch (status) {
    case "ready_to_submit":
    case "submitted":
      return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
    case "needs_revision":
    case "peer_replies_needed":
      return "border-amber-400/35 bg-amber-500/10 text-amber-100";
    case "overdue":
    case "practical_needed":
      return "border-rose-400/35 bg-rose-500/10 text-rose-100";
    case "draft_started":
    case "quiz_pending":
      return "border-sky-400/35 bg-sky-500/10 text-sky-100";
    default:
      return "border-border/70 bg-panel/70 text-muted";
  }
}

function formatStatusLabel(status?: AssignmentStatus) {
  return assignmentStatuses.find((item) => item.value === status)?.label ?? "Not started";
}

export function UnitWorkspace({ course, unit }: UnitWorkspaceProps) {
  const [unitStarted, setUnitStarted] = useState(false);
  const [assignmentRecords, setAssignmentRecords] = useState<Record<string, AssignmentRecord>>({});
  const [topicUnderstood, setTopicUnderstood] = useState<Record<number, boolean>>({});
  const [discussionDrafts, setDiscussionDrafts] = useState<Record<string, string>>({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(unit.assignments[0]?.id ?? "");
  const [pendingPrompt, setPendingPrompt] = useState<PromptState>(null);

  useEffect(() => {
    const nextRecords: Record<string, AssignmentRecord> = {};
    const nextTopics: Record<number, boolean> = {};
    const nextDiscussionDrafts: Record<string, string> = {};
    const storedAssignments = readAssignmentRecords();

    unit.assignments.forEach((assignment) => {
      const storedRecord = storedAssignments.find((record) => record.id === assignment.id);
      if (storedRecord) {
        nextRecords[assignment.id] = storedRecord;
      }

      if (assignment.type === "discussion") {
        nextDiscussionDrafts[assignment.id] = readString(getDraftKey(assignment.id));
      }
    });

    unit.subtopics.forEach((_, index) => {
      nextTopics[index] = readBoolean(getTopicKey(course.code, unit.unit, index));
    });

    setAssignmentRecords(nextRecords);
    setTopicUnderstood(nextTopics);
    setDiscussionDrafts(nextDiscussionDrafts);
    setUnitStarted(readBoolean(getUnitStartedKey(course.code, unit.unit)));
  }, [course.code, unit]);

  const understoodCount = useMemo(
    () => Object.values(topicUnderstood).filter(Boolean).length,
    [topicUnderstood],
  );
  const selectedAssignment = unit.assignments.find((assignment) => assignment.id === selectedAssignmentId);
  const discussionAssignments = unit.assignments.filter((assignment) => assignment.type === "discussion");
  const quizAssignments = unit.assignments.filter((assignment) => assignment.type === "quiz");
  const unitContext = `Peter is working on Unit ${unit.unit}: ${unit.topic} in ${course.code}.
He needs to master: ${unit.subtopics.join(", ")}.
His assignments this unit are: ${unit.assignments
    .map((assignment) => `${assignment.title}${assignment.description ? ` — ${assignment.description}` : ""}`)
    .join(" | ")}.
Help him prepare to ace everything in this unit.`;

  function markUnitStarted() {
    writeBoolean(getUnitStartedKey(course.code, unit.unit), true);
    appendActivityEvent(`Marked Unit ${unit.unit} as started`, course.code);
    setUnitStarted(true);
  }

  function updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    const nextRecord = patchAssignmentRecord(assignmentId, { status });
    appendActivityEvent(`Set ${assignmentId} status to ${status}`, course.code);
    setAssignmentRecords((current) => ({
      ...current,
      ...(nextRecord ? { [assignmentId]: nextRecord } : {}),
    }));
  }

  function updateTopicUnderstanding(index: number, checked: boolean) {
    writeBoolean(getTopicKey(course.code, unit.unit, index), checked);
    setTopicUnderstood((current) => ({
      ...current,
      [index]: checked,
    }));
  }

  function updateDiscussionDraft(assignmentId: string, value: string) {
    writeString(getDraftKey(assignmentId), value);
    setDiscussionDrafts((current) => ({
      ...current,
      [assignmentId]: value,
    }));
  }

  function queuePrompt(content: string, mode?: PromptMode) {
    setPendingPrompt({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content,
      mode,
    });
  }

  function handleAssignmentRecordUpdate(nextRecord: AssignmentRecord) {
    setAssignmentRecords((current) => ({
      ...current,
      [nextRecord.id]: nextRecord,
    }));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
                {course.code}
              </span>
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                {formatUnitWeekLabel(unit.unit)}
              </span>
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                {getUnitPointsTotal(unit)} points at stake
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-text">
              Unit {unit.unit}: {unit.topic}
            </h1>
          </div>
          <button
            type="button"
            onClick={markUnitStarted}
            disabled={unitStarted}
            className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
          >
            {unitStarted ? "Unit Started" : "Mark Unit Started"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/70" />
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Assignments Panel</div>
          <div className="h-px flex-1 bg-border/70" />
        </div>
        {unit.assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-card border border-border/70 bg-panel/80 p-6">
            {(() => {
              const assignmentRecord = assignmentRecords[assignment.id];
              const readinessScore = assignmentRecord?.readinessScore ?? 0;
              const status = assignmentRecord?.status ?? (assignment.type === "quiz" ? "quiz_pending" : "not_started");

              return (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs ${getTypeBadge(assignment.type)}`}>
                    {assignment.type === "discussion"
                      ? "Discussion"
                      : assignment.type === "assignment"
                        ? "Assignment"
                        : "Quiz"}
                  </span>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                    {assignment.points} points
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs ${getStatusBadge(status)}`}>
                    {formatStatusLabel(status)}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-text">{assignment.title}</h2>
                <div className="mt-2 text-sm text-muted">Due: {assignment.dueDate}</div>
                {assignment.description ? (
                  <p className="mt-4 text-sm leading-7 text-muted">{assignment.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                  {assignment.requiredWordCount ? (
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      {assignment.requiredWordCount}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    {assignmentRecord?.citationsRequired ? "Citations required" : "Citations not stated"}
                  </span>
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    Readiness {readinessScore}%
                  </span>
                </div>
                {assignmentRecord?.missingItems?.length ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Required action: {assignmentRecord.missingItems[0]}
                  </div>
                ) : null}
              </div>

              <div className="min-w-56 rounded-card border border-border/70 bg-panelAlt/55 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Status</div>
                <select
                  value={status}
                  onChange={(event) =>
                    updateAssignmentStatus(assignment.id, event.target.value as AssignmentStatus)
                  }
                  className="mt-3 w-full rounded-2xl border border-border/70 bg-panel/70 px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
                >
                  {assignmentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
                    <span>Readiness</span>
                    <span>{readinessScore}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent transition-[width] duration-300"
                      style={{ width: `${readinessScore}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAssignmentId(assignment.id);
                      if (typeof window !== "undefined") {
                        window.setTimeout(() => {
                          document.getElementById("unit-tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 0);
                      }
                      queuePrompt(
                        `I'm preparing for ${assignment.title}. Use the full assignment description as context and coach me through how to approach it:

${assignment.description ?? assignment.title}`,
                        assignment.type === "discussion" ? "discussion" : "assignment",
                      );
                    }}
                    className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                  >
                    Prepare with Prof. Scholar
                  </button>
                  <Link
                    href="/library"
                    className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-center text-sm text-muted transition hover:border-accent/35 hover:text-text"
                  >
                    Check Integrity Before Submitting
                  </Link>
                </div>
              </div>
            </div>
              );
            })()}
          </article>
        ))}
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Learning Resources</div>
        <h2 className="mt-2 text-2xl font-semibold text-text">Master the unit concepts</h2>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted">
          <span>
            {understoodCount} of {unit.subtopics.length} subtopics understood
          </span>
          <span>{Math.round((understoodCount / unit.subtopics.length) * 100)}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-panelAlt ring-1 ring-inset ring-white/5">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(understoodCount / unit.subtopics.length) * 100}%` }}
          />
        </div>
        <div className="mt-5 space-y-3">
          {unit.subtopics.map((subtopic, index) => (
            <label
              key={`${unit.unit}-${index}`}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-panelAlt/55 px-4 py-3"
            >
              <div>
                <div className="text-sm text-text">{subtopic}</div>
                <div className="mt-1 text-xs text-muted">I understand this</div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(topicUnderstood[index])}
                onChange={(event) => updateTopicUnderstanding(index, event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
              />
            </label>
          ))}
        </div>
      </section>

      <section id="unit-tutor" className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/70" />
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Professor Scholar — Unit Tutor</div>
          <div className="h-px flex-1 bg-border/70" />
        </div>
        <TutorPanel
          courseCode={course.code}
          courseName={course.name}
          topicTitle={unit.topic}
          unitContext={unitContext}
          initialSilentContext={unitContext}
          pendingPrompt={
            pendingPrompt
              ? {
                  id: pendingPrompt.id,
                  content: pendingPrompt.content,
                  mode: pendingPrompt.mode,
                }
              : null
          }
          onPendingPromptHandled={() => setPendingPrompt(null)}
        />
      </section>

      {discussionAssignments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border/70" />
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Discussion Post Workshop</div>
            <div className="h-px flex-1 bg-border/70" />
          </div>
          {discussionAssignments.map((assignment) => {
            const draft = discussionDrafts[assignment.id] ?? "";
            const minWords = parseWordCountMinimum(assignment.requiredWordCount);
            const wordCount = draft.trim().length > 0 ? draft.trim().split(/\s+/).length : 0;

            return (
              <article key={assignment.id} className="rounded-card border border-border/70 bg-panel/80 p-6">
                <h2 className="text-2xl font-semibold text-text">{assignment.title}</h2>
                {assignment.description ? (
                  <p className="mt-4 text-sm leading-7 text-muted">{assignment.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                  {assignment.requiredWordCount ? (
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      {assignment.requiredWordCount}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    APA reminder: {assignment.citations ?? "APA format required"}
                  </span>
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => updateDiscussionDraft(assignment.id, event.target.value)}
                  placeholder="Draft your discussion post in your own voice..."
                  className="mt-5 min-h-[260px] w-full rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="text-muted">
                    {wordCount} words{minWords ? ` · target ${minWords}+` : ""}
                  </div>
                  <div className="text-muted">
                    {assignment.citations ?? "APA format required"}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      queuePrompt(
                        `Give me Socratic feedback on this UMGC discussion draft. Help me sharpen the argument, ground it in my AWS and DevSecOps experience, and spot generic language without writing the post for me.

${draft}`,
                        "discussion",
                      )
                    }
                    disabled={!draft.trim()}
                    className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
                  >
                    Get Professor Scholar&apos;s Feedback
                  </button>
                  <Link
                    href="/library"
                    className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
                  >
                    Check with Integrity Scanner
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      queuePrompt(
                        `Generate an APA citation template for this discussion post based on the concepts and likely source types involved in ${assignment.title}.`,
                        "discussion",
                      )
                    }
                    className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
                  >
                    Generate Citation Template
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {quizAssignments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border/70" />
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Quiz Preparation Zone</div>
            <div className="h-px flex-1 bg-border/70" />
          </div>
          {quizAssignments.map((assignment) => {
            const storedScore = readString(getGradeKey(course.code, assignment.id));

            return (
              <article key={assignment.id} className="rounded-card border border-border/70 bg-panel/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-text">{assignment.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      Review the exact unit concepts before taking the real quiz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      queuePrompt(
                        `Generate a practice quiz for Unit ${unit.unit} in ${course.code} covering these exact subtopics: ${unit.subtopics.join(", ")}.`,
                        "quiz",
                      )
                    }
                    className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                  >
                    Generate Practice Quiz
                  </button>
                </div>

                <div className="mt-5 rounded-card border border-border/70 bg-panelAlt/55 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Past quiz scores</div>
                  <div className="mt-2 text-sm text-text">
                    {storedScore ? `${storedScore} / ${assignment.points}` : "No saved quiz score yet."}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {unit.subtopics.map((subtopic, index) => (
                    <label
                      key={`${assignment.id}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-panelAlt/55 px-4 py-3"
                    >
                      <span className="text-sm text-text">{subtopic}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(topicUnderstood[index])}
                        onChange={(event) => updateTopicUnderstanding(index, event.target.checked)}
                        className="h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
                      />
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {selectedAssignment ? (
        <AssignmentWorkspace
          assignmentId={selectedAssignment.id}
          title={selectedAssignment.title}
          type={selectedAssignment.type}
          points={selectedAssignment.points}
          description={selectedAssignment.description ?? selectedAssignment.title}
          wordCount={selectedAssignment.requiredWordCount}
          courseCode={course.code}
          courseName={course.name}
          rubric={selectedAssignment.rubric}
          dueDate={selectedAssignment.dueDate}
          onAssignmentUpdate={handleAssignmentRecordUpdate}
        />
      ) : null}
    </div>
  );
}
