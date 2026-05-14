import {
  getAssignmentRecord,
  markAssignmentSubmitted,
  patchAssignmentRecord,
  readAssignmentRecords,
  saveDraftAndCompliance,
} from "@/lib/assignment-store";

const DISCUSSION_ID = "clcs605-u1-discussion";

function buildStoreDraft() {
  return [
    "In my AWS work I use Terraform and EKS to improve governance and repeatability (Mell, 2011).",
    "cloud ".repeat(330),
    "References",
    "Mell, P., & Grance, T. (2011). The NIST definition of cloud computing. https://nvlpubs.nist.gov/",
  ].join("\n\n");
}

describe("assignment store", () => {
  it("creates seed records from syllabus data", () => {
    const records = readAssignmentRecords();
    const discussion = records.find((record) => record.id === DISCUSSION_ID);

    expect(records.length).toBeGreaterThan(0);
    expect(discussion).toBeTruthy();
    expect(discussion?.course).toBe("CLCS 605");
    expect(discussion?.title).toContain("Unit 1 Discussion");
    expect(discussion?.status).toBe("not_started");
  });

  it("patchAssignmentRecord updates status without losing metadata", () => {
    const before = getAssignmentRecord(DISCUSSION_ID);
    expect(before).toBeTruthy();

    const updated = patchAssignmentRecord(DISCUSSION_ID, { status: "needs_revision" });
    const after = getAssignmentRecord(DISCUSSION_ID);

    expect(updated?.status).toBe("needs_revision");
    expect(after?.status).toBe("needs_revision");
    expect(after?.title).toBe(before?.title);
    expect(after?.course).toBe(before?.course);
    expect(after?.requiredDeliverables).toEqual(before?.requiredDeliverables);
  });

  it("saveDraftAndCompliance stores the final draft and compliance report", () => {
    const updated = saveDraftAndCompliance(DISCUSSION_ID, buildStoreDraft(), "draft_started");
    const stored = getAssignmentRecord(DISCUSSION_ID);

    expect(updated?.finalDraft).toContain("In my AWS work");
    expect(updated?.lastComplianceReport).toBeTruthy();
    expect(updated?.submissionComment).toContain("Submitting my discussion");
    expect(stored?.finalDraft).toBe(updated?.finalDraft);
    expect(stored?.lastComplianceReport?.wordCount).toBeGreaterThan(300);
  });

  it("markAssignmentSubmitted changes status to submitted", () => {
    const updated = markAssignmentSubmitted(DISCUSSION_ID);
    const stored = getAssignmentRecord(DISCUSSION_ID);

    expect(updated?.status).toBe("submitted");
    expect(stored?.status).toBe("submitted");
  });

  it("preserves required assignment metadata after draft saves", () => {
    const before = getAssignmentRecord(DISCUSSION_ID);
    const updated = saveDraftAndCompliance(DISCUSSION_ID, buildStoreDraft(), "draft_started");

    expect(updated?.requiredSections).toEqual(before?.requiredSections);
    expect(updated?.rubricCriteria).toEqual(before?.rubricCriteria);
    expect(updated?.wordCountMin).toBe(before?.wordCountMin);
    expect(updated?.peerReplyWordCountMin).toBe(before?.peerReplyWordCountMin);
  });
});
