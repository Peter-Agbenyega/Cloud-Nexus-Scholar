"use client";

import Link from "next/link";

import { useCompletedTopics } from "@/hooks/use-completed-topics";
import { pluralize } from "@/lib/course-helpers";
import { Course } from "@/lib/types";

type CourseDetailCtaProps = {
  course: Course;
};

export function CourseDetailCta({ course }: CourseDetailCtaProps) {
  const { completedTopicSet, completedCount, totalTopics, isLoaded, isCompletedCourse, isInProgress, isNotStarted } =
    useCompletedTopics(course);
  const firstTopic = course.topics[0];
  const nextIncompleteTopic = course.topics.find((topic) => !completedTopicSet.has(topic.slug));
  const nextTopic = nextIncompleteTopic ?? firstTopic;

  if (!nextTopic) {
    return null;
  }

  const panelEyebrow = !isLoaded
    ? "Loading progress"
    : isCompletedCourse
      ? "Course complete"
      : isInProgress
        ? `${pluralize(completedCount, "topic")} completed`
        : "Your progress";
  const ctaLabel = !isLoaded
    ? "Open first topic"
    : isNotStarted
      ? "Begin this course"
      : isCompletedCourse
        ? "Review this course"
        : "Continue from here";
  const description = !isLoaded
    ? "Local progress is loading for this browser, so this panel stays neutral until your saved state is ready."
    : isNotStarted
      ? "Start with the first topic to build context before moving through the rest of the course."
      : isCompletedCourse
        ? "You have finished every topic on this device. Revisit the sequence from the beginning when you want a clean review pass."
        : `Your next topic is ${nextTopic.title}. Resume where you left off on this device.`;

  return (
    <div className="rounded-card border border-accent/30 bg-accent/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-accent">{panelEyebrow}</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          {isLoaded ? (
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
              {completedCount} / {totalTopics} topics completed
            </div>
          ) : null}
        </div>

        <Link
          href={`/courses/${course.slug}/${nextTopic.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
          aria-label={`${ctaLabel}: ${nextTopic.title}`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
