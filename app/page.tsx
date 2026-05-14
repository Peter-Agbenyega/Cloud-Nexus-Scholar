"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { QuickLinksRow } from "@/components/quick-links-row";
import { ScholarCommandPanel } from "@/components/scholar-command-panel";
import { WelcomeGuide } from "@/components/welcome-guide";
import { flashCardsData, studyQuestions } from "@/lib/study-data";

type TutorStatus = "checking" | "online" | "offline";
type WeekChecks = Record<string, boolean>;

const weekCheckStorageKey = "cns_dashboard_week_checks";

const weekPlan = [
  {
    courseCode: "CLCS 605",
    title: "Introduction to Cloud Computing",
    badge: "Summer 2026 · Complete",
    tasks: [
      "All 8 units completed",
      "Projected grade: A",
      "Use Study Intelligence to retain quiz knowledge",
    ],
  },
  {
    courseCode: "CLCS 615",
    title: "Cloud Services and Technologies",
    badge: "Summer 2026 · Complete",
    tasks: [
      "All 8 units completed",
      "Projected grade: A",
      "Use Study Intelligence to reinforce weak areas",
    ],
  },
] as const;

const summerCourses = [
  {
    code: "CLCS 605",
    title: "Introduction to Cloud Computing",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/1",
  },
  {
    code: "CLCS 615",
    title: "Cloud Services and Technologies",
    href: "/courses/clcs-615-cloud-services-and-technologies/unit/1",
  },
] as const;

const fallCourses = [
  { code: "CLCS 625", title: "Cloud Security and Compliance" },
  { code: "CLCS 635", title: "Cloud Infrastructure Management" },
  { code: "CLCS 645", title: "Advanced Cloud Architecture" },
] as const;

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning Peter";
  }

  if (hour < 18) {
    return "Good afternoon Peter";
  }

  return "Good evening Peter";
}

function readWeekChecks() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(weekCheckStorageKey);
    return rawValue ? (JSON.parse(rawValue) as WeekChecks) : {};
  } catch {
    return {};
  }
}

function writeWeekChecks(value: WeekChecks) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(weekCheckStorageKey, JSON.stringify(value));
  } catch {}
}

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState("");
  const [tutorStatus, setTutorStatus] = useState<TutorStatus>("checking");
  const [weekChecks, setWeekChecks] = useState<WeekChecks>({});

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    );
    setWeekChecks(readWeekChecks());
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkTutorStatus() {
      try {
        const response = await fetch("/api/test");

        if (!response.ok) {
          throw new Error("Status check failed.");
        }

        const payload = (await response.json()) as { ok?: boolean };

        if (isMounted) {
          setTutorStatus(payload.ok ? "online" : "offline");
        }
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

  function toggleWeekCheck(key: string) {
    setWeekChecks((current) => {
      const nextValue = {
        ...current,
        [key]: !current[key],
      };

      writeWeekChecks(nextValue);
      return nextValue;
    });
  }

  const tutorBadge = useMemo(() => {
    if (tutorStatus === "online") {
      return {
        label: "Prof. Scholar Online",
        className: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
      };
    }

    if (tutorStatus === "offline") {
      return {
        label: "Prof. Scholar Offline",
        className: "border-rose-400/35 bg-rose-500/10 text-rose-200",
      };
    }

    return {
      label: "Checking Prof. Scholar",
      className: "border-border/70 bg-panelAlt/55 text-muted",
    };
  }, [tutorStatus]);

  return (
    <div className="space-y-8">
      <WelcomeGuide />

      <section className="rounded-card border border-border/70 bg-panel/85 p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="text-2xl font-semibold text-text">Cloud Nexus Scholar</div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-text">{getGreeting()}</div>
            <div className="mt-1 text-sm text-muted">{currentDate}</div>
          </div>
          <div className="flex justify-start lg:justify-end">
            <div className={`rounded-full border px-4 py-2 text-sm font-medium ${tutorBadge.className}`}>
              {tutorBadge.label}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Summer 2026</div>
        <h1 className="mt-2 text-3xl font-semibold text-text">Completed Course Snapshot</h1>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {weekPlan.map((course) => (
            <article key={course.courseCode} className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                  ✅ COMPLETE
                </span>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                  {course.badge}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-text">
                {course.courseCode} — {course.title}
              </h2>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-panel">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-300 via-accent to-accent" />
              </div>
              <div className="mt-2 text-sm text-muted">100%</div>
              <div className="mt-5 space-y-3">
                {course.tasks.map((task) => {
                  const key = `${course.courseCode}_${task}`;
                  const checked = Boolean(weekChecks[key]);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleWeekCheck(key)}
                      className="flex w-full items-start gap-4 rounded-3xl border border-border/70 bg-panel px-4 py-4 text-left transition hover:border-accent/35"
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
                      <span className={`text-base leading-7 ${checked ? "text-emerald-300" : "text-text"}`}>
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <ScholarCommandPanel
        placeholder={`Paste your question, assignment, or discussion
post here... Prof. Scholar will research it,
find real sources, and give you a polished answer`}
        initialCourse="CLCS 605"
        courseStorageKey="cns_dashboard_selected_course"
      />

      <QuickLinksRow />

      <section className="space-y-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Summer 2026</div>
        <div className="grid gap-6 xl:grid-cols-2">
          {summerCourses.map((course) => (
            <article key={course.code} className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                  ✅ COMPLETE
                </span>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                  Projected: A
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-text">
                {course.code} — {course.title}
              </h2>
              <p className="mt-3 text-sm text-muted">All 8 units completed — Summer 2026</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-panelAlt/70">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-300 via-accent to-accent" />
              </div>
              <div className="mt-2 text-sm text-muted">100%</div>
              <Link
                href={course.href}
                className="mt-6 inline-flex rounded-full border border-accent bg-accent px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Open Workspace →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Fall 2026</div>
          <h2 className="mt-2 text-3xl font-semibold text-text">Coming Up</h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {fallCourses.map((course) => (
            <article key={course.code} className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
              <div className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
                📅 UPCOMING
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-text">{course.code}</h3>
              <p className="mt-3 text-base text-text">{course.title}</p>
              <p className="mt-2 text-sm text-muted">Starts Fall 2026</p>
              <Link
                href="/study"
                className="mt-6 inline-flex rounded-full border border-border/70 bg-panelAlt/55 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35"
              >
                Prepare Now →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <article className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Study Intelligence</div>
          <h2 className="mt-2 text-3xl font-semibold text-text">🧠 Study Intelligence</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Flash cards and practice quizzes built from your real Summer 2026 UMGC exam questions.
          </p>
          <div className="mt-4 text-sm text-text">
            {studyQuestions.length} questions · {flashCardsData.length} flash cards
          </div>
          <Link
            href="/study"
            className="mt-6 inline-flex rounded-full border border-accent bg-accent px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-accent/90"
          >
            Study Now →
          </Link>
        </article>
      </section>
    </div>
  );
}
