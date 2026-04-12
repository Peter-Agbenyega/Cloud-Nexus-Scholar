"use client";

import { useEffect, useMemo, useState } from "react";

import { getCourseProgressSnapshot } from "@/lib/course-progress";
import { PROGRESS_EVENT, readCompletedTopics, writeCompletedTopics } from "@/lib/progress";
import { Course } from "@/lib/types";

const emptyProgressSnapshot = {
  completedCount: 0,
  totalTopics: 0,
  progressPercent: 0,
  isCompletedCourse: false,
  isInProgress: false,
  isNotStarted: true,
};

export function useCompletedTopics(course?: Course | null) {
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const courseSlug = course?.slug;

  useEffect(() => {
    if (!courseSlug) {
      setCompletedTopics([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    const syncFromStorage = () => {
      setCompletedTopics(readCompletedTopics(courseSlug));
      setIsLoaded(true);
    };

    syncFromStorage();

    const handleProgressChange = (event: Event) => {
      const detail = (event as CustomEvent<{ courseSlug?: string }>).detail;

      if (!detail?.courseSlug || detail.courseSlug === courseSlug) {
        syncFromStorage();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.endsWith(`:${courseSlug}`)) {
        syncFromStorage();
      }
    };

    window.addEventListener(PROGRESS_EVENT, handleProgressChange as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleProgressChange as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [courseSlug]);

  const completedTopicSet = useMemo(() => new Set(completedTopics), [completedTopics]);
  const progress = useMemo(
    () => (course ? getCourseProgressSnapshot(course, completedTopics) : emptyProgressSnapshot),
    [completedTopics, course],
  );

  const markTopicComplete = (topicSlug: string) => {
    if (!courseSlug) {
      return;
    }

    if (completedTopicSet.has(topicSlug)) {
      return;
    }

    writeCompletedTopics(courseSlug, [...completedTopics, topicSlug]);
  };

  const markTopicIncomplete = (topicSlug: string) => {
    if (!courseSlug) {
      return;
    }

    writeCompletedTopics(
      courseSlug,
      completedTopics.filter((completedTopicSlug) => completedTopicSlug !== topicSlug),
    );
  };

  return {
    completedTopics,
    completedTopicSet,
    completedCount: progress.completedCount,
    isLoaded,
    totalTopics: progress.totalTopics,
    progressPercent: progress.progressPercent,
    isCompletedCourse: progress.isCompletedCourse,
    isInProgress: progress.isInProgress,
    isNotStarted: progress.isNotStarted,
    isTopicComplete: (topicSlug: string) => completedTopicSet.has(topicSlug),
    markTopicComplete,
    markTopicIncomplete,
  };
}
