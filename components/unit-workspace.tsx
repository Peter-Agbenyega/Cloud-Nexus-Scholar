"use client";

import { useEffect, useMemo, useState } from "react";

import { AssignmentWorkspace } from "@/components/assignment-workspace";
import { QuickLinksRow } from "@/components/quick-links-row";
import { ScholarCommandPanel } from "@/components/scholar-command-panel";
import { SubmissionReadinessScorer } from "@/components/submission-readiness-scorer";
import {
  parseWordCountMinimum,
  SyllabusAssignment,
  SyllabusCourse,
  SyllabusUnit,
} from "@/lib/syllabus-data";

type UnitWorkspaceProps = {
  course: SyllabusCourse;
  unit: SyllabusUnit;
};

type AssignmentStatus = "not-started" | "in-progress" | "done";

const assignmentStatuses: Array<{ label: string; value: AssignmentStatus }> = [
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

function getAssignmentCheckKey(courseCode: string, assignmentId: string) {
  return `cns_unit_check_${courseCode}_${assignmentId}`;
}

function getAssignmentStatusKey(courseCode: string, assignmentId: string) {
  return `cns_unit_status_${courseCode}_${assignmentId}`;
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

function readStatus(key: string) {
  if (typeof window === "undefined") {
    return "not-started" as AssignmentStatus;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value === "in-progress" || value === "done" ? value : "not-started";
  } catch {
    return "not-started";
  }
}

function writeStatus(key: string, value: AssignmentStatus) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function getTypeLabel(type: SyllabusAssignment["type"]) {
  if (type === "discussion") {
    return "Discussion";
  }

  if (type === "assignment") {
    return "Assignment";
  }

  return "Quiz";
}

export function UnitWorkspace({ course, unit }: UnitWorkspaceProps) {
  const [assignmentChecks, setAssignmentChecks] = useState<Record<string, boolean>>({});
  const [assignmentState, setAssignmentState] = useState<Record<string, AssignmentStatus>>({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(unit.assignments[0]?.id ?? "");

  useEffect(() => {
    const nextChecks: Record<string, boolean> = {};
    const nextStatuses: Record<string, AssignmentStatus> = {};

    unit.assignments.forEach((assignment) => {
      nextChecks[assignment.id] = readBoolean(getAssignmentCheckKey(course.code, assignment.id));
      nextStatuses[assignment.id] = readStatus(getAssignmentStatusKey(course.code, assignment.id));
    });

    setAssignmentChecks(nextChecks);
    setAssignmentState(nextStatuses);
  }, [course.code, unit.assignments]);

  const selectedAssignment =
    unit.assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? unit.assignments[0];

  const unitPromptPlaceholder = `What do you need help with in ${unit.topic}?
Paste your draft, question, or assignment here...`;

  function toggleAssignmentCheck(assignmentId: string) {
    setAssignmentChecks((current) => {
      const nextValue = {
        ...current,
        [assignmentId]: !current[assignmentId],
      };

      writeBoolean(
        getAssignmentCheckKey(course.code, assignmentId),
        Boolean(nextValue[assignmentId]),
      );

      return nextValue;
    });
  }

  function updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    writeStatus(getAssignmentStatusKey(course.code, assignmentId), status);
    setAssignmentState((current) => ({
      ...current,
      [assignmentId]: status,
    }));
  }

  const pointsAtStake = useMemo(
    () => unit.assignments.reduce((sum, assignment) => sum + assignment.points, 0),
    [unit.assignments],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
            {course.code}
          </span>
          <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
            Unit {unit.unit}
          </span>
          <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
            {pointsAtStake} points at stake
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold text-text">
          Unit {unit.unit}: {unit.topic}
        </h1>
      </section>

      <section className="space-y-4 rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">This Week&apos;s Tasks</div>
        <div className="space-y-4">
          {unit.assignments.map((assignment) => {
            const checked = Boolean(assignmentChecks[assignment.id]);

            return (
              <article
                key={assignment.id}
                className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      toggleAssignmentCheck(assignment.id);
                      setSelectedAssignmentId(assignment.id);
                    }}
                    className="flex flex-1 items-start gap-4 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm ${
                        checked
                          ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                          : "border-border/70 text-muted"
                      }`}
                    >
                      {checked ? "✓" : "□"}
                    </span>
                    <div>
                      <div className={`text-xl font-semibold ${checked ? "text-emerald-300 line-through" : "text-text"}`}>
                        {assignment.title}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
                          {getTypeLabel(assignment.type)}
                        </span>
                        <span className="rounded-full border border-border/70 px-3 py-1 text-muted">
                          {assignment.points} points
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-muted">{assignment.dueDate}</div>
                    </div>
                  </button>

                  <div className="w-full max-w-xs">
                    <select
                      value={assignmentState[assignment.id] ?? "not-started"}
                      onChange={(event) =>
                        updateAssignmentStatus(
                          assignment.id,
                          event.target.value as AssignmentStatus,
                        )
                      }
                      className="w-full rounded-2xl border border-border/70 bg-panel px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
                    >
                      {assignmentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <ScholarCommandPanel
        title="Work on This Unit"
        placeholder={unitPromptPlaceholder}
        topicTitle={`Unit ${unit.unit}`}
        fixedCourse={course.code as "CLCS 605" | "CLCS 615"}
        showCourseSelector={false}
      />

      <QuickLinksRow />

      {selectedAssignment ? (
        <>
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
          />

          <SubmissionReadinessScorer
            assignmentId={selectedAssignment.id}
            courseCode={course.code}
            assignmentTitle={selectedAssignment.title}
            requiredWordCount={parseWordCountMinimum(selectedAssignment.requiredWordCount) ?? undefined}
            points={selectedAssignment.points}
          />
        </>
      ) : null}
    </div>
  );
}
