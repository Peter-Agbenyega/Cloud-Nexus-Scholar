"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AcademicTaskType,
  academicSessions,
  getActiveAcademicSession,
  weeklyTaskLabels,
  weeklyTaskTypes,
} from "@/lib/academic-plan";
import {
  appendActivityEvent,
  readPlannerTaskChecked,
  writePlannerTaskChecked,
} from "@/lib/app-state";

type PlannerChecklistState = Record<string, boolean>;

function buildTaskId(courseCode: string, taskType: AcademicTaskType) {
  return `${courseCode}-${taskType}`;
}

export default function PlannerPage() {
  const activeSession = getActiveAcademicSession();
  const [weekNumber, setWeekNumber] = useState(1);
  const [checklistState, setChecklistState] = useState<PlannerChecklistState>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const nextState: PlannerChecklistState = {};

      activeSession.courses.forEach((course) => {
        weeklyTaskTypes.forEach((taskType) => {
          nextState[buildTaskId(course.courseCode, taskType)] = readPlannerTaskChecked(
            course.courseCode,
            weekNumber,
            taskType,
          );
        });
      });

      setChecklistState(nextState);
    } catch {
      setChecklistState({});
    }
  }, [activeSession, weekNumber]);

  const reminders = useMemo(() => {
    return activeSession.courses.flatMap((course) =>
      weeklyTaskTypes
        .filter((taskType) => !checklistState[buildTaskId(course.courseCode, taskType)])
        .map((taskType) => ({
          courseCode: course.courseCode,
          courseName: course.courseName,
          taskType,
          overdue: weekNumber <= 1,
        })),
    );
  }, [activeSession.courses, checklistState, weekNumber]);

  function toggleTask(courseCode: string, taskType: AcademicTaskType) {
    setChecklistState((currentState) => {
      const key = buildTaskId(courseCode, taskType);
      const checked = !currentState[key];
      writePlannerTaskChecked(courseCode, weekNumber, taskType, checked);
      appendActivityEvent(
        `${checked ? "Checked" : "Unchecked"} ${weeklyTaskLabels[taskType]} for week ${weekNumber}`,
        courseCode,
      );

      return {
        ...currentState,
        [key]: checked,
      };
    });
  }

  const futureCourses = academicSessions
    .filter((session) => session.id !== activeSession.id)
    .flatMap((session) =>
      session.courses.map((course) => ({
        ...course,
        sessionLabel: session.label,
      })),
    );

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Planner</div>
        <h1 className="mt-3 text-4xl font-semibold text-text">
          Academic Planner — Your UMGC Command Timeline
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted">
          This planner is structured around Peter&apos;s real Cloud Computing Systems and
          Cybersecurity Technology path. The current active session stays in focus, the weekly
          checklist persists locally, and upcoming work stays visible instead of hidden behind a
          generic calendar.
        </p>
      </section>

      <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Program timeline</div>
            <h2 className="mt-2 text-2xl font-semibold text-text">Semester command view</h2>
          </div>
          <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-text">
            Current session: {activeSession.label}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {academicSessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-card border p-4 ${
                session.status === "active"
                  ? "border-accent bg-accent/10"
                  : session.status === "complete"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border/70 bg-panel/60"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-muted">{session.label}</div>
              <div className="mt-2 text-sm text-muted">{session.timeframe}</div>
              <div className="mt-4 space-y-2">
                {session.courses.map((course) => (
                  <div
                    key={course.courseCode}
                    className="rounded-2xl border border-border/70 bg-panelAlt/60 px-3 py-2 text-sm text-text"
                  >
                    <div className="font-semibold">{course.courseCode}</div>
                    <div className="mt-1 text-xs text-muted">{course.courseName}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Weekly execution</div>
            <h2 className="mt-2 text-2xl font-semibold text-text">{activeSession.label}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWeekNumber((currentWeek) => Math.max(1, currentWeek - 1))}
              className="rounded-full border border-border/70 bg-panelAlt/60 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
            >
              Previous week
            </button>
            <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-text">
              Week {weekNumber}
            </div>
            <button
              type="button"
              onClick={() => setWeekNumber((currentWeek) => currentWeek + 1)}
              className="rounded-full border border-border/70 bg-panelAlt/60 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
            >
              Next week
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {activeSession.courses.map((course) => (
              <div
                key={course.courseCode}
                className="rounded-card border border-border/70 bg-panelAlt/60 p-5"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-accent">
                  {course.courseCode}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-text">{course.courseName}</h3>

                <div className="mt-5 space-y-3">
                  {weeklyTaskTypes.map((taskType) => {
                    const taskId = buildTaskId(course.courseCode, taskType);
                    const checked = checklistState[taskId] ?? false;

                    return (
                      <label
                        key={taskType}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-panel/70 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-text">
                            {weeklyTaskLabels[taskType]}
                          </div>
                          <div className="text-xs text-muted">Week {weekNumber}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTask(course.courseCode, taskType)}
                          className="h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-card border border-border/70 bg-panelAlt/60 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Assignment reminders</div>
            <h3 className="mt-2 text-xl font-semibold text-text">Unfinished work</h3>

            <div className="mt-5 space-y-3">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <div
                    key={`${reminder.courseCode}-${reminder.taskType}`}
                    className={`rounded-2xl border px-4 py-3 ${
                      reminder.overdue
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-border/70 bg-panel/70"
                    }`}
                  >
                    <div className="text-sm font-semibold text-text">
                      {reminder.courseCode} · {weeklyTaskLabels[reminder.taskType]}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {reminder.courseName} · Week {weekNumber}
                    </div>
                    <div
                      className={`mt-2 text-xs uppercase tracking-[0.18em] ${
                        reminder.overdue ? "text-amber-300" : "text-muted"
                      }`}
                    >
                      {reminder.overdue ? "Current or overdue" : "Upcoming this week"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-text">
                  All weekly checklist items are complete for the current view.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Upcoming in your program</div>
        <h2 className="mt-2 text-2xl font-semibold text-text">Locked course runway</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {futureCourses.map((course) => (
            <div
              key={`${course.sessionLabel}-${course.courseCode}`}
              className="rounded-card border border-border/70 bg-panel/70 p-5 opacity-80"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text">{course.courseCode}</div>
                <div className="rounded-full border border-border/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                  Locked
                </div>
              </div>
              <div className="mt-2 text-base text-text">{course.courseName}</div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                {course.sessionLabel}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
