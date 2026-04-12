"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CatalogProgressSnapshot,
  CourseProgressSnapshot,
  getCatalogProgressSnapshot,
  getCourseProgressSnapshot,
} from "@/lib/course-progress";
import { PROGRESS_EVENT, readCompletedTopics } from "@/lib/progress";
import { Course } from "@/lib/types";

type CatalogProgressState = {
  catalogProgress: CatalogProgressSnapshot;
  courseProgressBySlug: Record<string, CourseProgressSnapshot>;
  isLoaded: boolean;
};

export function useCatalogProgress(courses: Course[]): CatalogProgressState {
  const [completedTopicsByCourse, setCompletedTopicsByCourse] = useState<
    Record<string, string[]>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);
  const courseProgressKey = useMemo(
    () =>
      courses
        .map((course) => `${course.slug}:${course.topics.map((topic) => topic.slug).join(",")}`)
        .join("|"),
    [courses],
  );

  useEffect(() => {
    const syncFromStorage = () => {
      const nextCompletedTopicsByCourse = Object.fromEntries(
        courses.map((course) => [course.slug, readCompletedTopics(course.slug)]),
      );

      setCompletedTopicsByCourse(nextCompletedTopicsByCourse);
      setIsLoaded(true);
    };

    setIsLoaded(false);
    syncFromStorage();

    const handleProgressChange = () => {
      syncFromStorage();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("cloud-nexus-scholar:completed-topics:")) {
        syncFromStorage();
      }
    };

    window.addEventListener(PROGRESS_EVENT, handleProgressChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleProgressChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [courseProgressKey]);

  const courseProgressBySlug = useMemo(
    () =>
      Object.fromEntries(
        courses.map((course) => [
          course.slug,
          getCourseProgressSnapshot(course, completedTopicsByCourse[course.slug] ?? []),
        ]),
      ) as Record<string, CourseProgressSnapshot>,
    [completedTopicsByCourse, courseProgressKey],
  );

  const catalogProgress = useMemo(
    () => getCatalogProgressSnapshot(courses, completedTopicsByCourse),
    [completedTopicsByCourse, courseProgressKey],
  );

  return {
    catalogProgress,
    courseProgressBySlug,
    isLoaded,
  };
}
