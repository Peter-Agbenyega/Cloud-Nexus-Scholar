"use client";

import { useEffect, useMemo, useState } from "react";

import { PromptInputTemplate } from "@/components/prompt-input-template";
import { TutorPanel } from "@/components/tutor-panel";
import { WritingScanner } from "@/components/writing-scanner";
import {
  countWords,
  formatSubmissionDraft,
  generateAcademicDraft,
  generateSubmissionComment,
  parseAssignmentPrompt,
  runComplianceCheck,
} from "@/lib/assignment-agent";
import {
  EMPTY_PROMPT_TEMPLATE,
  buildPromptTemplateInput,
  isPromptTemplateComplete,
  parsePromptTemplate,
} from "@/lib/prompt-template";
import {
  getAssignmentRecord,
  markAssignmentSubmitted,
  patchAssignmentRecord,
  saveDraftAndCompliance,
  updateAssignmentFromPrompt,
} from "@/lib/assignment-store";
import { appendActivityEvent } from "@/lib/app-state";
import { SyllabusAssignmentType } from "@/lib/syllabus-data";
import { AssignmentOutputMode, AssignmentRecord, ComplianceReport, ParsedPromptTemplate } from "@/lib/types";

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

type WorkspaceTab = "draft" | "compliance" | "submit";

const modeOptions: Array<{ value: AssignmentOutputMode; label: string }> = [
  { value: "initial_post", label: "Initial Post" },
  { value: "full_assignment", label: "Full Assignment" },
  { value: "outline", label: "Outline" },
  { value: "rubric_cleanup", label: "Rubric Cleanup" },
  { value: "apa_reference_cleanup", label: "APA Cleanup" },
];

const complianceGrid = [
  { key: "wordCountPass", label: "Word Count" },
  { key: "headerPass", label: "Header Block" },
  { key: "citationReferencePass", label: "Citations Match" },
  { key: "apa7Pass", label: "APA 7" },
  { key: "sourceRecencyPass", label: "Source Recency" },
  { key: "turnitinSafePass", label: "Turnitin Safe" },
  { key: "promptCoveragePass", label: "Prompt Coverage" },
  { key: "rubricPass", label: "Rubric Coverage" },
] satisfies Array<{ key: keyof ComplianceReport; label: string }>;

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
      return "border-rose-400/35 bg-rose-500/10 text-rose-100";
    default:
      return "border-border/70 bg-panel/70 text-muted";
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

function buildInitialTemplate(args: {
  courseCode: string;
  type: SyllabusAssignmentType;
  wordCount?: string;
  dueDate?: string;
  description: string;
  rubricText: string;
  existingPrompt?: string;
}): ParsedPromptTemplate {
  const parsed = args.existingPrompt ? parsePromptTemplate(args.existingPrompt) : EMPTY_PROMPT_TEMPLATE;

  return {
    course: parsed.course || args.courseCode,
    unit: parsed.unit,
    professor: parsed.professor,
    due: parsed.due || args.dueDate || "",
    type: parsed.type || getTypeLabel(args.type),
    wordCount: parsed.wordCount || args.wordCount || "",
    assignmentInstructions: parsed.assignmentInstructions || args.description,
    rubric: parsed.rubric || args.rubricText,
    specialRequirements: parsed.specialRequirements,
  };
}

function copyToClipboard(value: string) {
  if (typeof window === "undefined" || !window.navigator?.clipboard) {
    return Promise.resolve(false);
  }

  return window.navigator.clipboard
    .writeText(value)
    .then(() => true)
    .catch(() => false);
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
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("draft");
  const [assignmentRecord, setAssignmentRecord] = useState<AssignmentRecord | null>(null);
  const [templateInput, setTemplateInput] = useState<ParsedPromptTemplate>(
    buildInitialTemplate({
      courseCode,
      type,
      wordCount,
      dueDate,
      description,
      rubricText: formatRubricText(rubric),
    }),
  );
  const [draft, setDraft] = useState("");
  const [generationMode, setGenerationMode] = useState<AssignmentOutputMode>(
    type === "discussion" ? "initial_post" : "full_assignment",
  );
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [submissionComment, setSubmissionComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"" | "markdown" | "leo">("");

  useEffect(() => {
    const existing = getAssignmentRecord(assignmentId);
    if (!existing) {
      return;
    }

    const rubricText = existing.rubric || formatRubricText(rubric);

    setAssignmentRecord(existing);
    setTemplateInput(
      buildInitialTemplate({
        courseCode,
        type,
        wordCount,
        dueDate,
        description,
        rubricText,
        existingPrompt: existing.prompt,
      }),
    );
    setDraft(existing.finalDraft || "");
    setComplianceReport(existing.lastComplianceReport || null);
    setSubmissionComment(existing.submissionComment || "");
  }, [assignmentId, courseCode, description, dueDate, rubric, type, wordCount]);

  const compiledPrompt = useMemo(() => buildPromptTemplateInput(templateInput), [templateInput]);
  const profile = useMemo(
    () => parseAssignmentPrompt(compiledPrompt, templateInput.rubric),
    [compiledPrompt, templateInput.rubric],
  );
  const templateComplete = isPromptTemplateComplete(templateInput);
  const wordCountValue = countWords(draft);
  const aiScore = complianceReport?.humanizationReport.aiScore ?? 0;
  const readinessScore = complianceReport?.readinessScore ?? assignmentRecord?.readinessScore ?? 0;

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

  async function handleImportTemplate() {
    setIsParsing(true);
    setError(null);

    try {
      const nextRecord = updateAssignmentFromPrompt(assignmentId, compiledPrompt, templateInput.rubric);
      if (!nextRecord) {
        throw new Error("Could not update the assignment profile.");
      }

      syncRecord(nextRecord, `Updated strict template for ${title}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Template import failed.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleGenerate(modeOverride?: AssignmentOutputMode) {
    if (!templateComplete) {
      setError("Complete every template field before generation.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    const modeToUse = modeOverride ?? generationMode;

    try {
      const rawDraft = await generateAcademicDraft({
        profile,
        draftText: draft,
        mode: modeToUse,
      });
      const formattedDraft = await formatSubmissionDraft(profile, rawDraft);
      setDraft(formattedDraft);

      const nextRecord = saveDraftAndCompliance(assignmentId, formattedDraft, "draft_started");
      syncRecord(nextRecord, `Generated ${modeToUse.replaceAll("_", " ")} for ${title}`);
      setActiveTab("compliance");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveDraft(nextDraft: string) {
    setDraft(nextDraft);
    setIsSaving(true);

    window.setTimeout(() => {
      const nextRecord = saveDraftAndCompliance(
        assignmentId,
        nextDraft,
        nextDraft.trim() ? "draft_started" : "not_started",
      );
      syncRecord(nextRecord ?? assignmentRecord, undefined);
      setIsSaving(false);
    }, 150);
  }

  function handleRunComplianceCheck() {
    setError(null);
    const nextRecord = saveDraftAndCompliance(assignmentId, draft);

    if (!nextRecord) {
      setComplianceReport(runComplianceCheck(profile, draft));
      return;
    }

    syncRecord(nextRecord, `Ran strict compliance check for ${title}`);
  }

  async function handleCopy(kind: "markdown" | "leo") {
    const text = kind === "markdown" ? draft : draft.replace(/\n{3,}/g, "\n\n");
    const ok = await copyToClipboard(text);
    setCopyState(ok ? kind : "");
    if (ok) {
      window.setTimeout(() => setCopyState(""), 1800);
    }
  }

  function handleMarkSubmitted() {
    const nextRecord = markAssignmentSubmitted(assignmentId);
    syncRecord(nextRecord, `Marked ${title} as submitted`);
  }

  function handleGenerateSubmissionComment() {
    const comment = generateSubmissionComment(
      assignmentRecord ?? {
        id: assignmentId,
        course: courseCode,
        unit: profile.unit,
        title,
        type,
        prompt: compiledPrompt,
        rubric: templateInput.rubric,
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
    if (nextRecord) {
      syncRecord(nextRecord, "Generated submission comment");
    }
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
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Strict submission controller</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">{title}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-text">
              {getTypeLabel(type)}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">{points} points</span>
            {wordCount ? <span className="rounded-full border border-border/70 px-3 py-1">{wordCount}</span> : null}
            <span className="rounded-full border border-border/70 px-3 py-1">Due: {dueDate || "Check prompt"}</span>
            <span className={`rounded-full border px-3 py-1 ${getStatusTone(assignmentRecord?.status)}`}>
              {assignmentRecord?.status?.replaceAll("_", " ") || "not started"}
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
            {complianceReport?.nextAction || "Complete the template, generate the draft, then clear the compliance gates."}
          </div>
        </div>
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

      <PromptInputTemplate value={templateInput} onChange={setTemplateInput} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleImportTemplate()}
          disabled={isParsing || !templateComplete}
          className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
        >
          {isParsing ? "Saving Template..." : "Save Template to Workspace"}
        </button>
        <span className="text-sm text-muted">
          {templateComplete ? "Template complete. Generation unlocked." : "All nine template fields are required."}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("draft")} className={tabButtonClass("draft")}>
          Draft
        </button>
        <button type="button" onClick={() => setActiveTab("compliance")} className={tabButtonClass("compliance")}>
          Compliance Report
        </button>
        <button type="button" onClick={() => setActiveTab("submit")} className={tabButtonClass("submit")}>
          Submit
        </button>
      </div>

      {activeTab === "draft" ? (
        <div className="space-y-6">
          <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Draft control</div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-border/70 px-3 py-1 text-text">
                    {wordCountValue} words
                  </span>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-text">
                    Target {profile.initialPostWordCount || "not stated"}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 ${
                      aiScore < 20
                        ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                        : "border-amber-400/35 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    AI score {aiScore}
                  </span>
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
                  disabled={isGenerating || !templateComplete}
                  className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
                >
                  {isGenerating ? "Generating..." : "Generate Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleRunComplianceCheck}
                  className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
                >
                  Run Compliance
                </button>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={(event) => handleSaveDraft(event.target.value)}
              placeholder="Formatted draft appears here after generation."
              className="mt-5 min-h-[420px] w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
              <span>{isSaving ? "Saving draft..." : "Draft saved locally"}</span>
              <span>{profile.type === "discussion" ? "AI attribution is appended automatically for discussions." : "Header is injected automatically for assignment drafts."}</span>
            </div>
          </div>

          <TutorPanel
            courseCode={courseCode}
            courseName={courseName}
            topicTitle={title}
            initialMode={type === "discussion" ? "discussion" : "assignment"}
            unitContext={compiledPrompt}
            initialPrompt={`Use this prompt template to help me cover every section, map evidence to the rubric, and keep the tone natural and direct.`}
            initialPromptMode={type === "discussion" ? "discussion" : "assignment"}
          />
        </div>
      ) : null}

      {activeTab === "compliance" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {complianceGrid.map((item) => {
              const pass = Boolean(complianceReport?.[item.key]);
              return (
                <div key={item.key} className="rounded-card border border-border/70 bg-panelAlt/55 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</div>
                  <div
                    className={`mt-3 text-sm ${
                      pass ? "text-emerald-200" : "text-amber-200"
                    }`}
                  >
                    {complianceReport ? (pass ? "Pass" : "Fail") : "Not checked"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Rubric checklist</div>
                <div className="mt-4 space-y-2">
                  {(complianceReport?.rubricChecklist.length
                    ? complianceReport.rubricChecklist
                    : [{ id: "empty", label: "No rubric evaluation yet.", pass: false, detail: "Run compliance after generating or editing the draft." }]).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-text">{item.label}</span>
                        <span className={item.pass ? "text-emerald-200" : "text-amber-200"}>
                          {item.pass ? "Pass" : "Fail"}
                        </span>
                      </div>
                      <div className="mt-2 text-muted">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Missing items</div>
                <div className="mt-4 space-y-2">
                  {(complianceReport?.missingItems.length
                    ? complianceReport.missingItems
                    : ["No missing items reported yet."]).map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Warnings</div>
                <div className="mt-4 space-y-2">
                  {(complianceReport?.warnings.length ? complianceReport.warnings : ["No warnings yet."]).map((item) => (
                    <div key={item} className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Humanization report</div>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <div>AI score: {complianceReport?.humanizationReport.aiScore ?? "Not checked"}</div>
                  <div>
                    Replaced phrases:{" "}
                    {complianceReport?.humanizationReport.replacedPhrases.join(", ") || "None detected"}
                  </div>
                  <div>
                    Duplicate blocks:{" "}
                    {complianceReport?.humanizationReport.duplicateParagraphs.join(" | ") || "None detected"}
                  </div>
                </div>
              </div>
            </div>

            <WritingScanner initialText={draft} autoScanKey={assignmentRecord?.updatedAt || draft} />
          </div>
        </div>
      ) : null}

      {activeTab === "submit" ? (
        <div className="space-y-5 rounded-card border border-border/70 bg-panelAlt/55 p-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-panel/60 p-4">
              <div className="text-sm text-text">Submission status</div>
              <div className="mt-2 text-sm leading-7 text-muted">
                {complianceReport?.status || "Run compliance before preparing the final copy."}
              </div>
              <div className="mt-2 text-sm leading-7 text-muted">
                {complianceReport?.nextAction || "Complete the draft and clear all strict gates."}
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
              onClick={() => void handleCopy("markdown")}
              disabled={!draft.trim()}
              className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text disabled:cursor-not-allowed"
            >
              {copyState === "markdown" ? "Copied Markdown" : "Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={() => void handleCopy("leo")}
              disabled={!draft.trim()}
              className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text disabled:cursor-not-allowed"
            >
              {copyState === "leo" ? "Copied for LEO" : "Copy for LEO"}
            </button>
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
              disabled={assignmentRecord?.status === "submitted" || complianceReport?.status !== "Ready to submit"}
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
