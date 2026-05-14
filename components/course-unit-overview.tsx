"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GradeTracker } from "@/components/grade-tracker";
import { SkillsPanel } from "@/components/skills-panel";
import {
  GRADUATE_MIN_GRADE,
  getUnitPointsTotal,
  SyllabusCourse,
  SyllabusUnit,
} from "@/lib/syllabus-data";

type CourseUnitOverviewProps = {
  course: SyllabusCourse;
};

type UnitProgressState = {
  unitNumber: number;
  understoodCount: number;
  totalSubtopics: number;
  hasStarted: boolean;
  allAssignmentsSubmitted: boolean;
  assignmentStatuses: string[];
};

function getTopicKey(courseCode: string, unitNumber: number, index: number) {
  return `cns_topic_${courseCode}_${unitNumber}_${index}_understood`;
}

function getAssignmentStatusKey(assignmentId: string) {
  return `cns_assignment_${assignmentId}_status`;
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

function getUnitStatus(progress: UnitProgressState) {
  if (progress.allAssignmentsSubmitted && progress.assignmentStatuses.length > 0) {
    return {
      label: "Complete",
      className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-100",
    };
  }

  if (progress.hasStarted || progress.understoodCount > 0) {
    return {
      label: "In Progress",
      className: "border-amber-400/35 bg-amber-500/10 text-amber-100",
    };
  }

  return {
    label: "Not Started",
    className: "border-border/70 bg-panel/70 text-muted",
  };
}

function buildUnitProgress(course: SyllabusCourse, unit: SyllabusUnit): UnitProgressState {
  const understoodCount = unit.subtopics.reduce((total, _, index) => {
    return total + (readBoolean(getTopicKey(course.code, unit.unit, index)) ? 1 : 0);
  }, 0);

  const assignmentStatuses = unit.assignments.map((assignment) =>
    readString(getAssignmentStatusKey(assignment.id)),
  );
  const allAssignmentsSubmitted =
    assignmentStatuses.length > 0 &&
    assignmentStatuses.every((status) => status === "submitted" || status === "complete");

  return {
    unitNumber: unit.unit,
    understoodCount,
    totalSubtopics: unit.subtopics.length,
    hasStarted: readBoolean(`cns_unit_${course.code}_${unit.unit}_started`),
    allAssignmentsSubmitted,
    assignmentStatuses,
  };
}

export function CourseUnitOverview({ course }: CourseUnitOverviewProps) {
  const [progressState, setProgressState] = useState<Record<number, UnitProgressState>>({});

  useEffect(() => {
    function syncProgress() {
      const nextState: Record<number, UnitProgressState> = {};

      course.units.forEach((unit) => {
        nextState[unit.unit] = buildUnitProgress(course, unit);
      });

      setProgressState(nextState);
    }

    syncProgress();

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("storage", syncProgress);
    window.addEventListener("focus", syncProgress);

    return () => {
      window.removeEventListener("storage", syncProgress);
      window.removeEventListener("focus", syncProgress);
    };
  }, [course]);

  const gradingSegments = useMemo(
    () => [
      {
        label: "Discussions",
        points: course.grading.discussions,
        width: (course.grading.discussions / course.grading.total) * 100,
        className: "bg-sky-400",
      },
      {
        label: "Assignments",
        points: course.grading.assignments,
        width: (course.grading.assignments / course.grading.total) * 100,
        className: "bg-accent",
      },
      {
        label: "Quizzes",
        points: course.grading.quizzes,
        width: (course.grading.quizzes / course.grading.total) * 100,
        className: "bg-emerald-400",
      },
    ],
    [course.grading],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent">{course.code}</div>
            <h2 className="mt-2 text-3xl font-semibold text-text">{course.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Real syllabus-aligned unit workspace for Summer 2026.
            </p>
          </div>
          <div className="rounded-card border border-border/70 bg-panelAlt/60 px-5 py-4 text-sm text-muted">
            <div>{course.credits} credits</div>
            <div className="mt-1">{course.startDate} to {course.endDate}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Instructor</div>
            <div className="mt-2 text-lg font-semibold text-text">{course.instructorName}</div>
            <a
              href={`mailto:${course.instructorEmail}`}
              className="mt-2 inline-flex text-sm text-accent transition hover:text-text"
            >
              {course.instructorEmail}
            </a>
          </div>

          <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Passing floor</div>
            <div className="mt-2 text-lg font-semibold text-text">
              B ({Math.round((GRADUATE_MIN_GRADE / 100) * course.grading.total)}/{course.grading.total} points)
            </div>
            <div className="mt-2 text-sm text-muted">
              Graduate requirement: minimum {GRADUATE_MIN_GRADE}% average.
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Grading breakdown</div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
            <div className="flex h-full">
              {gradingSegments.map((segment) => (
                <div key={segment.label} className={segment.className} style={{ width: `${segment.width}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            {gradingSegments.map((segment) => (
              <div key={segment.label} className="rounded-full border border-border/70 px-3 py-1">
                {segment.label}: {segment.points}
              </div>
            ))}
            <div className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-text">
              Total points: {course.grading.total}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-100">
          Graduate requirement: you must maintain a 3.0 GPA. A grade of C or below places you on Academic Probation.
        </div>
      </section>

      <section className="space-y-4">
        {course.units.map((unit) => {
          const progress = progressState[unit.unit];
          const status = progress ? getUnitStatus(progress) : getUnitStatus({
            unitNumber: unit.unit,
            understoodCount: 0,
            totalSubtopics: unit.subtopics.length,
            hasStarted: false,
            allAssignmentsSubmitted: false,
            assignmentStatuses: [],
          });

          return (
            <article key={unit.unit} className="rounded-card border border-border/70 bg-panel/80 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-accent">Unit {unit.unit}</div>
                  <h3 className="mt-2 text-2xl font-semibold text-text">{unit.topic}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      {unit.assignments.length} assignments
                    </span>
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      {getUnitPointsTotal(unit)} points
                    </span>
                    <span className={`rounded-full border px-3 py-1 ${status.className}`}>{status.label}</span>
                  </div>
                </div>
                <Link
                  href={`/courses/${course.slug}/unit/${unit.unit}`}
                  className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                >
                  Open Unit Workspace
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {unit.assignments.map((assignment) => (
                  <span
                    key={assignment.id}
                    className="rounded-full border border-border/70 bg-panelAlt/55 px-3 py-1 text-xs text-muted"
                  >
                    {assignment.title}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/70" />
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Grade Command Center</div>
          <div className="h-px flex-1 bg-border/70" />
        </div>
        <GradeTracker courseCode={course.code} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/70" />
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Skills Framework</div>
          <div className="h-px flex-1 bg-border/70" />
        </div>
        <SkillsPanel courseCode={course.code} />
      </section>
    </div>
  );
}
