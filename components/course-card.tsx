"use client";

import Link from "next/link";

import { CourseProgressSnapshot } from "@/lib/course-progress";
import {
  formatTrackLabel,
  getCourseSourceLabel,
  getProgramLabel,
  pluralize,
} from "@/lib/course-helpers";
import { Course } from "@/lib/types";

type CourseCardProps = {
  course: Course;
  progress: CourseProgressSnapshot;
  isLoaded: boolean;
};

export function CourseCard({ course, progress, isLoaded }: CourseCardProps) {
  const { completedCount, totalTopics, progressPercent, isCompletedCourse, isInProgress } = progress;

  const progressLabel = !isLoaded
    ? "Progress loads on this device"
    : isCompletedCourse
      ? "Completed"
      : isInProgress
        ? `${pluralize(completedCount, "topic")} completed`
      : "Ready to start";
  const progressBarWidth = isLoaded ? `${progressPercent}%` : "0%";
  const progressBarTone = isCompletedCourse
    ? "bg-accent"
    : isInProgress
      ? "bg-gradient-to-r from-accent/70 via-accent to-accent/80"
      : "bg-border/80";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={`group rounded-card border p-5 shadow-card transition hover:-translate-y-1 hover:bg-panelAlt ${
        isCompletedCourse
          ? "border-accent/40 bg-accent/10 hover:border-accent/55"
          : isInProgress
            ? "border-accent/20 bg-panelAlt/80 hover:border-accent/40"
            : "border-border/70 bg-panelAlt/70 hover:border-accent/40"
      }`}
      aria-label={`${course.title}, ${progressLabel}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">{course.code}</div>
          <h3 className="mt-3 text-xl font-semibold text-text">{course.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {course.credits} credits
          </span>
          {isLoaded ? (
            <span
              className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
                isCompletedCourse
                  ? "border border-accent/30 bg-accent/15 text-accent"
                  : isInProgress
                    ? "border border-accent/20 bg-accent/10 text-accent"
                    : "border border-border/70 bg-panel/60 text-muted"
              }`}
            >
              {isCompletedCourse ? "Completed" : isInProgress ? "In progress" : "Not started"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted">
        <span className="rounded-full border border-border/70 px-3 py-1">{formatTrackLabel(course.track)}</span>
        <span className="rounded-full border border-border/70 px-3 py-1">{getProgramLabel(course.program, "short")}</span>
        <span className="rounded-full border border-border/70 px-3 py-1">{getCourseSourceLabel(course)}</span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted">{course.description}</p>

      <div className="mt-5">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-panel/80 ring-1 ring-inset ring-white/5"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${progressBarTone} ${
              isLoaded && progressPercent > 0 ? "opacity-100" : "opacity-50"
            }`}
            style={{ width: progressBarWidth }}
          />
        </div>
        <div className="sr-only">
          {isLoaded
            ? `${completedCount} of ${totalTopics} topics completed, ${progressPercent}% progress`
            : "Saved progress will load on this device"}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <div className="space-y-2">
          <div className="text-muted">
            {pluralize(course.topics.length, "topic")} mapped to the course foundation
          </div>
          <div className={`min-h-[1rem] text-xs ${isLoaded ? "text-text" : "text-muted"}`}>
            {isLoaded ? `${completedCount} / ${totalTopics} topics completed` : "Progress synced after load"}
          </div>
        </div>
        <span className="font-medium text-accent transition group-hover:text-text">
          {isCompletedCourse ? "Review course" : isInProgress ? "Resume course" : "View overview"}
        </span>
      </div>
    </Link>
  );
}
