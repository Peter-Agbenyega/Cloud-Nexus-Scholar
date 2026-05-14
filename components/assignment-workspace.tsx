"use client";

import { useEffect, useMemo, useState } from "react";

import { TutorPanel } from "@/components/tutor-panel";
import { WritingScanner } from "@/components/writing-scanner";
import {
  calculateReadinessScore,
  countWords,
  generateAcademicDraft,
  generateSubmissionComment,
  parseAssignmentPrompt,
  runComplianceCheck,
} from "@/lib/assignment-agent";
import {
  getAssignmentRecord,
  markAssignmentSubmitted,
  patchAssignmentRecord,
  saveDraftAndCompliance,
  updateAssignmentFromPrompt,
} from "@/lib/assignment-store";
import { appendActivityEvent } from "@/lib/app-state";
import { SyllabusAssignmentType } from "@/lib/syllabus-data";
import { AssignmentOutputMode, AssignmentRecord, ComplianceReport } from "@/lib/types";

type AssignmentWorkspaceProps = {
  assignmentId: string;
  title: string;
  type: SyllabusAssignmentType;
  points: number;
  description: string;
  wordCount?: string;
  courseCode: string;
  courseName: string;
  rubric?: Record<string, number>;
  dueDate?: string;
  onAssignmentUpdate?: (record: AssignmentRecord) => void;
};

type WorkspaceTab = "intelligence" | "draft" | "compliance" | "submit";

const modeOptions: Array<{ value: AssignmentOutputMode; label: string }> = [
  { value: "initial_post", label: "Initial Post" },
  { value: "full_assignment", label: "Full Assignment" },
  { value: "outline", label: "Outline" },
  { value: "rubric_cleanup", label: "Rubric Cleanup" },
  { value: "apa_reference_cleanup", label: "APA Cleanup" },
  { value: "submission_comment", label: "Submission Comment" },
];

function getTypeLabel(type: SyllabusAssignmentType) {
  if (type === "discussion") return "Discussion";
  if (type === "assignment") return "Assignment";
  return "Quiz";
}

function getStatusTone(status?: string) {
  switch (status) {
    case "ready_to_submit":
    case "submitted":
      return "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
    case "needs_revision":
    case "peer_replies_needed":
      return "border-amber-400/35 bg-amber-500/10 text-amber-100";
    case "overdue":
    case "practical_needed":
      return "border-rose-400/35 bg-rose-500/10 text-rose-100";
    case "draft_started":
    case "quiz_pending":
      return "border-sky-400/35 bg-sky-500/10 text-sky-100";
    default:
      return "border-border/70 bg-panel/70 text-muted";
  }
}

function getSignalLabel(status?: string) {
  switch (status) {
    case "not_started":
      return "Not started";
    case "draft_started":
      return "Draft started";
    case "needs_revision":
      return "Needs revision";
    case "ready_to_submit":
      return "Ready to submit";
    case "submitted":
      return "Submitted";
    case "peer_replies_needed":
      return "Peer replies needed";
    case "overdue":
      return "Overdue";
    case "quiz_pending":
      return "Quiz pending";
    case "practical_needed":
      return "Practical evidence needed";
    default:
      return "Not started";
  }
}

function formatRubricText(rubric?: Record<string, number>) {
  if (!rubric) {
    return "";
  }

  return Object.entries(rubric)
    .map(([criterion, value]) => `${criterion}: ${value}`)
    .join("\n");
}

function formatDate(value?: string) {
  return value || "Check assignment prompt";
}

function getWordCountTone(report?: ComplianceReport | null) {
  if (!report) return "text-muted";
  return report.wordCountPass ? "text-emerald-200" : "text-amber-200";
}

export function AssignmentWorkspace({
  assignmentId,
  title,
  type,
  points,
  description,
  wordCount,
  courseCode,
  courseName,
  rubric,
  dueDate,
  onAssignmentUpdate,
}: AssignmentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("intelligence");
  const [assignmentRecord, setAssignmentRecord] = useState<AssignmentRecord | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [rubricInput, setRubricInput] = useState(formatRubricText(rubric));
  const [draft, setDraft] = useState("");
  const [generationMode, setGenerationMode] = useState<AssignmentOutputMode>(
    type === "discussion" ? "initial_post" : "full_assignment",
  );
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [reviewScanKey, setReviewScanKey] = useState(0);
  const [submissionComment, setSubmissionComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    const existing = getAssignmentRecord(assignmentId);
    if (!existing) {
      return;
    }

    setAssignmentRecord(existing);
    setPromptInput(existing.prompt || description);
    setRubricInput(existing.rubric || formatRubricText(rubric));
    setDraft(existing.finalDraft || "");
    setComplianceReport(existing.lastComplianceReport || null);
    setSubmissionComment(existing.submissionComment || "");
  }, [assignmentId, description, rubric]);

  const profile = useMemo(
    () => parseAssignmentPrompt(promptInput || description, rubricInput),
    [description, promptInput, rubricInput],
  );

  const wordCountValue = useMemo(() => countWords(draft), [draft]);
  const readinessScore = complianceReport
    ? calculateReadinessScore(complianceReport)
    : assignmentRecord?.readinessScore ?? 0;
  const statusLabel = getSignalLabel(assignmentRecord?.status);

  function syncRecord(nextRecord: AssignmentRecord | null, action?: string) {
    if (!nextRecord) {
      return;
    }

    setAssignmentRecord(nextRecord);
    setComplianceReport(nextRecord.lastComplianceReport || null);
    setSubmissionComment(nextRecord.submissionComment || "");
    onAssignmentUpdate?.(nextRecord);

    if (action) {
      setLastAction(action);
      appendActivityEvent(action, courseCode);
    }
  }

  async function handleParsePrompt() {
    setIsParsing(true);
    setError(null);

    try {
      const nextRecord = updateAssignmentFromPrompt(assignmentId, promptInput, rubricInput);
      if (!nextRecord) {
        throw new Error("Could not update the assignment profile.");
      }

      const withCompliance = saveDraftAndCompliance(assignmentId, draft);
      syncRecord(withCompliance ?? nextRecord, `Updated assignment profile for ${title}`);
      setActiveTab("draft");
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Prompt parsing failed.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleGenerate(modeOverride?: AssignmentOutputMode) {
    setError(null);
    setIsGenerating(true);
    const modeToUse = modeOverride ?? generationMode;

    try {
      if (modeToUse === "submission_comment") {
        const comment = generateSubmissionComment(
          assignmentRecord ?? {
            id: assignmentId,
            course: courseCode,
            unit: profile.unit,
            title,
            type,
            prompt: promptInput,
            rubric: rubricInput,
            dueDate: dueDate || "",
            citationsRequired: profile.citationRequired,
            apaRequired: profile.apaReferenceRequired,
            practicalRequired: profile.practicalRequired,
            requiredDeliverables: profile.requiredDeliverables,
            requiredSections: profile.requiredSections,
            rubricCriteria: profile.rubricCriteria,
            status: "draft_started",
            readinessScore: 0,
            warnings: [],
            missingItems: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        );
        setSubmissionComment(comment);
        const nextRecord = patchAssignmentRecord(assignmentId, { submissionComment: comment });
        syncRecord(nextRecord ?? assignmentRecord, "Generated submission comment");
        return;
      }

      const nextDraft = await generateAcademicDraft({
        profile,
        draftText: draft,
        mode: modeToUse,
      });
      setDraft(nextDraft);

      const nextRecord = saveDraftAndCompliance(assignmentId, nextDraft, "draft_started");
      syncRecord(nextRecord, `Generated ${modeToUse.replaceAll("_", " ")} for ${title}`);
      setActiveTab("compliance");
      setReviewScanKey(Date.now());
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRunComplianceCheck() {
    setError(null);
    const nextRecord = saveDraftAndCompliance(assignmentId, draft);

    if (!nextRecord) {
      const adHocReport = runComplianceCheck(profile, draft);
      setComplianceReport(adHocReport);
      return;
    }

    syncRecord(nextRecord, `Ran compliance check for ${title}`);
  }

  function handleSaveDraft(nextDraft: string) {
    setDraft(nextDraft);
    setIsSaving(true);

    window.setTimeout(() => {
      const nextRecord = saveDraftAndCompliance(assignmentId, nextDraft, nextDraft.trim() ? "draft_started" : "not_started");
      syncRecord(nextRecord ?? assignmentRecord, undefined);
      setIsSaving(false);
    }, 150);
  }

  function handleMarkSubmitted() {
    const nextRecord = markAssignmentSubmitted(assignmentId);
    syncRecord(nextRecord, `Marked ${title} as submitted`);
  }

  function handleGenerateSubmissionComment() {
    setGenerationMode("submission_comment");
    void handleGenerate("submission_comment");
  }

  const tabButtonClass = (tab: WorkspaceTab) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      activeTab === tab
        ? "border-accent bg-accent/10 text-text"
        : "border-border/70 bg-panelAlt/50 text-muted hover:border-accent/35 hover:text-text"
    }`;

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Assignment command center</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">{title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-text">
              {getTypeLabel(type)}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">{points} points</span>
            {wordCount ? <span className="rounded-full border border-border/70 px-3 py-1">{wordCount}</span> : null}
            <span className="rounded-full border border-border/70 px-3 py-1">Due: {formatDate(dueDate)}</span>
            <span className={`rounded-full border px-3 py-1 ${getStatusTone(assignmentRecord?.status)}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="min-w-72 rounded-card border border-border/70 bg-panelAlt/55 p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
            <span>Submission readiness</span>
            <span>{readinessScore}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent transition-[width] duration-300"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-muted">
            {complianceReport?.nextAction || assignmentRecord?.missingItems[0] || "Import the full assignment prompt to start the intelligence engine."}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("intelligence")} className={tabButtonClass("intelligence")}>
          Intelligence
        </button>
        <button type="button" onClick={() => setActiveTab("draft")} className={tabButtonClass("draft")}>
          Draft
        </button>
        <button type="button" onClick={() => setActiveTab("compliance")} className={tabButtonClass("compliance")}>
          Compliance
        </button>
        <button type="button" onClick={() => setActiveTab("submit")} className={tabButtonClass("submit")}>
          Submit
        </button>
      </div>

      {error ? (
        <div className="rounded-card border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {lastAction ? (
        <div className="rounded-card border border-border/70 bg-panelAlt/55 px-4 py-3 text-sm text-muted">
          {lastAction}
        </div>
      ) : null}

      {activeTab === "intelligence" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Assignment prompt import</div>
              <p className="mt-3 text-sm leading-7 text-muted">
                Paste the full assignment prompt or discussion instructions here. This engine extracts word count, deliverables, due dates, citation rules, rubric clues, and whether peer posts or screenshots are still needed.
              </p>
              <textarea
                value={promptInput}
                onChange={(event) => setPromptInput(event.target.value)}
                className="mt-4 min-h-[220px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
                placeholder="Paste the full assignment prompt..."
              />
              <textarea
                value={rubricInput}
                onChange={(event) => setRubricInput(event.target.value)}
                className="mt-4 min-h-[120px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
                placeholder="Paste rubric details if provided..."
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleParsePrompt}
                  disabled={isParsing || !promptInput.trim()}
                  className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
                >
                  {isParsing ? "Parsing..." : "Run Assignment Intelligence Engine"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Prompt summary</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Course / Unit</span>
                    <span className="text-text">{profile.course || courseCode} {profile.unit || ""}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Type</span>
                    <span className="text-text">{profile.type}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Initial post words</span>
                    <span className="text-text">{profile.initialPostWordCount || "Not stated"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Peer replies</span>
                    <span className="text-text">
                      {profile.peerRepliesRequired > 0
                        ? `${profile.peerRepliesRequired} required${profile.peerReplyWordCount ? ` · ${profile.peerReplyWordCount}` : ""}`
                        : "None stated"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Citations / APA</span>
                    <span className="text-text">
                      {profile.citationRequired ? "Citation required" : "Citation not stated"} ·{" "}
                      {profile.apaReferenceRequired ? "APA required" : "APA not stated"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Practical evidence</span>
                    <span className="text-text">
                      {profile.practicalRequired ? profile.practicalEvidenceItems.join(", ") : "Not required"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Required deliverables</div>
                <div className="mt-4 space-y-2">
                  {(profile.requiredDeliverables.length > 0 ? profile.requiredDeliverables : ["No explicit deliverables extracted yet"]).map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Rubric checklist</div>
                <div className="mt-4 space-y-2">
                  {(profile.rubricCriteria.length > 0 ? profile.rubricCriteria : ["No rubric criteria parsed yet"]).map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <TutorPanel
            courseCode={courseCode}
            courseName={courseName}
            topicTitle={title}
            initialMode={type === "discussion" ? "discussion" : "assignment"}
            unitContext={promptInput || description}
            initialPrompt={`I reviewed the ${title} assignment prompt. Help me think through the required sections, what examples from my AWS or DevSecOps work fit naturally, and where I need stronger evidence.`}
            initialPromptMode={type === "discussion" ? "discussion" : "assignment"}
          />
        </div>
      ) : null}

      {activeTab === "draft" ? (
        <div className="space-y-5 rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Human Academic Writing Engine</div>
              <div className={`mt-2 text-sm ${getWordCountTone(complianceReport)}`}>
                {wordCountValue} words{profile.initialPostWordCount ? ` · target ${profile.initialPostWordCount}` : ""}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={generationMode}
                onChange={(event) => setGenerationMode(event.target.value as AssignmentOutputMode)}
                className="rounded-2xl border border-border/70 bg-panel/70 px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
              <button
                type="button"
                onClick={handleRunComplianceCheck}
                className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
              >
                Compliance Check
              </button>
            </div>
          </div>

          <textarea
            value={draft}
            onChange={(event) => handleSaveDraft(event.target.value)}
            placeholder="Final copy-ready answer appears here..."
            className="min-h-[360px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>{isSaving ? "Saving draft..." : "Draft saved locally"}</span>
            <span>{profile.apaReferenceRequired ? "APA references expected" : "APA optional unless prompt says otherwise"}</span>
          </div>
        </div>
      ) : null}

      {activeTab === "compliance" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Submission readiness panel</div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Status</span>
                  <span className="text-text">{complianceReport?.status || "Run compliance check"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Word count</span>
                  <span className="text-text">
                    {complianceReport ? `${complianceReport.wordCount} / ${complianceReport.wordCountRequirement}` : "Not checked"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Citation check</span>
                  <span className="text-text">{complianceReport ? (complianceReport.citationPass ? "Pass" : "Fail") : "Not checked"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">APA check</span>
                  <span className="text-text">{complianceReport ? (complianceReport.apaReferencePass ? "Pass" : "Fail") : "Not checked"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Rubric alignment</span>
                  <span className="text-text">{complianceReport?.rubricAlignment || "Not checked"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Next action</span>
                  <span className="text-text">{complianceReport?.nextAction || "Run the compliance guard"}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Missing items</div>
                  <div className="mt-2 space-y-2">
                    {(complianceReport?.missingItems.length ? complianceReport.missingItems : ["No compliance report yet"]).map((item) => (
                      <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Warnings</div>
                  <div className="mt-2 space-y-2">
                    {(complianceReport?.warnings.length ? complianceReport.warnings : ["No warnings"]).map((item) => (
                      <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRunComplianceCheck}
                  className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition"
                >
                  Run Submission Compliance Guard
                </button>
              </div>
            </div>

            <WritingScanner initialText={draft} autoScanKey={reviewScanKey || assignmentRecord?.updatedAt} />
          </div>
        </div>
      ) : null}

      {activeTab === "submit" ? (
        <div className="space-y-4 rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Submission control</div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-panel/60 p-4">
              <div className="text-sm text-text">Required action</div>
              <div className="mt-2 text-sm leading-7 text-muted">
                {complianceReport?.nextAction || "Import the prompt, generate the draft, and run the compliance guard."}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-panel/60 p-4">
              <div className="text-sm text-text">Submission comment</div>
              <textarea
                value={submissionComment}
                onChange={(event) => {
                  const value = event.target.value;
                  setSubmissionComment(value);
                  const nextRecord = patchAssignmentRecord(assignmentId, { submissionComment: value });
                  if (nextRecord) {
                    setAssignmentRecord(nextRecord);
                  }
                }}
                className="mt-3 min-h-[120px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
                placeholder="Submission comment..."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerateSubmissionComment}
              className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
            >
              Generate Submission Comment
            </button>
            <button
              type="button"
              onClick={handleMarkSubmitted}
              disabled={assignmentRecord?.status === "submitted"}
              className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-100 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
            >
              {assignmentRecord?.status === "submitted" ? "Submitted" : "Mark Submitted"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
