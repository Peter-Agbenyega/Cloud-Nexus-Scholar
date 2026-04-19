"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { academicSessions, getActiveAcademicSession } from "@/lib/academic-plan";
import {
  ActivityEvent,
  getActiveCourseSnapshots,
  getDashboardMetrics,
  getRoadmapCourseStatus,
  getWidthClass,
  readActivityFeed,
} from "@/lib/app-state";

function getGreetingByTime() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

export default function HomePage() {
  const activeSession = getActiveAcademicSession();
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [dashboardMetrics, setDashboardMetrics] = useState(() => getDashboardMetrics());
  const [tutorStatus, setTutorStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setActivityFeed(readActivityFeed().slice(0, 10));
      setDashboardMetrics(getDashboardMetrics());
      setCurrentDate(
        new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date()),
      );
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkTutorStatus() {
      try {
        const response = await fetch("/api/test");

        if (!response.ok) {
          throw new Error("Tutor status check failed");
        }

        const result = (await response.json()) as { ok?: boolean };

        if (!isMounted) {
          return;
        }

        setTutorStatus(result.ok ? "online" : "offline");
      } catch {
        if (isMounted) {
          setTutorStatus("offline");
        }
      }
    }

    void checkTutorStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCourseCards = useMemo(
    () => getActiveCourseSnapshots(["CLCS 605", "CLCS 615"]),
    [],
  );

  const stats = [
    {
      label: "Total topics studied",
      value: String(dashboardMetrics.completedTopics),
    },
    {
      label: "Professor Mode sessions completed",
      value: String(dashboardMetrics.professorSessions),
    },
    {
      label: "Average quiz score",
      value: `${dashboardMetrics.averageQuizScore || 0} / 10`,
    },
    {
      label: "Library entries saved",
      value: String(dashboardMetrics.libraryEntries),
    },
    {
      label: "Current planner completion %",
      value: `${dashboardMetrics.plannerCompletion.percent}%`,
    },
  ];

  const tutorStatusBadge =
    tutorStatus === "online"
      ? {
          className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
          label: "Prof. Scholar — Online",
        }
      : tutorStatus === "offline"
        ? {
            className: "border-rose-500/30 bg-rose-500/10 text-rose-100",
            label: "Tutor offline — check API key",
          }
        : {
            className: "border-border/70 bg-panel/70 text-muted",
            label: "Checking tutor status...",
          };

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Command header</div>
        <h1 className="mt-3 text-5xl font-semibold text-text">Cloud Nexus Scholar</h1>
        <p className="mt-3 text-lg text-muted">Your private UMGC academic command center</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border/70 px-4 py-2 text-sm text-muted">
            {currentDate || "Loading date..."}
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-text">
            Good {getGreetingByTime()}, Peter.
          </span>
          <span
            className={`rounded-full border px-4 py-2 text-sm ${tutorStatusBadge.className}`}
          >
            {tutorStatusBadge.label}
          </span>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {activeCourseCards.map(({ course, progress }) => (
          <article
            key={course.code}
            className="rounded-card border border-border/70 bg-panelAlt/70 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-accent">
                  {course.code}
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-text">{course.title}</h2>
              </div>
              <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-text">
                Active — Summer 2025
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/courses/${course.slug}/${course.topics[0]?.slug ?? ""}`}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Open Tutor
              </Link>
              <Link
                href="/planner"
                className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
              >
                Open Planner
              </Link>
              <Link
                href={`/courses/${course.slug}`}
                className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
              >
                View Topics
              </Link>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
                <span>Progress</span>
                <span>{progress.progressPercent}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-accent/60 to-accent ${getWidthClass(
                    progress.progressPercent,
                  )}`}
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Mastery overview</div>
        <h2 className="mt-2 text-2xl font-semibold text-text">Operating metrics</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card border border-border/70 bg-panelAlt/60 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">{stat.label}</div>
              <div className="mt-3 text-3xl font-semibold text-text">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <article className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Recent activity feed</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">Last 10 actions</h2>

          <div className="mt-5 space-y-3">
            {activityFeed.length > 0 ? (
              activityFeed.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3"
                >
                  <div className="text-sm font-medium text-text">{event.action}</div>
                  <div className="mt-1 text-xs text-muted">
                    {event.courseCode} ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(event.timestamp))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-muted">
                Activity will appear here once you start using the tutor, planner, library, and
                topic pages.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-card border border-border/70 bg-panel/80 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Program roadmap preview</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">Full program in one strip</h2>

          <div className="mt-6 flex flex-wrap gap-3">
            {academicSessions.flatMap((session) =>
              session.courses.map((course) => {
                const status = getRoadmapCourseStatus(course.courseCode);

                return (
                  <div
                    key={`${session.id}-${course.courseCode}`}
                    className={`rounded-full border px-4 py-3 text-sm ${
                      status === "complete"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                        : status === "active"
                          ? "border-accent bg-accent/10 text-text"
                          : "border-border/70 bg-panelAlt/60 text-muted"
                    }`}
                  >
                    <div className="font-semibold">{course.courseCode}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em]">{status}</div>
                  </div>
                );
              }),
            )}
          </div>

          <div className="mt-6 rounded-card border border-border/70 bg-panelAlt/60 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-accent">Current timeline focus</div>
            <div className="mt-2 text-xl font-semibold text-text">{activeSession.label}</div>
            <div className="mt-2 text-sm text-muted">{activeSession.timeframe}</div>
          </div>
        </article>
      </section>
    </div>
  );
}
