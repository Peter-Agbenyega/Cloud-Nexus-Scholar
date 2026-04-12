"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { useCatalogProgress } from "@/hooks/use-catalog-progress";
import {
  getProgramLabel,
  getTotalCreditHours,
  getTotalTopicCount,
  pluralize,
} from "@/lib/course-helpers";
import { getCourseBySlug, getCourses, getPrograms, getTopicBySlug } from "@/lib/programs";

export function Header() {
  const pathname = usePathname();
  const courses = getCourses();
  const programs = getPrograms();
  const { catalogProgress, isLoaded } = useCatalogProgress(courses);
  const segments = pathname.split("/").filter(Boolean);
  const courseSlug = segments[0] === "courses" ? segments[1] : undefined;
  const topicSlug = segments[0] === "courses" ? segments[2] : undefined;
  const course = courseSlug ? getCourseBySlug(courseSlug) : undefined;
  const topic = courseSlug && topicSlug ? getTopicBySlug(courseSlug, topicSlug) : undefined;
  const activeRoot = segments[0] ?? "roadmap";

  const title =
    topic?.title ??
    course?.title ??
    (activeRoot === "roadmap"
      ? "Academic roadmap"
      : activeRoot === "courses"
        ? "Course workspace"
        : activeRoot === "planner"
          ? "Planner"
          : activeRoot === "library"
            ? "Library"
            : activeRoot === "sandbox"
              ? "Sandbox"
              : "Private academic workspace");

  const eyebrow = topic
    ? "Concept session"
    : course
      ? "Course overview"
      : activeRoot === "roadmap"
      ? "Mission control"
      : activeRoot === "courses"
          ? "UMGC course workspace"
          : "Personal module";

  let contextLabel = `${pluralize(courses.length, "course")} across ${pluralize(programs.length, "program")}`;

  if (course && topic) {
    const currentTopicIndex = course.topics.findIndex((item) => item.slug === topic.slug);
    contextLabel = `${course.code} · Topic ${currentTopicIndex + 1} of ${course.topics.length}`;
  } else if (course) {
    contextLabel = `${course.credits} credits · ${pluralize(course.topics.length, "topic")} · ${getProgramLabel(course.program, "short")}`;
  } else if (activeRoot === "roadmap" && isLoaded && catalogProgress.totalTopics > 0) {
    const inProgressCourses = catalogProgress.startedCourses - catalogProgress.completedCourses;
    contextLabel = `${getTotalCreditHours(courses)} credits mapped · ${catalogProgress.completedTopics} of ${catalogProgress.totalTopics} topics completed · ${pluralize(inProgressCourses, "course")} in progress`;
  } else if (activeRoot === "courses" && isLoaded && courses.length > 0) {
    contextLabel = `${catalogProgress.completedCourses} completed · ${pluralize(courses.length, "course")} in the private workspace`;
  } else {
    contextLabel = `${pluralize(getTotalTopicCount(courses), "topic")} in the current foundation`;
  }

  return (
    <header className="border-b border-border/70 bg-panelAlt/65 px-5 py-5 sm:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">{title}</h2>
        </div>

        <div className="rounded-card border border-border/70 bg-panel/70 px-4 py-2 text-sm text-muted">
          {contextLabel}
        </div>
      </div>

      <div className="mt-5">
        <Breadcrumbs />
      </div>
    </header>
  );
}
