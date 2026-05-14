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
  const prefix = "In my AWS work I use Terraform and EKS to enforce clean security baselines (Mell, 2011).";
  const suffix = "References\nMell, P., & Grance, T. (2011). The NIST definition of cloud computing. https://nvlpubs.nist.gov/";
  const baseWordCount = countWords(`${prefix}\n\n${suffix}`);
  const fillerCount = Math.max(0, wordCount - baseWordCount);
  const filler = Array.from({ length: fillerCount }, (_, index) => `cloud${index}`).join(" ");
  return `${prefix}\n\n${filler}\n\n${suffix}`;
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
    citationPass: true,
    apaReferencePass: true,
    promptCoveragePass: true,
    deliverablesPass: true,
    rubricAlignment: "Strong",
    genericWritingPass: true,
    peerReplyReadinessPass: true,
    practicalEvidencePass: true,
    missingItems: [],
    warnings: [],
    nextAction: "Submit the assignment",
    ...overrides,
  };
}

describe("Assignment Intelligence Engine", () => {
  it("extracts discussion prompt requirements including peer replies", () => {
    const profile = parseAssignmentPrompt(`
Discussion: Cloud Transformation
Initial post: 300-400 words
Peer responses: 150-200 words each
Write 2 peer replies by Tuesday 11:59 PM ET.
Part 1: Explain the transformation.
Part 2: Connect one course concept to your own work.
Include one APA citation.
    `);

    expect(profile.type).toBe("discussion");
    expect(profile.initialPostWordCount).toContain("400 words");
    expect(profile.peerRepliesRequired).toBe(2);
    expect(profile.peerReplyWordCount).toContain("200 words");
    expect(profile.citationRequired).toBe(true);
    expect(profile.requiredSections).toEqual(
      expect.arrayContaining(["explain the transformation.", "connect one course concept to your own work."]),
    );
  });

  it("extracts assignment prompts that require APA references", () => {
    const profile = parseAssignmentPrompt(`
Assignment: Security Design Paper
Write a 700-900 word assignment.
Submit the final document in APA 7 format.
Include references and in-text citations.
Deliverable: upload one document.
    `);

    expect(profile.type).toBe("assignment");
    expect(profile.initialPostWordCount).toContain("700-900");
    expect(profile.apaReferenceRequired).toBe(true);
    expect(profile.citationRequired).toBe(true);
    expect(profile.requiredDeliverables.join(" ")).toContain("upload one document");
  });

  it("extracts practical and screenshot requirements", () => {
    const profile = parseAssignmentPrompt(`
CLCS 635 Unit 2 Lab: Monitoring Setup
Complete the practical lab in AWS.
Take screenshots of the dashboard.
Upload the file and attach screenshots with your write-up.
    `);

    expect(profile.type).toBe("lab");
    expect(profile.practicalRequired).toBe(true);
    expect(profile.screenshotsOrFilesRequired).toBe(true);
    expect(profile.practicalEvidenceItems).toEqual(
      expect.arrayContaining(["Screenshots", "Uploaded file or completed template", "Practical work evidence"]),
    );
    expect(profile.requiredDeliverables.join(" ")).toContain("upload the file");
  });

  it("extracts quiz prompt type", () => {
    const profile = parseAssignmentPrompt(`
CLCS 645 Unit 3 Quiz
This quiz includes multiple choice and true/false questions.
    `);

    expect(profile.type).toBe("quiz");
    expect(profile.submissionFormat).toBe("quiz");
  });
});

describe("Submission Compliance Guard", () => {
  it("passes a draft inside the required word count and computes a strong readiness score", () => {
    const report = runComplianceCheck(buildBaseProfile(), buildReadyDraft(320));

    expect(report.status).toBe("Ready to submit");
    expect(report.wordCountPass).toBe(true);
    expect(report.citationPass).toBe(true);
    expect(report.apaReferencePass).toBe(true);
    expect(report.missingItems).toEqual([]);
    expect(report.nextAction).toBe("Submit the assignment");
    expect(calculateReadinessScore(report)).toBeGreaterThanOrEqual(95);
  });

  it("flags a draft below the required word count", () => {
    const report = runComplianceCheck(buildBaseProfile(), buildReadyDraft(250));

    expect(report.status).toBe("Needs revision");
    expect(report.wordCountPass).toBe(false);
    expect(report.missingItems[0]).toBe(`Word count is ${report.wordCount}, but requirement is 300-400`);
    expect(report.nextAction).toBe(`Word count is ${report.wordCount}, but requirement is 300-400`);
  });

  it("flags a draft above the required word count", () => {
    const report = runComplianceCheck(buildBaseProfile(), buildReadyDraft(420));

    expect(report.status).toBe("Needs revision");
    expect(report.wordCountPass).toBe(false);
    expect(report.missingItems[0]).toBe(`Word count is ${report.wordCount}, but requirement is 300-400`);
  });

  it("flags missing APA references", () => {
    const draft = "In my AWS work I use Terraform and EKS to enforce clean security baselines (Mell, 2011). " + "cloud ".repeat(320);
    const report = runComplianceCheck(buildBaseProfile(), draft);

    expect(report.status).toBe("Needs revision");
    expect(report.apaReferencePass).toBe(false);
    expect(report.missingItems).toContain("APA references section is missing");
  });

  it("flags missing in-text citations", () => {
    const draft = [
      "In my AWS work I use Terraform and EKS to enforce clean security baselines.",
      "cloud ".repeat(320),
      "References",
      "Mell, P., & Grance, T. (2011). The NIST definition of cloud computing. https://nvlpubs.nist.gov/",
    ].join("\n\n");
    const report = runComplianceCheck(buildBaseProfile(), draft);

    expect(report.status).toBe("Needs revision");
    expect(report.citationPass).toBe(false);
    expect(report.missingItems).toContain("Required in-text citation is missing");
  });

  it("blocks discussion replies until peer posts are available", () => {
    const profile = buildBaseProfile({
      type: "discussion",
      prompt: "Write the initial post, then wait for peer posts before writing a peer response.",
      peerRepliesRequired: 2,
      waitForPeerPosts: true,
      citationRequired: false,
      apaReferenceRequired: false,
    });
    const report = runComplianceCheck(profile, buildReadyDraft(320));

    expect(report.status).toBe("Needs revision");
    expect(report.peerReplyReadinessPass).toBe(false);
    expect(report.missingItems).toContain("Peer posts are needed before writing personalized replies");
    expect(report.warnings).toContain("This assignment still needs 2 peer replies after the initial post.");
  });

  it("flags missing practical evidence when a practical assignment is incomplete", () => {
    const profile = buildBaseProfile({
      practicalRequired: true,
      practicalEvidenceItems: [],
      citationRequired: false,
      apaReferenceRequired: false,
    });
    const report = runComplianceCheck(profile, buildReadyDraft(320));

    expect(report.status).toBe("Needs revision");
    expect(report.practicalEvidencePass).toBe(false);
    expect(report.missingItems).toContain("Practical evidence or screenshots are still required");
    expect(report.warnings).toContain("Practical evidence expected: ");
  });
});

describe("Status Engine", () => {
  it("scores ready-to-submit reports strongly and penalizes failed reports", () => {
    const ready = calculateReadinessScore(buildReport());
    const weak = calculateReadinessScore(
      buildReport({
        status: "Needs revision",
        wordCountPass: false,
        citationPass: false,
        apaReferencePass: false,
        rubricAlignment: "Weak",
        missingItems: ["Word count is low", "Citation missing"],
        warnings: ["Needs more specificity"],
      }),
    );

    expect(ready).toBeGreaterThan(weak);
    expect(weak).toBeLessThan(50);
  });

  it("returns ready_to_submit for complete compliant assignments", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({ finalDraft: buildReadyDraft(320) }),
      buildReport(),
    );

    expect(status).toBe("ready_to_submit");
  });

  it("returns needs_revision when a draft exists but the report is not ready", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({ finalDraft: buildReadyDraft(250) }),
      buildReport({ status: "Needs revision", missingItems: ["Word count is low"] }),
    );

    expect(status).toBe("needs_revision");
  });

  it("returns peer_replies_needed for discussion posts that are otherwise ready", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({
        type: "discussion",
        finalDraft: buildReadyDraft(320),
        profile: buildBaseProfile({ type: "discussion", peerRepliesRequired: 2 }),
      }),
      buildReport({ nextAction: "Submit the initial discussion post, then wait for peer posts before writing replies" }),
    );

    expect(status).toBe("peer_replies_needed");
  });

  it("returns practical_needed when practical evidence is missing", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({
        practicalRequired: true,
        finalDraft: buildReadyDraft(320),
      }),
      buildReport({
        status: "Needs revision",
        practicalEvidencePass: false,
        missingItems: ["Practical evidence or screenshots are still required"],
      }),
    );

    expect(status).toBe("practical_needed");
  });

  it("preserves submitted records", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({ status: "submitted" }),
      buildReport({ status: "Needs revision" }),
    );

    expect(status).toBe("submitted");
  });

  it("marks past-due records as overdue", () => {
    const status = updateAssignmentStatus(
      buildBaseRecord({
        dueDate: "2000-01-01T00:00:00.000Z",
        finalDraft: buildReadyDraft(320),
      }),
      buildReport(),
    );

    expect(status).toBe("overdue");
  });
});
