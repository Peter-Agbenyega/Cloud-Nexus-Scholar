"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  appendActivityEvent,
  LibraryEntry,
  readLibraryEntries,
  writeLibraryEntries,
} from "@/lib/app-state";

type WorkspaceCourse = "CLCS 605" | "CLCS 615";
type WorkspaceMode = "full" | "discussion" | "quiz" | "check";
type StageStatus = "idle" | "running" | "done";
type StageKey = "gpt" | "search" | "claude" | "finalizing";

type PipelineResult = {
  finalAnswer: string;
  sources: string[];
  rubricCheck: string;
  gptDraft: string;
  confidence: string;
};

type ScanSentence = {
  text: string;
  aiFlag: boolean;
  aiReason: string;
  patchwritingFlag: boolean;
  patchwritingReason: string;
  citationFlag: boolean;
  citationReason: string;
  voiceFlag: boolean;
  voiceReason: string;
  riskLevel: string;
};

type ScanResult = {
  aiScore: number;
  plagiarismRisk: number;
  citationScore: number;
  voiceScore: number;
  overallScore: number;
  verdict: string;
  summary: string;
  sentences: ScanSentence[];
  citationGaps: Array<{
    sentence: string;
    suggestedCitation: string;
  }>;
  advice: string;
  preSubmissionChecklist: Array<{
    item: string;
    passed: boolean;
    note: string;
  }>;
};

type PipelineEvent = {
  stage?: string;
  status?: string;
  message?: string;
  gptDraft?: string;
  sources?: string[];
  finalAnswer?: string;
  rubricCheck?: string;
  confidence?: string;
};

const COURSE_STORAGE_KEY = "cns_workspace_course";
const ATTRIBUTION_TEXT =
  "AI attribution: I used AI assistance for brainstorming, research, and structural feedback during preparation of this work. The final writing and analysis reflect my own understanding of the course material.";

const modeOptions: Array<{ value: WorkspaceMode; label: string }> = [
  { value: "full", label: "🔍 Full Answer" },
  { value: "discussion", label: "📝 Help Me Write" },
  { value: "quiz", label: "🎓 Quiz Me" },
  { value: "check", label: "✅ Check My Work" },
];

const courseOptions: WorkspaceCourse[] = ["CLCS 605", "CLCS 615"];

const stageMetadata: Array<{ key: StageKey; label: string }> = [
  { key: "gpt", label: "GPT Drafting..." },
  { key: "search", label: "Finding real sources..." },
  { key: "claude", label: "Claude reviewing..." },
  { key: "finalizing", label: "Finalizing..." },
];

function getInitialStageProgress(): Record<StageKey, StageStatus> {
  return {
    gpt: "idle",
    search: "idle",
    claude: "idle",
    finalizing: "idle",
  };
}

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function extractTaggedSection(input: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[${escapedTag}\\]([\\s\\S]*?)(?=\\n\\[[A-Z ]+\\]|$)`, "i");
  return input.match(regex)?.[1]?.trim() ?? "";
}

function stripTaggedSections(input: string) {
  return input.replace(/\n?\[(SOURCES|RUBRIC CHECK|CONFIDENCE)\][\s\S]*$/i, "").trim();
}

function getStageBlocks(status: StageStatus) {
  if (status === "done") {
    return "██████████";
  }

  if (status === "running") {
    return "████░░░░░░";
  }

  return "░░░░░░░░░░";
}

function getStageWidth(status: StageStatus) {
  if (status === "done") {
    return "100%";
  }

  if (status === "running") {
    return "40%";
  }

  return "0%";
}

function getScanTheme(overallScore: number) {
  if (overallScore < 20) {
    return {
      container: "border-emerald-400/35 bg-emerald-500/10",
      text: "text-emerald-200",
      bar: "bg-emerald-400",
    };
  }

  if (overallScore < 60) {
    return {
      container: "border-amber-400/35 bg-amber-500/10",
      text: "text-amber-200",
      bar: "bg-amber-400",
    };
  }

  return {
    container: "border-rose-400/35 bg-rose-500/10",
    text: "text-rose-200",
    bar: "bg-rose-400",
  };
}

function getIntegrityVerdict(result: ScanResult) {
  if (result.aiScore >= 70 || result.overallScore >= 60) {
    return "AI-Generated";
  }

  if (result.aiScore >= 35 || result.overallScore >= 20) {
    return "Mixed";
  }

  return "Human";
}

function getFlagReason(sentence: ScanSentence) {
  const reasons = [
    sentence.aiFlag ? sentence.aiReason : "",
    sentence.patchwritingFlag ? sentence.patchwritingReason : "",
    sentence.citationFlag ? sentence.citationReason : "",
    sentence.voiceFlag ? sentence.voiceReason : "",
  ].filter(Boolean);

  return reasons.join(" ");
}

function Dots() {
  return (
    <span className="ml-2 inline-flex gap-1 align-middle">
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-950" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-950 [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-950 [animation-delay:240ms]" />
    </span>
  );
}

export default function WorkspacePage() {
  const [inputText, setInputText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<WorkspaceCourse>("CLCS 605");
  const [selectedMode, setSelectedMode] = useState<WorkspaceMode>("full");
  const [isRunning, setIsRunning] = useState(false);
  const [stageProgress, setStageProgress] = useState<Record<StageKey, StageStatus>>(
    getInitialStageProgress(),
  );
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [attributionCopied, setAttributionCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedCourse = window.localStorage.getItem(COURSE_STORAGE_KEY);

      if (savedCourse === "CLCS 605" || savedCourse === "CLCS 615") {
        setSelectedCourse(savedCourse);
      }
    } catch {}
  }, []);

  const wordCount = useMemo(() => countWords(inputText), [inputText]);
  const characterCount = inputText.length;
  const trimmedInput = inputText.trim();
  const answerBody = result ? stripTaggedSections(result.finalAnswer) : "";
  const flaggedSentences = useMemo(
    () =>
      scanResult?.sentences.filter(
        (sentence) =>
          sentence.aiFlag ||
          sentence.patchwritingFlag ||
          sentence.citationFlag ||
          sentence.voiceFlag,
      ) ?? [],
    [scanResult],
  );

  function handleCourseSelect(course: WorkspaceCourse) {
    setSelectedCourse(course);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(COURSE_STORAGE_KEY, course);
    } catch {}
  }

  function resetOutputState() {
    setResult(null);
    setScanResult(null);
    setError(null);
    setCopied(false);
    setShowSources(false);
    setShowRubric(false);
    setStageProgress(getInitialStageProgress());
  }

  function startPipelineStages() {
    setStageProgress({
      gpt: "running",
      search: "idle",
      claude: "idle",
      finalizing: "idle",
    });
  }

  function updateStage(stage: StageKey) {
    setStageProgress((current) => {
      const next = { ...current };

      if (stage === "gpt") {
        next.gpt = "running";
      }

      if (stage === "search") {
        next.gpt = "done";
        next.search = "running";
      }

      if (stage === "claude") {
        next.gpt = "done";
        next.search = "done";
        next.claude = "running";
      }

      if (stage === "finalizing") {
        next.gpt = "done";
        next.search = "done";
        next.claude = "done";
        next.finalizing = "running";
      }

      return next;
    });
  }

  function completeStages() {
    setStageProgress({
      gpt: "done",
      search: "done",
      claude: "done",
      finalizing: "done",
    });
  }

  async function parsePipelineStream(response: Response) {
    if (!response.body) {
      throw new Error("Pipeline response body missing.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventChunk of events) {
        const lines = eventChunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6).trim();

          if (!data) {
            continue;
          }

          const parsed = JSON.parse(data) as PipelineEvent;

          if (parsed.stage === "gpt" && parsed.status === "running") {
            updateStage("gpt");
          }

          if (parsed.stage === "search" && parsed.status === "running") {
            updateStage("search");
          }

          if (parsed.stage === "claude" && parsed.status === "running") {
            updateStage("claude");
          }

          if (parsed.stage === "complete") {
            updateStage("finalizing");
            completeStages();
            setResult({
              finalAnswer: parsed.finalAnswer ?? "",
              sources: parsed.sources ?? [],
              rubricCheck:
                parsed.rubricCheck ??
                extractTaggedSection(parsed.finalAnswer ?? "", "RUBRIC CHECK"),
              gptDraft: parsed.gptDraft ?? "",
              confidence:
                parsed.confidence ?? extractTaggedSection(parsed.finalAnswer ?? "", "CONFIDENCE"),
            });
            appendActivityEvent("Generated workspace answer", selectedCourse);
          }

          if (parsed.stage === "error") {
            throw new Error(parsed.message ?? "Pipeline failed.");
          }
        }
      }
    }
  }

  async function runWorkspace() {
    if (!trimmedInput || isRunning) {
      return;
    }

    setIsRunning(true);
    resetOutputState();

    try {
      if (selectedMode === "check") {
        startPipelineStages();
        updateStage("search");
        updateStage("claude");
        updateStage("finalizing");

        const response = await fetch("/api/scan-writing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmedInput }),
        });

        const payload = (await response.json()) as ScanResult & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Integrity scan failed.");
        }

        completeStages();
        setScanResult(payload);
        appendActivityEvent("Ran workspace integrity check", selectedCourse);
        return;
      }

      startPipelineStages();

      const pipelineMode =
        selectedMode === "full"
          ? "assignment"
          : selectedMode === "discussion"
            ? "discussion"
            : "quiz";

      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedInput,
          courseCode: selectedCourse,
          topicTitle: "Assignment Workspace",
          mode: pipelineMode,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        throw new Error(errorPayload?.details ?? errorPayload?.error ?? "Pipeline request failed.");
      }

      await parsePipelineStream(response);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Something went wrong.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopy(text: string, setter: (value: boolean) => void) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      window.setTimeout(() => setter(false), 3000);
    } catch {
      setError("Copy failed in this browser.");
    }
  }

  function saveToLibrary() {
    const content = result
      ? answerBody
      : scanResult
        ? `Integrity Check\nOverall Score: ${scanResult.overallScore}/100\nVerdict: ${getIntegrityVerdict(scanResult)}\n\n${scanResult.advice}`
        : "";

    if (!content || typeof window === "undefined") {
      return;
    }

    try {
      const entry: LibraryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title:
          selectedMode === "check"
            ? `Workspace integrity check - ${selectedCourse}`
            : `Workspace answer - ${selectedCourse}`,
        courseCode: selectedCourse,
        topic: "Assignment Workspace",
        content,
        tags: ["workspace", selectedMode, selectedCourse],
        type: "saved-draft",
        createdAt: new Date().toISOString(),
      };

      writeLibraryEntries([entry, ...readLibraryEntries()]);
      appendActivityEvent("Saved workspace result to library", selectedCourse);
    } catch {
      setError("Could not save to Library.");
    }
  }

  function startNewQuestion() {
    setInputText("");
    setIsRunning(false);
    resetOutputState();
  }

  const scanTheme = scanResult ? getScanTheme(scanResult.overallScore) : null;
  const integrityVerdict = scanResult ? getIntegrityVerdict(scanResult) : null;

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Workspace</div>
        <h1 className="mt-3 text-4xl font-semibold text-text">Assignment Workspace</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Paste your work below. One click. Done.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-6 rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div>
            <label
              htmlFor="workspace-input"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-text"
            >
              Paste Your Work Here
            </label>
            <textarea
              id="workspace-input"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder={`Paste your question, draft, discussion post,\nor assignment here...\n\nProf. Scholar will:\n→ Research and find real sources\n→ Polish and improve your writing\n→ Check against the rubric\n→ Give you one clean final answer`}
              className="mt-3 min-h-[500px] w-full rounded-3xl border border-border/70 bg-panel/70 px-5 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
            />
            <div className="mt-3 text-sm text-muted">
              {wordCount} words · {characterCount} characters
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-text">Which course is this for?</div>
            <div className="flex flex-wrap gap-3">
              {courseOptions.map((course) => {
                const active = selectedCourse === course;

                return (
                  <button
                    key={course}
                    type="button"
                    onClick={() => handleCourseSelect(course)}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-accent bg-accent text-slate-950"
                        : "border-border/70 bg-panel/70 text-text hover:border-accent/35 hover:text-accent"
                    }`}
                  >
                    {course}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-text">What do you need?</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {modeOptions.map((option) => {
                const active = selectedMode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedMode(option.value)}
                    className={`rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition ${
                      active
                        ? "border-accent bg-accent/10 text-text ring-1 ring-accent/20"
                        : "border-border/70 bg-panel/70 text-muted hover:border-accent/35 hover:text-text"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void runWorkspace()}
            disabled={!trimmedInput || isRunning}
            className="inline-flex min-h-16 w-full items-center justify-center rounded-3xl border border-accent bg-accent px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
          >
            {isRunning ? (
              <>
                Working... Please wait
                <Dots />
              </>
            ) : (
              "▶ Get My Answer"
            )}
          </button>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </article>

        <article className="space-y-6 rounded-card border border-border/70 bg-panel/80 p-6">
          {!result && !scanResult && !isRunning ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-card border border-dashed border-border/70 bg-panelAlt/40 p-8 text-center">
              <div className="text-7xl text-accent">←</div>
              <h2 className="mt-4 text-2xl font-semibold text-text">
                Your polished answer will appear here
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-muted">
                Paste your work on the left, choose the course and mode, then run the workspace.
              </p>
            </div>
          ) : null}

          {isRunning ? (
            <div className="space-y-4 rounded-card border border-border/70 bg-panelAlt/45 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">Pipeline progress</div>
              {stageMetadata.map((stage) => {
                const status = stageProgress[stage.key];
                const isActive = status === "running";
                const isDone = status === "done";

                return (
                  <div
                    key={stage.key}
                    className={`rounded-2xl border px-4 py-4 ${
                      isDone
                        ? "border-emerald-400/30 bg-emerald-500/10"
                        : "border-border/70 bg-panel/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 font-mono text-sm">
                      <span className={isDone ? "text-emerald-200" : "text-text"}>
                        [{getStageBlocks(status)}] {stage.label}
                      </span>
                      {isDone ? (
                        <span className="text-emerald-300">✓</span>
                      ) : isActive ? (
                        <span className="animate-pulse text-accent">●</span>
                      ) : null}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-panelAlt/80 ring-1 ring-inset ring-white/5">
                      <div
                        className={`h-full transition-[width] duration-500 ${
                          isDone ? "bg-emerald-400" : "bg-accent"
                        } ${isActive ? "animate-pulse" : ""}`}
                        style={{ width: getStageWidth(status) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-card border border-border/70 bg-panelAlt/50 p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-accent">Final answer</div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-text">
                  {answerBody || result.finalAnswer}
                </div>
                {result.confidence ? (
                  <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {result.confidence}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void handleCopy(answerBody || result.finalAnswer, setCopied)}
                className="inline-flex min-h-16 w-full items-center justify-center rounded-3xl border border-accent bg-accent px-6 py-4 text-lg font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                {copied ? "✓ Copied! Paste into LEO now" : "📋 COPY THIS ANSWER"}
              </button>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveToLibrary}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  💾 Save to Library
                </button>
                <button
                  type="button"
                  onClick={startNewQuestion}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  🔄 New Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowSources((current) => !current)}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  {showSources ? "Hide Sources" : "Show Sources"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRubric((current) => !current)}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  {showRubric ? "Hide Rubric Check" : "Show Rubric Check"}
                </button>
              </div>

              {showSources ? (
                <div className="rounded-card border border-border/70 bg-panelAlt/45 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-accent">Real citations</div>
                  <div className="mt-4 space-y-3">
                    {result.sources.length > 0 ? (
                      result.sources.map((source) => {
                        const [label, rawUrl] = source.split(" | ");
                        const href = rawUrl?.startsWith("http") ? rawUrl : undefined;

                        return href ? (
                          <a
                            key={source}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text transition hover:border-accent/35 hover:text-accent"
                          >
                            {label}
                          </a>
                        ) : (
                          <div
                            key={source}
                            className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text"
                          >
                            {source}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">No source links were returned for this run.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {showRubric ? (
                <div className="rounded-card border border-amber-400/30 bg-amber-500/10 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-amber-200">
                    Rubric check
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text">
                    {result.rubricCheck || "No separate rubric check was returned in this response."}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {scanResult ? (
            <div className="space-y-4">
              <div className={`rounded-card border p-6 ${scanTheme?.container ?? ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-accent">
                      Integrity check
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-text">
                      Overall score: {scanResult.overallScore}/100
                    </h2>
                    <p className={`mt-2 text-sm font-semibold ${scanTheme?.text ?? "text-text"}`}>
                      Verdict: {integrityVerdict}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Scanner verdict: {scanResult.verdict}
                    </p>
                  </div>
                  <div className="min-w-40 rounded-3xl border border-border/70 bg-panel/60 px-4 py-3 text-sm text-text">
                    <div>AI score: {scanResult.aiScore}</div>
                    <div className="mt-1">Citation score: {scanResult.citationScore}</div>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-panel/70 ring-1 ring-inset ring-white/5">
                  <div
                    className={`h-full transition-[width] duration-500 ${scanTheme?.bar ?? "bg-accent"}`}
                    style={{ width: `${scanResult.overallScore}%` }}
                  />
                </div>

                <p className="mt-5 text-sm leading-7 text-text">{scanResult.summary}</p>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/50 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-accent">Flagged sentences</div>
                <div className="mt-4 space-y-3">
                  {flaggedSentences.length > 0 ? (
                    flaggedSentences.map((sentence, index) => (
                      <div
                        key={`${sentence.text}-${index}`}
                        className="rounded-2xl border border-border/70 bg-panel/60 px-4 py-3"
                      >
                        <div className="text-sm leading-7 text-text">{sentence.text}</div>
                        <div className="mt-2 text-xs text-muted">{getFlagReason(sentence)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No flagged sentences were returned.</p>
                  )}
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/50 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-accent">Advice</div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text">
                  {scanResult.advice}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveToLibrary}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  💾 Save to Library
                </button>
                <button
                  type="button"
                  onClick={startNewQuestion}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  🔄 New Question
                </button>
              </div>
            </div>
          ) : null}

          {(result || scanResult) ? (
            <div className="rounded-card border border-border/70 bg-panelAlt/45 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">AI attribution</div>
              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start">
                <textarea
                  readOnly
                  value={ATTRIBUTION_TEXT}
                  className="min-h-28 flex-1 rounded-2xl border border-border/70 bg-panel/60 px-4 py-3 text-sm leading-7 text-text outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleCopy(ATTRIBUTION_TEXT, setAttributionCopied)}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  {attributionCopied ? "✓ Copied" : "Copy Attribution"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-card border border-accent/20 bg-accent/5 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-accent">Start here</div>
            <h3 className="mt-2 text-xl font-semibold text-text">One click from draft to LEO</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Use this page to paste work, generate a final answer, copy it, and submit. Need the
              full course view instead? Open the course workspace or library from the sidebar.
            </p>
            <div className="mt-4">
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
              >
                Open Library
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
