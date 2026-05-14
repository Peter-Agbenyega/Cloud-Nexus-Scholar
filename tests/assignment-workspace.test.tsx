import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AssignmentWorkspace } from "@/components/assignment-workspace";
import { AssignmentRecord, ComplianceReport } from "@/lib/types";

const mockGenerateAcademicDraft = vi.fn();
const mockFormatSubmissionDraft = vi.fn();
const mockGetAssignmentRecord = vi.fn();
const mockMarkAssignmentSubmitted = vi.fn();
const mockPatchAssignmentRecord = vi.fn();
const mockSaveDraftAndCompliance = vi.fn();
const mockUpdateAssignmentFromPrompt = vi.fn();
const mockAppendActivityEvent = vi.fn();

vi.mock("@/components/tutor-panel", () => ({
  TutorPanel: () => React.createElement("div", { "data-testid": "tutor-panel" }, "Tutor Panel"),
}));

vi.mock("@/components/writing-scanner", () => ({
  WritingScanner: () =>
    React.createElement("div", { "data-testid": "writing-scanner" }, "Writing Scanner"),
}));

vi.mock("@/lib/app-state", () => ({
  appendActivityEvent: (...args: unknown[]) => mockAppendActivityEvent(...args),
}));

vi.mock("@/lib/assignment-store", () => ({
  getAssignmentRecord: (...args: unknown[]) => mockGetAssignmentRecord(...args),
  markAssignmentSubmitted: (...args: unknown[]) => mockMarkAssignmentSubmitted(...args),
  patchAssignmentRecord: (...args: unknown[]) => mockPatchAssignmentRecord(...args),
  saveDraftAndCompliance: (...args: unknown[]) => mockSaveDraftAndCompliance(...args),
  updateAssignmentFromPrompt: (...args: unknown[]) => mockUpdateAssignmentFromPrompt(...args),
}));

vi.mock("@/lib/assignment-agent", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assignment-agent")>("@/lib/assignment-agent");
  return {
    ...actual,
    generateAcademicDraft: (...args: unknown[]) => mockGenerateAcademicDraft(...args),
    formatSubmissionDraft: (...args: unknown[]) => mockFormatSubmissionDraft(...args),
  };
});

function buildComplianceReport(overrides: Partial<ComplianceReport> = {}): ComplianceReport {
  return {
    status: "Ready to submit",
    wordCount: 340,
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
      aiScore: 14,
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

function buildRecord(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    id: "assignment-1",
    course: "CLCS 605",
    unit: "Unit 1",
    title: "Unit 1 Discussion",
    type: "discussion",
    prompt: `COURSE: CLCS 605
UNIT: Unit 1
PROFESSOR: Dr. Smith
DUE: Sunday 11:59 PM ET
TYPE: Discussion
WORD COUNT: 300-400 words

ASSIGNMENT INSTRUCTIONS:
Discuss the topic and connect it to your work.

RUBRIC:
Communication: 10 points

SPECIAL REQUIREMENTS:
Include one APA citation.`,
    rubric: "Communication: 10 points",
    dueDate: "2099-05-14T23:59:00.000Z",
    wordCountMin: 300,
    wordCountMax: 400,
    citationsRequired: true,
    apaRequired: true,
    practicalRequired: false,
    requiredDeliverables: ["include one apa citation."],
    requiredSections: [],
    rubricCriteria: ["communication"],
    status: "ready_to_submit",
    readinessScore: 100,
    warnings: [],
    missingItems: [],
    finalDraft: "Stored final draft",
    submissionComment: "Stored submission comment",
    createdAt: "2026-05-14T10:00:00.000Z",
    updatedAt: "2026-05-14T10:00:00.000Z",
    profile: {
      course: "CLCS 605",
      unit: "Unit 1",
      type: "discussion",
      title: "Unit 1 Discussion",
      prompt: "Template prompt",
      rubric: "Communication: 10 points",
      initialPostWordCount: "300-400 words",
      peerRepliesRequired: 0,
      citationRequired: true,
      apaReferenceRequired: true,
      requiredSections: [],
      requiredDeliverables: ["include one apa citation."],
      rubricCriteria: ["communication"],
      practicalRequired: false,
      practicalEvidenceItems: [],
      waitForPeerPosts: false,
      screenshotsOrFilesRequired: false,
      sourceHints: ["APA 7 reference format"],
    },
    lastComplianceReport: buildComplianceReport(),
    ...overrides,
  };
}

describe("AssignmentWorkspace", () => {
  beforeEach(() => {
    mockGetAssignmentRecord.mockReturnValue(buildRecord());
    mockUpdateAssignmentFromPrompt.mockImplementation(() => buildRecord({ status: "draft_started" }));
    mockSaveDraftAndCompliance.mockImplementation(() =>
      buildRecord({
        status: "ready_to_submit",
        finalDraft: "Generated academic draft",
        lastComplianceReport: buildComplianceReport(),
      }),
    );
    mockPatchAssignmentRecord.mockImplementation(() => buildRecord());
    mockMarkAssignmentSubmitted.mockImplementation(() => buildRecord({ status: "submitted" }));
    mockGenerateAcademicDraft.mockResolvedValue("Generated academic draft");
    mockFormatSubmissionDraft.mockResolvedValue("Generated academic draft");
  });

  it("loads stored assignment state into the workspace", async () => {
    render(
      React.createElement(AssignmentWorkspace, {
        assignmentId: "assignment-1",
        title: "Unit 1 Discussion",
        type: "discussion",
        points: 75,
        description: "Discussion description",
        wordCount: "300-400 words",
        courseCode: "CLCS 605",
        courseName: "Introduction to Cloud Computing",
        dueDate: "Sunday 11:59 PM ET",
      }),
    );

    expect(await screen.findByText("Unit 1 Discussion")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Stored final draft")).toBeInTheDocument();
  });

  it("saves the complete template back to the store", async () => {
    const onAssignmentUpdate = vi.fn();

    render(
      React.createElement(AssignmentWorkspace, {
        assignmentId: "assignment-1",
        title: "Unit 1 Discussion",
        type: "discussion",
        points: 75,
        description: "Discussion description",
        wordCount: "300-400 words",
        courseCode: "CLCS 605",
        courseName: "Introduction to Cloud Computing",
        dueDate: "Sunday 11:59 PM ET",
        onAssignmentUpdate,
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Save Template to Workspace" }));

    await waitFor(() => {
      expect(mockUpdateAssignmentFromPrompt).toHaveBeenCalledWith(
        "assignment-1",
        expect.stringContaining("COURSE: CLCS 605"),
        expect.any(String),
      );
    });
    expect(onAssignmentUpdate).toHaveBeenCalled();
  });

  it("runs generation and moves into the compliance workflow", async () => {
    render(
      React.createElement(AssignmentWorkspace, {
        assignmentId: "assignment-1",
        title: "Unit 1 Discussion",
        type: "discussion",
        points: 75,
        description: "Discussion description",
        wordCount: "300-400 words",
        courseCode: "CLCS 605",
        courseName: "Introduction to Cloud Computing",
        dueDate: "Sunday 11:59 PM ET",
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Generate Draft" }));

    await waitFor(() => {
      expect(mockGenerateAcademicDraft).toHaveBeenCalledWith({
        profile: expect.objectContaining({
          type: "discussion",
        }),
        draftText: "Stored final draft",
        mode: "initial_post",
      });
    });

    expect(mockSaveDraftAndCompliance).toHaveBeenCalledWith(
      "assignment-1",
      "Generated academic draft",
      "draft_started",
    );
    expect(await screen.findByText("Rubric checklist")).toBeInTheDocument();
    expect(screen.getByTestId("writing-scanner")).toBeInTheDocument();
  });
});
