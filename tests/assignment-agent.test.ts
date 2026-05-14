import {
  calculateReadinessScore,
  countWords,
  parseAssignmentPrompt,
  runComplianceCheck,
  updateAssignmentStatus,
} from "@/lib/assignment-agent";
import { AssignmentProfile, AssignmentRecord, ComplianceReport } from "@/lib/types";

function buildBaseProfile(overrides: Partial<AssignmentProfile> = {}): AssignmentProfile {
  return {
    course: "CLCS 605",
    unit: "Unit 1",
    type: "assignment",
    title: "Cloud Assignment",
    prompt: "Assignment prompt",
    rubric: "",
    initialPostWordCount: "300-400 words",
    peerRepliesRequired: 0,
    citationRequired: true,
    apaReferenceRequired: true,
    requiredSections: [],
    requiredDeliverables: [],
    rubricCriteria: [],
    practicalRequired: false,
    practicalEvidenceItems: [],
    waitForPeerPosts: false,
    screenshotsOrFilesRequired: false,
    sourceHints: [],
    ...overrides,
  };
}

function buildReadyDraft(wordCount = 320) {
  const header = [
    "Peter Christian Agbenyega",
    "University of Maryland Global Campus",
    "CLCS 605",
    "Submission Type: assignment",
    "Professor: Professor",
    "Format: APA 7",
  ].join("\n");
  const body = "In my work, I use Terraform and EKS to keep security controls consistent across environments (Mell, 2024).";
  const reference = "Mell, P. (2024). Cloud security baseline. https://doi.org/10.1234/cloud";
  const baseWordCount = countWords(`${header}\n\n${body}\n\nReferences\n${reference}`);
  const fillerCount = Math.max(0, wordCount - baseWordCount);
  const filler = Array.from({ length: fillerCount }, (_, index) => `cloud${index}`).join(" ");
  return `${header}\n\n${body}\n\n${filler}\n\nReferences\n${reference}`;
}

function buildBaseRecord(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    id: "assignment-1",
    course: "CLCS 605",
    unit: "Unit 1",
    title: "Cloud Assignment",
    type: "assignment",
    prompt: "Assignment prompt",
    rubric: "",
    dueDate: "2099-05-14T23:59:00.000Z",
    citationsRequired: true,
    apaRequired: true,
    practicalRequired: false,
    requiredDeliverables: [],
    requiredSections: [],
    rubricCriteria: [],
    status: "not_started",
    readinessScore: 0,
    warnings: [],
    missingItems: [],
    createdAt: "2026-05-14T10:00:00.000Z",
    updatedAt: "2026-05-14T10:00:00.000Z",
    profile: buildBaseProfile(),
    ...overrides,
  };
}

function buildReport(overrides: Partial<ComplianceReport> = {}): ComplianceReport {
  return {
    status: "Ready to submit",
    wordCount: 320,
    wordCountRequirement: "300-400",
    wordCountPass: true,
    headerPass: true,
    citationReferencePass: true,
    apa7Pass: true,
    sourceRecencyPass: true,
    turnitinSafePass: true,
    peerReplyReadinessPass: true,
    tonePass: true,
    humanizationPass: true,
    promptCoveragePass: true,
    rubricPass: true,
    citationAudit: {
      inTextCitations: [],
      referenceEntries: [],
      orphanCitations: [],
      orphanReferences: [],
      pass: true,
    },
    apaValidation: {
      pass: true,
      issues: [],
      inTextCitationPass: true,
      referenceSectionPass: true,
      doiFormattingPass: true,
    },
    sourceAudit: {
      currentYearThreshold: 2021,
      recentReferenceCount: 1,
      mostRecentYear: 2024,
      outdatedReferences: [],
      pass: true,
    },
    humanizationReport: {
      pass: true,
      aiScore: 12,
      replacedPhrases: [],
      duplicateParagraphs: [],
      toneNotes: [],
    },
    rubricChecklist: [],
    readinessScore: 100,
    missingItems: [],
    warnings: [],
    nextAction: "Submit the assignment.",
    ...overrides,
  };
}

describe("Assignment Intelligence Engine", () => {
  it("extracts the standard template format", () => {
    const profile = parseAssignmentPrompt(`COURSE: CLCS 605
UNIT: Unit 1
PROFESSOR: Dr. Smith
DUE: Sunday 11:59 PM ET
TYPE: Discussion
WORD COUNT: 300-400 words

ASSIGNMENT INSTRUCTIONS:
Part 1: Explain the transformation.
Part 2: Connect one course concept to your own work.

RUBRIC:
Communication: 10 points

SPECIAL REQUIREMENTS:
Include one APA citation and 2 peer replies.`);

    expect(profile.course).toBe("CLCS 605");
    expect(profile.type).toBe("discussion");
    expect(profile.peerRepliesRequired).toBe(2);
    expect(profile.initialPostWordCount).toContain("300-400");
  });
});

describe("Submission Compliance Guard", () => {
  it("passes a clean draft and computes a strong readiness score", () => {
    const report = runComplianceCheck(buildBaseProfile(), buildReadyDraft(320));

    expect(report.status).toBe("Ready to submit");
    expect(report.wordCountPass).toBe(true);
    expect(report.headerPass).toBe(true);
    expect(report.citationReferencePass).toBe(true);
    expect(report.apa7Pass).toBe(true);
    expect(report.missingItems).toEqual([]);
    expect(calculateReadinessScore(report)).toBeGreaterThanOrEqual(90);
  });

  it("flags drafts below the required word count", () => {
    const report = runComplianceCheck(buildBaseProfile(), buildReadyDraft(250));

    expect(report.status).toBe("Needs revision");
    expect(report.wordCountPass).toBe(false);
    expect(report.missingItems[0]).toContain("Word count is");
  });

  it("flags missing APA references", () => {
    const draft = [
      "Peter Christian Agbenyega",
      "University of Maryland Global Campus",
      "CLCS 605",
      "",
      "In my work, I use Terraform and EKS to keep security controls consistent (Mell, 2024).",
    ].join("\n");
    const report = runComplianceCheck(buildBaseProfile(), draft);

    expect(report.status).toBe("Needs revision");
    expect(report.apa7Pass).toBe(false);
    expect(report.missingItems).toContain("APA 7 formatting issues still need correction.");
  });

  it("flags unmatched citations and references", () => {
    const draft = [
      "Peter Christian Agbenyega",
      "University of Maryland Global Campus",
      "CLCS 605",
      "",
      "In my work, I use Terraform and EKS to keep security controls consistent.",
      "",
      "References",
      "Mell, P. (2024). Cloud security baseline. https://doi.org/10.1234/cloud",
    ].join("\n");
    const report = runComplianceCheck(buildBaseProfile(), draft);

    expect(report.status).toBe("Needs revision");
    expect(report.citationReferencePass).toBe(false);
  });
});

describe("Status Engine", () => {
  it("scores ready reports above weak reports", () => {
    const ready = calculateReadinessScore(buildReport());
    const weak = calculateReadinessScore(
      buildReport({
        status: "Needs revision",
        wordCountPass: false,
        citationReferencePass: false,
        apa7Pass: false,
        rubricPass: false,
        missingItems: ["Word count is low", "Citation missing"],
        warnings: ["Needs more specificity"],
      }),
    );

    expect(ready).toBeGreaterThan(weak);
  });

  it("returns ready_to_submit for complete assignments", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({ finalDraft: buildReadyDraft(320) }),
      buildReport(),
    );

    expect(status).toBe("ready_to_submit");
  });

  it("preserves submitted records", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({ status: "submitted" }),
      buildReport({ status: "Needs revision" }),
    );

    expect(status).toBe("submitted");
  });
});
