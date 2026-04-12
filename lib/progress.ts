const STORAGE_PREFIX = "cloud-nexus-scholar:completed-topics";
export const PROGRESS_EVENT = "cloud-nexus-scholar:progress-change";

export function getCompletedTopicsStorageKey(courseSlug: string) {
  return `${STORAGE_PREFIX}:${courseSlug}`;
}

export function readCompletedTopics(courseSlug: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(getCompletedTopicsStorageKey(courseSlug));

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function writeCompletedTopics(courseSlug: string, topicSlugs: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueTopicSlugs = Array.from(new Set(topicSlugs));
  window.localStorage.setItem(
    getCompletedTopicsStorageKey(courseSlug),
    JSON.stringify(uniqueTopicSlugs),
  );
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: { courseSlug } }));
}
