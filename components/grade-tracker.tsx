"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
  getCourseAssignments,
  getSyllabusCourseByCode,
  SyllabusAssignment,
} from "@/lib/syllabus-data";

type GradeTrackerProps = {
  courseCode: string;
};

type GradeEntryState = Record<string, string>;

function getStorageKey(courseCode: string, assignmentId: string) {
  return `cns_grade_${courseCode}_${assignmentId}`;
}

function readStoredGrade(courseCode: string, assignmentId: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(getStorageKey(courseCode, assignmentId)) ?? "";
  } catch {
    return "";
  }
}

function writeStoredGrade(courseCode: string, assignmentId: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(courseCode, assignmentId), value);
  } catch {}
}

function getLetterGrade(pointsEarned: number) {
  if (pointsEarned >= 900) {
    return "A";
  }

  if (pointsEarned >= 800) {
    return "B";
  }

  if (pointsEarned >= 700) {
    return "C";
  }

  return "F";
}

function getGradeTone(pointsEarned: number) {
  if (pointsEarned >= 900) {
    return "text-emerald-300";
  }

  if (pointsEarned >= 800) {
    return "text-accent";
  }

  if (pointsEarned >= 700) {
    return "text-amber-300";
  }

  return "text-rose-300";
}

function getAssignmentGroupLabel(type: SyllabusAssignment["type"]) {
  if (type === "discussion") {
    return "Discussions";
  }

  if (type === "assignment") {
    return "Assignments";
  }

  return "Quizzes";
}

function getProgressWidth(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function GradeTracker({ courseCode }: GradeTrackerProps) {
  const course = getSyllabusCourseByCode(courseCode);
  const [grades, setGrades] = useState<GradeEntryState>({});

  useEffect(() => {
    if (!course) {
      return;
    }

    const nextState: GradeEntryState = {};

    getCourseAssignments(course).forEach((assignment) => {
      nextState[assignment.id] = readStoredGrade(course.code, assignment.id);
    });

    setGrades(nextState);
  }, [course]);

  const assignments = useMemo(() => (course ? getCourseAssignments(course) : []), [course]);

  const gradeSummary = useMemo(() => {
    const categoryTotals = {
      discussion: { earned: 0, possible: 0 },
      assignment: { earned: 0, possible: 0 },
      quiz: { earned: 0, possible: 0 },
    };

    let earned = 0;
    let remainingPossible = 0;

    assignments.forEach((assignment) => {
      const rawValue = grades[assignment.id] ?? "";
      const parsed = rawValue === "" ? null : Number(rawValue);
      const earnedValue =
        parsed !== null && Number.isFinite(parsed)
          ? Math.max(0, Math.min(assignment.points, parsed))
          : null;

      categoryTotals[assignment.type].possible += assignment.points;

      if (earnedValue !== null) {
        categoryTotals[assignment.type].earned += earnedValue;
        earned += earnedValue;
      } else {
        remainingPossible += assignment.points;
      }
    });

    const percent = course ? Number(((earned / course.grading.total) * 100).toFixed(1)) : 0;
    const neededForA = Math.max(0, 900 - earned);
    const neededForB = Math.max(0, 800 - earned);

    return {
      earned,
      percent,
      letter: getLetterGrade(earned),
      remainingPossible,
      categoryTotals,
      neededAverageForA:
        remainingPossible > 0 ? Number(((neededForA / remainingPossible) * 100).toFixed(1)) : 0,
      neededAverageForB:
        remainingPossible > 0 ? Number(((neededForB / remainingPossible) * 100).toFixed(1)) : 0,
      canStillReachA: earned + remainingPossible >= 900,
      canStillReachB: earned + remainingPossible >= 800,
    };
  }, [assignments, course, grades]);

  if (!course) {
    return null;
  }

  function handleGradeChange(assignmentId: string, event: ChangeEvent<HTMLInputElement>) {
    if (!course) {
      return;
    }

    const nextValue = event.target.value;

    setGrades((current) => ({
      ...current,
      [assignmentId]: nextValue,
    }));

    writeStoredGrade(course.code, assignmentId, nextValue);
  }

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/80 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Grade tracker</div>
          <h2 className="mt-2 text-3xl font-semibold text-text">{course.code} grade command</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Live grade calculator across every graded item in the real syllabus.
          </p>
        </div>
        <div className="rounded-card border border-border/70 bg-panelAlt/60 px-5 py-4 text-right">
          <div className={`text-4xl font-semibold ${getGradeTone(gradeSummary.earned)}`}>
            {gradeSummary.percent}%
          </div>
          <div className="mt-2 text-sm text-muted">
            {gradeSummary.earned} / {course.grading.total} points · Grade {gradeSummary.letter}
          </div>
        </div>
      </div>

      {gradeSummary.earned < 800 ? (
        <div className="rounded-card border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          ALERT: Below B average. Graduate probation risk.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { label: "Discussions", key: "discussion", total: course.grading.discussions },
          { label: "Assignments", key: "assignment", total: course.grading.assignments },
          { label: "Quizzes", key: "quiz", total: course.grading.quizzes },
        ].map((item) => {
          const group = gradeSummary.categoryTotals[item.key as keyof typeof gradeSummary.categoryTotals];
          const width = getProgressWidth(group.earned, item.total);

          return (
            <div key={item.label} className="rounded-card border border-border/70 bg-panelAlt/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text">{item.label}</div>
                <div className="text-xs text-muted">
                  {group.earned} / {item.total}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Assignments</div>
        <div className="mt-4 space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="grid gap-3 rounded-2xl border border-border/70 bg-panel/70 px-4 py-4 md:grid-cols-[1.6fr_0.6fr_0.6fr]"
            >
              <div>
                <div className="text-sm font-semibold text-text">{assignment.title}</div>
                <div className="mt-1 text-xs text-muted">{getAssignmentGroupLabel(assignment.type)}</div>
              </div>
              <div className="text-sm text-muted">Possible: {assignment.points}</div>
              <label className="flex items-center gap-3 text-sm text-text">
                <span className="text-muted">Earned</span>
                <input
                  type="number"
                  min={0}
                  max={assignment.points}
                  step="0.1"
                  value={grades[assignment.id] ?? ""}
                  onChange={(event) => handleGradeChange(assignment.id, event)}
                  className="w-28 rounded-full border border-border/70 bg-panelAlt/60 px-4 py-2 text-sm text-text outline-none transition focus:border-accent"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Finish-line math</div>
        <h3 className="mt-2 text-xl font-semibold text-text">What do I need on remaining assignments?</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-4">
            <div className="text-sm font-semibold text-text">To finish with an A</div>
            <div className="mt-2 text-sm text-muted">
              {gradeSummary.canStillReachA
                ? `Average ${gradeSummary.neededAverageForA}% on the remaining ${gradeSummary.remainingPossible} points.`
                : "An A is no longer mathematically available with the points remaining."}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-4">
            <div className="text-sm font-semibold text-text">To finish with a B</div>
            <div className="mt-2 text-sm text-muted">
              {gradeSummary.canStillReachB
                ? `Average ${gradeSummary.neededAverageForB}% on the remaining ${gradeSummary.remainingPossible} points.`
                : "A B is no longer mathematically available with the points remaining."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
