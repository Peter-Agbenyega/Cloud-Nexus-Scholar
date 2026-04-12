import { Course } from "@/lib/types";

const TRACK_LABELS: Record<string, string> = {
  "clcs-core": "Core",
  "clcs-capstone": "Capstone",
  "clcs-electives": "Electives",
  "ctch-required": "Certificate Required",
};

const PROGRAM_LABELS: Record<string, { short: string; full: string }> = {
  "ms-cloud-computing-systems": {
    short: "Cloud MS",
    full: "Master of Science in Cloud Computing Systems",
  },
  "graduate-certificate-cybersecurity-technology": {
    short: "Cybersecurity Certificate",
    full: "Graduate Certificate in Cybersecurity Technology",
  },
};

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  const safeCount = Number.isFinite(count) && count >= 0 ? count : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

export function getTotalTopicCount(courses: Course[]) {
  return courses.reduce((total, course) => total + course.topics.length, 0);
}

export function getTotalCreditHours(courses: Course[]) {
  return courses.reduce((total, course) => total + course.credits, 0);
}

export function formatTrackLabel(track: string) {
  if (TRACK_LABELS[track]) {
    return TRACK_LABELS[track];
  }

  return track
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getProgramLabel(programId: string, variant: "short" | "full" = "short") {
  return PROGRAM_LABELS[programId]?.[variant] ?? programId;
}

export function getCourseSourceLabel(course: Course) {
  return course.sourceType === "official-program-structure"
    ? "Official program structure"
    : "App learning map";
}

export function getTopicSourceLabel(course: Course, topicSlug: string) {
  const topic = course.topics.find((item) => item.slug === topicSlug);

  if (!topic) {
    return null;
  }

  return topic.sourceType === "syllabus-derived"
    ? topic.umgcWeek ?? "Syllabus-derived"
    : "Learning map";
}

export function getTopicMetaLabel(course: Course, topicSlug: string) {
  const topic = course.topics.find((item) => item.slug === topicSlug);

  if (!topic) {
    return null;
  }

  return getTopicSourceLabel(course, topicSlug) ?? topic.assessmentRelevance;
}

export function getTopicPosition(course: Course, topicSlug: string) {
  const index = course.topics.findIndex((topic) => topic.slug === topicSlug);

  if (index === -1) {
    return null;
  }

  return {
    index,
    total: course.topics.length,
    previousTopic: course.topics[index - 1],
    nextTopic: course.topics[index + 1],
  };
}
