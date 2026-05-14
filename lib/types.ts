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

export type AssignmentType = "discussion" | "assignment" | "quiz" | "lab" | "other";

export type AssignmentStatus =
  | "not_started"
  | "draft_started"
  | "needs_revision"
  | "ready_to_submit"
  | "submitted"
  | "peer_replies_needed"
  | "overdue"
  | "quiz_pending"
  | "practical_needed";

export type AssignmentOutputMode =
  | "initial_post"
  | "full_assignment"
  | "outline"
  | "peer_reply"
  | "submission_comment"
  | "quiz_study_reasoning"
  | "rubric_cleanup"
  | "apa_reference_cleanup"
  | "compliance_check_only";

export type AssignmentRequirementChecklistItem = {
  label: string;
  satisfied: boolean;
};

export type ParsedPromptTemplate = {
  course: string;
  unit: string;
  professor: string;
  due: string;
  type: string;
  wordCount: string;
  assignmentInstructions: string;
  rubric: string;
  specialRequirements: string;
};

export type RubricCriterion = {
  id: string;
  label: string;
  points?: number;
  exceedsExpectations: string[];
  evidenceKeywords: string[];
};

export type RubricEvaluation = {
  criterion: RubricCriterion;
  matchedKeywords: string[];
  addressed: boolean;
  exceedsExpectationsPass: boolean;
  score: number;
  feedback: string;
};

export type RubricChecklistItem = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
};

export type CitationAudit = {
  inTextCitations: string[];
  referenceEntries: string[];
  orphanCitations: string[];
  orphanReferences: string[];
  pass: boolean;
};

export type APAValidation = {
  pass: boolean;
  issues: string[];
  inTextCitationPass: boolean;
  referenceSectionPass: boolean;
  doiFormattingPass: boolean;
};

export type SourceAudit = {
  currentYearThreshold: number;
  recentReferenceCount: number;
  mostRecentYear?: number;
  outdatedReferences: string[];
  pass: boolean;
};

export type HumanizationReport = {
  pass: boolean;
  aiScore: number;
  replacedPhrases: string[];
  duplicateParagraphs: string[];
  toneNotes: string[];
};

export type AssignmentProfile = {
  course: string;
  unit: string;
  type: AssignmentType;
  title: string;
  prompt: string;
  rubric: string;
  initialPostWordCount?: string;
  peerRepliesRequired: number;
  peerReplyWordCount?: string;
  citationRequired: boolean;
  apaReferenceRequired: boolean;
  deadlineInitialPost?: string;
  deadlinePeerReplies?: string;
  requiredSections: string[];
  requiredDeliverables: string[];
  rubricCriteria: string[];
  submissionFormat?: string;
  practicalRequired: boolean;
  practicalEvidenceItems: string[];
  waitForPeerPosts: boolean;
  screenshotsOrFilesRequired: boolean;
  sourceHints: string[];
};

export type ComplianceReport = {
  status: "Ready to submit" | "Needs revision";
  wordCount: number;
  wordCountRequirement: string;
  wordCountPass: boolean;
  headerPass: boolean;
  citationReferencePass: boolean;
  apa7Pass: boolean;
  sourceRecencyPass: boolean;
  turnitinSafePass: boolean;
  peerReplyReadinessPass: boolean;
  tonePass: boolean;
  humanizationPass: boolean;
  promptCoveragePass: boolean;
  rubricPass: boolean;
  citationAudit: CitationAudit;
  apaValidation: APAValidation;
  sourceAudit: SourceAudit;
  humanizationReport: HumanizationReport;
  rubricChecklist: RubricChecklistItem[];
  readinessScore: number;
  nextAction: string;
  missingItems: string[];
  warnings: string[];
};

export type AssignmentRecord = {
  id: string;
  course: string;
  unit: string;
  title: string;
  type: AssignmentType;
  prompt: string;
  rubric: string;
  dueDate: string;
  peerReplyDueDate?: string;
  wordCountMin?: number;
  wordCountMax?: number;
  peerReplyWordCountMin?: number;
  peerReplyWordCountMax?: number;
  citationsRequired: boolean;
  apaRequired: boolean;
  practicalRequired: boolean;
  requiredDeliverables: string[];
  requiredSections: string[];
  rubricCriteria: string[];
  status: AssignmentStatus;
  readinessScore: number;
  warnings: string[];
  missingItems: string[];
  finalDraft?: string;
  submissionComment?: string;
  createdAt: string;
  updatedAt: string;
  lastComplianceReport?: ComplianceReport;
  profile?: AssignmentProfile;
};
