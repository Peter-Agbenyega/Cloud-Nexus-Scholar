import { ACTIVE_SYLLABUS_COURSES } from "@/lib/syllabus-data";
import {
  calculateReadinessScore,
  generateSubmissionComment,
  parseAssignmentPrompt,
  runComplianceCheck,
  updateAssignmentStatus,
} from "@/lib/assignment-agent";
import { AssignmentProfile, AssignmentRecord, AssignmentStatus } from "@/lib/types";

const ASSIGNMENT_STORE_KEY = "cns_assignment_records_v2";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseMinMax(wordCount?: string) {
  if (!wordCount) {
    return {};
  }

  const rangeMatch = wordCount.match(/(\d{2,4})\s*-\s*(\d{2,4})/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const singleMatch = wordCount.match(/(\d{2,4})/);
  if (singleMatch) {
    return {
      min: Number(singleMatch[1]),
    };
  }

  return {};
}

function buildSeedRecords(): AssignmentRecord[] {
  const now = new Date().toISOString();

  return ACTIVE_SYLLABUS_COURSES.flatMap((course) =>
    course.units.flatMap((unit) =>
      unit.assignments.map((assignment) => {
        const description = "description" in assignment ? assignment.description ?? "" : "";
        const requiredWordCount = "requiredWordCount" in assignment ? assignment.requiredWordCount ?? "" : "";
        const citations = "citations" in assignment ? assignment.citations ?? "" : "";
        const rubricText =
          "rubric" in assignment && assignment.rubric
            ? Object.entries(assignment.rubric)
                .map(([criterion, value]) => `${criterion}: ${value}`)
                .join("\n")
            : "";
        const profile = parseAssignmentPrompt(
          `${course.code}\nUnit ${unit.unit}\n${assignment.title}\n${description}\n${requiredWordCount}\n${citations}\n${assignment.dueDate}`,
          rubricText,
        );
        const wordCounts = parseMinMax(requiredWordCount);
        const peerWordCounts = parseMinMax(profile.peerReplyWordCount);

        return {
          id: assignment.id,
          course: course.code,
          unit: `Unit ${unit.unit}`,
          title: assignment.title,
          type: assignment.type === "quiz" ? "quiz" : assignment.type,
          prompt: description || assignment.title,
          rubric: rubricText,
          dueDate: assignment.dueDate,
          peerReplyDueDate: profile.deadlinePeerReplies,
          wordCountMin: wordCounts.min,
          wordCountMax: wordCounts.max,
          peerReplyWordCountMin: peerWordCounts.min,
          peerReplyWordCountMax: peerWordCounts.max,
          citationsRequired: Boolean(citations || profile.citationRequired),
          apaRequired: Boolean(citations || profile.apaReferenceRequired),
          practicalRequired: profile.practicalRequired,
          requiredDeliverables: profile.requiredDeliverables,
          requiredSections: profile.requiredSections,
          rubricCriteria: profile.rubricCriteria,
          status: assignment.type === "quiz" ? "quiz_pending" : "not_started",
          readinessScore: 0,
          warnings: [],
          missingItems: [],
          submissionComment: "",
          createdAt: now,
          updatedAt: now,
          profile,
        } satisfies AssignmentRecord;
      }),
    ),
  );
}

function mergeSeedRecords(existing: AssignmentRecord[]): AssignmentRecord[] {
  const existingMap = new Map(existing.map((record) => [record.id, record]));

  return buildSeedRecords().map((seed) => {
    const current = existingMap.get(seed.id);
    return current
      ? {
          ...seed,
          ...current,
          profile: current.profile ?? seed.profile,
        }
      : seed;
  });
}

export function readAssignmentRecords() {
  if (!isBrowser()) {
    return buildSeedRecords();
  }

  const parsed = safeParse<AssignmentRecord[]>(
    window.localStorage.getItem(ASSIGNMENT_STORE_KEY),
    [],
  );

  const merged = mergeSeedRecords(parsed);

  try {
    window.localStorage.setItem(ASSIGNMENT_STORE_KEY, JSON.stringify(merged));
  } catch {}

  return merged;
}

export function writeAssignmentRecords(records: AssignmentRecord[]) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(ASSIGNMENT_STORE_KEY, JSON.stringify(records));
  } catch {}
}

export function getAssignmentRecord(assignmentId: string) {
  return readAssignmentRecords().find((record) => record.id === assignmentId) ?? null;
}

export function saveAssignmentRecord(nextRecord: AssignmentRecord) {
  const current = readAssignmentRecords();
  const nextRecords = current.map((record) =>
    record.id === nextRecord.id ? nextRecord : record,
  );

  if (!current.some((record) => record.id === nextRecord.id)) {
    nextRecords.unshift(nextRecord);
  }

  writeAssignmentRecords(nextRecords);
  return nextRecord;
}

export function patchAssignmentRecord(
  assignmentId: string,
  updates: Partial<AssignmentRecord>,
) {
  const existing = getAssignmentRecord(assignmentId);

  if (!existing) {
    return null;
  }

  const nextRecord: AssignmentRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAssignmentRecord(nextRecord);
  return nextRecord;
}

export function updateAssignmentFromPrompt(
  assignmentId: string,
  prompt: string,
  rubric = "",
) {
  const existing = getAssignmentRecord(assignmentId);
  if (!existing) {
    return null;
  }

  const profile = parseAssignmentPrompt(prompt, rubric || existing.rubric);
  const wordCount = parseMinMax(profile.initialPostWordCount);
  const peerWordCount = parseMinMax(profile.peerReplyWordCount);

  return patchAssignmentRecord(assignmentId, {
    prompt,
    rubric: rubric || existing.rubric,
    profile,
    wordCountMin: wordCount.min,
    wordCountMax: wordCount.max,
    peerReplyWordCountMin: peerWordCount.min,
    peerReplyWordCountMax: peerWordCount.max,
    citationsRequired: profile.citationRequired,
    apaRequired: profile.apaReferenceRequired,
    practicalRequired: profile.practicalRequired,
    requiredDeliverables: profile.requiredDeliverables,
    requiredSections: profile.requiredSections,
    rubricCriteria: profile.rubricCriteria,
    peerReplyDueDate: profile.deadlinePeerReplies || existing.peerReplyDueDate,
  });
}

export function saveDraftAndCompliance(
  assignmentId: string,
  draft: string,
  forcedStatus?: AssignmentStatus,
) {
  const existing = getAssignmentRecord(assignmentId);
  if (!existing) {
    return null;
  }

  const profile: AssignmentProfile =
    existing.profile ?? parseAssignmentPrompt(existing.prompt, existing.rubric);
  const report = runComplianceCheck(profile, draft);
  const status = forcedStatus ?? updateAssignmentStatus({ ...existing, finalDraft: draft, profile }, report);
  const readinessScore = report.readinessScore ?? calculateReadinessScore(report);

  return patchAssignmentRecord(assignmentId, {
    finalDraft: draft,
    lastComplianceReport: report,
    missingItems: report.missingItems,
    warnings: report.warnings,
    readinessScore,
    status,
    submissionComment: generateSubmissionComment(existing),
    profile,
  });
}

export function markAssignmentSubmitted(assignmentId: string) {
  return patchAssignmentRecord(assignmentId, {
    status: "submitted",
    updatedAt: new Date().toISOString(),
  });
}
