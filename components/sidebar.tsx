"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCompletedTopics } from "@/hooks/use-completed-topics";
import { getTopicPosition, pluralize } from "@/lib/course-helpers";
import { getCourseBySlug, getCourses, getPrograms, getTopicBySlug } from "@/lib/programs";

const navItems = [
  { label: "Roadmap", href: "/roadmap", description: "Academic mission control", status: "Live" },
  { label: "Courses", href: "/courses", description: "UMGC course workspace", status: "Live" },
  { label: "Planner", href: "/planner", description: "Coming soon", status: "Soon" },
  { label: "Library", href: "/library", description: "Coming soon", status: "Soon" },
  { label: "Sandbox", href: "/sandbox", description: "Coming soon", status: "Soon" },
];

export function Sidebar() {
  const pathname = usePathname();
  const courses = getCourses();
  const programs = getPrograms();
  const segments = pathname.split("/").filter(Boolean);
  const activeCourseSlug = segments[0] === "courses" ? segments[1] : undefined;
  const activeTopicSlug = segments[0] === "courses" ? segments[2] : undefined;
  const activeCourse = activeCourseSlug ? getCourseBySlug(activeCourseSlug) : undefined;
  const activeTopic =
    activeCourseSlug && activeTopicSlug
      ? getTopicBySlug(activeCourseSlug, activeTopicSlug)
      : undefined;
  const isRoadmap = pathname === "/roadmap";
  const {
    completedTopicSet,
    completedCount,
    totalTopics,
    progressPercent,
    isCompletedCourse,
    isLoaded,
  } = useCompletedTopics(activeCourse);

  const currentFocus = isRoadmap
    ? "Degree roadmap"
    : activeTopic?.title ?? activeCourse?.title ?? "Private academic workspace";
  const nextTopic = activeCourse
    ? activeCourse.topics.find((topic) => !completedTopicSet.has(topic.slug)) ??
      (activeTopic && !isCompletedCourse ? getTopicPosition(activeCourse, activeTopic.slug)?.nextTopic : undefined) ??
      activeCourse.topics[0]
    : undefined;
  const nextTopicIndex =
    nextTopic && activeCourse
      ? activeCourse.topics.findIndex((topic) => topic.slug === nextTopic.slug)
      : -1;
  const actionLabel = !activeCourse
    ? isRoadmap
      ? "Program overview"
      : "Current view"
    : !isLoaded
      ? "Loading progress"
      : isCompletedCourse
        ? "Review completed course"
        : nextTopicIndex >= 0
          ? `Continue with topic ${nextTopicIndex + 1}`
          : "Resume path";
  const actionBody = !activeCourse
    ? isRoadmap
      ? "Track both UMGC programs, credit totals, and bridge concepts from one academic control surface."
      : "Use the roadmap or course workspace to move through the private study environment."
    : !isLoaded
      ? "Saved progress is loading for this browser."
      : isCompletedCourse
        ? "You have finished this course on this device. Revisit the first topic for a review pass."
        : "Jump back into the next topic in the guided sequence.";

  return (
    <aside className="hidden w-72 shrink-0 rounded-shell border border-border/70 bg-panelAlt/85 p-5 shadow-card backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-card border border-accent/20 bg-accent/10 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Cloud Nexus Scholar</p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Private academic workspace</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          A single-learner operating system for the UMGC cloud computing and cybersecurity path.
        </p>
      </div>

      <nav className="mt-6 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-card border px-4 py-3 transition ${
                isActive
                  ? "border-accent/40 bg-accent/10 shadow-card ring-1 ring-accent/20"
                  : "border-border/70 bg-panel/70 hover:border-accent/40 hover:bg-panel"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-text">{item.label}</div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                    item.status === "Live"
                      ? "border-accent/30 text-accent"
                      : "border-border/70 text-muted"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className={`mt-1 text-xs uppercase tracking-[0.18em] ${isActive ? "text-accent" : "text-muted"}`}>
                {item.description}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-card border border-border/70 bg-panel/80 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Workspace scope</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-border/70 bg-panelAlt/50 px-3 py-3">
            <div className="text-muted">Programs</div>
            <div className="mt-2 text-lg font-semibold text-text">{programs.length}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-panelAlt/50 px-3 py-3">
            <div className="text-muted">Courses</div>
            <div className="mt-2 text-lg font-semibold text-text">{courses.length}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-card border border-border/70 bg-panel/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Current focus</div>
            <div className="mt-2 text-lg font-semibold text-text">{currentFocus}</div>
          </div>
          <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
            {pluralize(courses.length, "course")}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          {activeCourse
            ? `${pluralize(activeCourse.topics.length, "topic")} in ${activeCourse.title}.`
            : "Use the roadmap to see the full UMGC path, then move into a course when you want to study."}
        </p>
        {activeCourse && totalTopics > 0 ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted">
              <span>{completedCount} / {totalTopics} topics completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-panelAlt/80 ring-1 ring-inset ring-white/5"
              role="progressbar"
              aria-label={`${activeCourse.title} progress`}
              aria-valuemin={0}
              aria-valuemax={totalTopics}
              aria-valuenow={completedCount}
              aria-valuetext={`${completedCount} of ${totalTopics} topics completed`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/70 via-accent to-accent/85 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
        {activeCourse && nextTopic ? (
          <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-accent">{actionLabel}</div>
            <div className="mt-2 text-sm text-muted">{actionBody}</div>
            <Link
              href={`/courses/${activeCourse.slug}/${nextTopic.slug}`}
              className="mt-3 inline-flex text-sm font-medium text-text transition hover:text-accent"
            >
              {isCompletedCourse ? `Revisit ${nextTopic.title}` : `Open ${nextTopic.title}`}
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-panelAlt/40 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">{actionLabel}</div>
            <div className="mt-2 text-sm text-muted">{actionBody}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
