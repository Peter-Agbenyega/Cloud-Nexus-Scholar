export type TopicLesson = {
  slug: string;
  title: string;
  duration: string;
  objective: string;
  summary: string;
  bullets: string[];
};

export type CourseTopic = {
  slug: string;
  title: string;
  description: string;
  lessons: TopicLesson[];
};

export type Course = {
  slug: string;
  title: string;
  code: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  description: string;
  outcomes: string[];
  topics: CourseTopic[];
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};
