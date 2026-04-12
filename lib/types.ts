export type ConceptExplanationSet = {
  eli10: string;
  intermediate: string;
  advanced: string;
};

export type CourseSourceType =
  | "official-program-structure"
  | "app-learning-map";

export type TopicSourceType = "learning-map" | "syllabus-derived";

export type CrossCourseLink = {
  courseCode: string;
  topicSlug?: string;
  conceptId?: string;
  rationale: string;
};

export type Concept = {
  id: string;
  name: string;
  explanations: ConceptExplanationSet;
  whatIsIt: string;
  whyItMatters: string;
  howItWorks: string;
  whereUsed: string[];
  whatCanGoWrong: string[];
  howSecured: string[];
  howUMGCTests: string[];
  diagramSpec?: string;
  relatedConcepts: string[];
  crossCourseLinks: CrossCourseLink[];
};

export type LessonSection = {
  heading: string;
  content: string[];
};

export type CourseTopic = {
  slug: string;
  title: string;
  description: string;
  umgcWeek?: string;
  assessmentRelevance: string;
  concepts: Concept[];
  sourceType: TopicSourceType;
  objective?: string;
  summary?: string;
  sections?: LessonSection[];
  bullets?: string[];
};

export type Track = {
  id: string;
  label: string;
  courses: UMGCCourse[];
};

export type Program = {
  id: string;
  code: string;
  title: string;
  creditHours: number;
  type: "master" | "certificate";
  tracks: Track[];
};

export type UMGCCourse = {
  slug: string;
  code: string;
  title: string;
  credits: number;
  program: string;
  track: string;
  prereqs: string[];
  semesterOffered: string;
  description: string;
  learningOutcomes: string[];
  topics: CourseTopic[];
  capstoneRelevance?: string;
  cyberOverlap?: string[];
  sourceType: CourseSourceType;
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type Course = UMGCCourse;
