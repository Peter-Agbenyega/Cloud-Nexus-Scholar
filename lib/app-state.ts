import { Course } from "@/lib/types";

import {
  AcademicTaskType,
  academicSessions,
  getActiveAcademicSession,
  weeklyTaskTypes,
} from "@/lib/academic-plan";
import { getCourses } from "@/lib/programs";
import { getCourseProgressSnapshot } from "@/lib/course-progress";
import { readCompletedTopics } from "@/lib/progress";

export type TutorMode = "tutor" | "professor" | "quiz" | "assignment";

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type LibraryEntryType =
  | "note"
  | "professor-session"
  | "quiz-review"
  | "saved-draft";

export type LibraryEntry = {
  id: string;
  title: string;
  courseCode: string;
  topic: string;
  content: string;
  tags: string[];
  type: LibraryEntryType;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  action: string;
  courseCode: string;
  timestamp: string;
};

export const PROFESSOR_SESSION_EVENT = "professor_session_complete";
export const QUIZ_COMPLETE_EVENT = "quiz_complete";
export const ACTIVITY_FEED_KEY = "cns_activity_feed";
export const LIBRARY_ENTRIES_KEY = "cns_library_entries";

const MAX_ACTIVITY_ITEMS = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParseJson<T>(rawValue: string | null, fallback: T): T {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function getTutorStorageKey(courseCode: string, topicTitle: string) {
  return `cns_chat_${courseCode}_${topicTitle}`;
}

export function getProfessorStorageKeys(courseCode: string, topicTitle: string) {
  return {
    sessions: `cns_prof_${courseCode}_${topicTitle}_sessions`,
    confidence: `cns_prof_${courseCode}_${topicTitle}_confidence`,
    last: `cns_prof_${courseCode}_${topicTitle}_last`,
  };
}

export function getQuizStorageKey(courseCode: string, topicTitle: string) {
  return `cns_quiz_${courseCode}_${topicTitle}_scores`;
}

export function getPlannerTaskKey(
  courseCode: string,
  weekNumber: number,
  taskType: AcademicTaskType,
) {
  return `cns_planner_${courseCode}_week${weekNumber}_${taskType}`;
}

export function readTutorMessages(courseCode: string, topicTitle: string): TutorMessage[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = safeParseJson<TutorMessage[]>(
      window.localStorage.getItem(getTutorStorageKey(courseCode, topicTitle)),
      [],
    );

    return parsed.filter(
      (message): message is TutorMessage =>
        typeof message === "object" &&
        message !== null &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        typeof message.timestamp === "string",
    );
  } catch {
    return [];
  }
}

export function writeTutorMessages(
  courseCode: string,
  topicTitle: string,
  messages: TutorMessage[],
) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getTutorStorageKey(courseCode, topicTitle),
      JSON.stringify(messages),
    );
  } catch {}
}

export function readNumberFromStorage(key: string, fallback = 0) {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    const value = Number(rawValue);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeNumberToStorage(key: string, value: number) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, String(value));
  } catch {}
}

export function readStringFromStorage(key: string, fallback = "") {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStringToStorage(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function readQuizScores(courseCode: string, topicTitle: string): number[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = safeParseJson<number[]>(
      window.localStorage.getItem(getQuizStorageKey(courseCode, topicTitle)),
      [],
    );

    return parsed.filter((score): score is number => typeof score === "number");
  } catch {
    return [];
  }
}

export function writeQuizScores(courseCode: string, topicTitle: string, scores: number[]) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getQuizStorageKey(courseCode, topicTitle),
      JSON.stringify(scores),
    );
  } catch {}
}

export function readLibraryEntries(): LibraryEntry[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = safeParseJson<LibraryEntry[]>(
      window.localStorage.getItem(LIBRARY_ENTRIES_KEY),
      [],
    );

    return parsed.filter(
      (entry): entry is LibraryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof entry.id === "string" &&
        typeof entry.title === "string" &&
        typeof entry.courseCode === "string" &&
        typeof entry.topic === "string" &&
        typeof entry.content === "string" &&
        Array.isArray(entry.tags) &&
        typeof entry.type === "string" &&
        typeof entry.createdAt === "string",
    );
  } catch {
    return [];
  }
}

export function writeLibraryEntries(entries: LibraryEntry[]) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(LIBRARY_ENTRIES_KEY, JSON.stringify(entries));
  } catch {}
}

export function readActivityFeed(): ActivityEvent[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = safeParseJson<ActivityEvent[]>(
      window.localStorage.getItem(ACTIVITY_FEED_KEY),
      [],
    );

    return parsed.filter(
      (event): event is ActivityEvent =>
        typeof event === "object" &&
        event !== null &&
        typeof event.id === "string" &&
        typeof event.action === "string" &&
        typeof event.courseCode === "string" &&
        typeof event.timestamp === "string",
    );
  } catch {
    return [];
  }
}

export function appendActivityEvent(action: string, courseCode: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    const nextEvent: ActivityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      action,
      courseCode,
      timestamp: new Date().toISOString(),
    };

    const currentEvents = readActivityFeed();
    const nextEvents = [nextEvent, ...currentEvents].slice(0, MAX_ACTIVITY_ITEMS);
    window.localStorage.setItem(ACTIVITY_FEED_KEY, JSON.stringify(nextEvents));
  } catch {}
}

export function readPlannerTaskChecked(
  courseCode: string,
  weekNumber: number,
  taskType: AcademicTaskType,
) {
  if (!isBrowser()) {
    return false;
  }

  try {
    return window.localStorage.getItem(getPlannerTaskKey(courseCode, weekNumber, taskType)) === "true";
  } catch {
    return false;
  }
}

export function writePlannerTaskChecked(
  courseCode: string,
  weekNumber: number,
  taskType: AcademicTaskType,
  checked: boolean,
) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getPlannerTaskKey(courseCode, weekNumber, taskType),
      String(checked),
    );
  } catch {}
}

export function getWidthClass(percent: number) {
  if (percent >= 100) return "w-full";
  if (percent >= 90) return "w-11/12";
  if (percent >= 80) return "w-10/12";
  if (percent >= 70) return "w-8/12";
  if (percent >= 60) return "w-7/12";
  if (percent >= 50) return "w-6/12";
  if (percent >= 40) return "w-5/12";
  if (percent >= 30) return "w-4/12";
  if (percent >= 20) return "w-3/12";
  if (percent >= 10) return "w-2/12";
  if (percent > 0) return "w-1/12";
  return "w-0";
}

export function getHeightClass(percent: number) {
  if (percent >= 100) return "h-full";
  if (percent >= 90) return "h-11/12";
  if (percent >= 80) return "h-10/12";
  if (percent >= 70) return "h-8/12";
  if (percent >= 60) return "h-7/12";
  if (percent >= 50) return "h-6/12";
  if (percent >= 40) return "h-5/12";
  if (percent >= 30) return "h-4/12";
  if (percent >= 20) return "h-3/12";
  if (percent >= 10) return "h-2/12";
  if (percent > 0) return "h-1/12";
  return "h-0";
}

export function getDashboardMetrics() {
  const courses = getCourses();
  const completedTopics = courses.reduce((total, course) => {
    return total + getCourseProgressSnapshot(course, readCompletedTopics(course.slug)).completedCount;
  }, 0);

  const professorSessions = courses.reduce((total, course) => {
    return (
      total +
      course.topics.reduce((topicTotal, topic) => {
        const keys = getProfessorStorageKeys(course.code, topic.title);
        return topicTotal + readNumberFromStorage(keys.sessions, 0);
      }, 0)
    );
  }, 0);

  const quizScores = courses.flatMap((course) =>
    course.topics.flatMap((topic) => readQuizScores(course.code, topic.title)),
  );

  const libraryEntries = readLibraryEntries().length;
  const plannerCompletion = getPlannerCompletionSnapshot();

  return {
    completedTopics,
    professorSessions,
    averageQuizScore:
      quizScores.length > 0
        ? Number(
            (quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length).toFixed(1),
          )
        : 0,
    libraryEntries,
    plannerCompletion,
  };
}

export function getPlannerCompletionSnapshot(weekNumber = 1) {
  const activeSession = getActiveAcademicSession();
  const activeCourseCodes = activeSession.courses.map((course) => course.courseCode);
  const totalItems = activeCourseCodes.length * weeklyTaskTypes.length;

  let checkedItems = 0;
  activeCourseCodes.forEach((courseCode) => {
    weeklyTaskTypes.forEach((taskType) => {
      if (readPlannerTaskChecked(courseCode, weekNumber, taskType)) {
        checkedItems += 1;
      }
    });
  });

  const percent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return {
    checkedItems,
    totalItems,
    percent,
  };
}

export function getRoadmapCourseStatus(courseCode: string) {
  const session = academicSessions.find((item) =>
    item.courses.some((course) => course.courseCode === courseCode),
  );

  if (!session) {
    return "upcoming" as const;
  }

  return session.status;
}

export function getAllCourseOptions() {
  const catalogCourses = getCourses().map((course) => ({
    code: course.code,
    title: course.title,
  }));
  const knownCodes = new Set(catalogCourses.map((course) => course.code));

  academicSessions.forEach((session) => {
    session.courses.forEach((course) => {
      if (!knownCodes.has(course.courseCode)) {
        catalogCourses.push({
          code: course.courseCode,
          title: course.courseName,
        });
        knownCodes.add(course.courseCode);
      }
    });
  });

  return catalogCourses;
}

export function findCourseByCode(courseCode: string) {
  return getCourses().find((course) => course.code === courseCode);
}

export function getActiveCourseSnapshots(codes: string[]) {
  return codes
    .map((code) => {
      const course = findCourseByCode(code);

      if (!course) {
        return null;
      }

      return {
        course,
        progress: getCourseProgressSnapshot(course, readCompletedTopics(course.slug)),
      };
    })
    .filter((value): value is { course: Course; progress: ReturnType<typeof getCourseProgressSnapshot> } => Boolean(value));
}
