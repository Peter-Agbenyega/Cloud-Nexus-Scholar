import { Course } from "@/lib/types";

export type CourseProgressSnapshot = {
  completedCount: number;
  totalTopics: number;
  progressPercent: number;
  isCompletedCourse: boolean;
  isInProgress: boolean;
  isNotStarted: boolean;
};

export type CatalogProgressSnapshot = {
  completedTopics: number;
  totalTopics: number;
  startedCourses: number;
  completedCourses: number;
  progressPercent: number;
};

export function getCompletedTopicCount(course: Course, completedTopicSlugs: string[]): number {
  const currentTopicSlugs = new Set(course.topics.map((topic) => topic.slug));

  return new Set(
    completedTopicSlugs.filter((completedTopicSlug) => currentTopicSlugs.has(completedTopicSlug)),
  ).size;
}

export function getCourseProgressSnapshot(
  course: Course,
  completedTopicSlugs: string[],
): CourseProgressSnapshot {
  const totalTopics = course.topics.length;
  const completedCount = getCompletedTopicCount(course, completedTopicSlugs);
  const progressPercent =
    totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  const isCompletedCourse = totalTopics > 0 && completedCount === totalTopics;
  const isInProgress = completedCount > 0 && completedCount < totalTopics;

  return {
    completedCount,
    totalTopics,
    progressPercent,
    isCompletedCourse,
    isInProgress,
    isNotStarted: completedCount === 0,
  };
}

export function getCatalogProgressSnapshot(
  courses: Course[],
  completedTopicsByCourse: Record<string, string[]>,
): CatalogProgressSnapshot {
  const courseSnapshots = courses.map((course) =>
    getCourseProgressSnapshot(course, completedTopicsByCourse[course.slug] ?? []),
  );

  const completedTopics = courseSnapshots.reduce(
    (total, snapshot) => total + snapshot.completedCount,
    0,
  );
  const totalTopics = courseSnapshots.reduce(
    (total, snapshot) => total + snapshot.totalTopics,
    0,
  );
  const startedCourses = courseSnapshots.filter(
    (snapshot) => snapshot.isInProgress || snapshot.isCompletedCourse,
  ).length;
  const completedCourses = courseSnapshots.filter(
    (snapshot) => snapshot.isCompletedCourse,
  ).length;

  return {
    completedTopics,
    totalTopics,
    startedCourses,
    completedCourses,
    progressPercent: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
  };
}
