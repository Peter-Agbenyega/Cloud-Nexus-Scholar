"use client";

import { useState } from "react";

import {
  appendActivityEvent,
  LibraryEntry,
  readLibraryEntries,
  writeLibraryEntries,
} from "@/lib/app-state";

type PipelineMode = "assignment" | "concept" | "discussion" | "quiz";
type PipelineStage = "idle" | "gpt" | "search" | "claude" | "complete";

type AIPipelineProps = {
  courseCode: string;
  topicTitle: string;
  assignmentContext?: string;
  rubric?: Record<string, number>;
  mode: PipelineMode;
};

type PipelineResult = {
  gptDraft: string;
  sources: string[];
  finalAnswer: string;
  rubricCheck: string;
  confidence: string;
};

const stageOrder: PipelineStage[] = ["gpt", "search", "claude", "complete"];
const flowNodes: { id: PipelineStage | "you"; label: string }[] = [
  { id: "you", label: "You" },
  { id: "gpt", label: "GPT-4o Draft" },
  { id: "search", label: "Live Sources" },
  { id: "claude", label: "Claude Review" },
  { id: "complete", label: "Final Answer" },
];

const stageDescriptions: { id: PipelineStage; label: string }[] = [
  { id: "gpt", label: "GPT-4o drafting initial answer..." },
  { id: "search", label: "Perplexity searching real sources..." },
  { id: "claude", label: "Claude reviewing and improving..." },
  { id: "complete", label: "Finalizing your answer..." },
];

const DISCUSSION_DRAFT_PREFIX = "cns_pipeline_draft";

function getDraftStorageKey(courseCode: string, topicTitle: string) {
  return `${DISCUSSION_DRAFT_PREFIX}_${courseCode}_${topicTitle}`;
}

function isStageComplete(stage: PipelineStage, completedStages: string[]) {
  return completedStages.includes(stage);
}

export function AIPipeline({
  courseCode,
  topicTitle,
  assignmentContext,
  rubric,
  mode,
}: AIPipelineProps) {
  const [question, setQuestion] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<PipelineStage>("idle");
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDraft, setShowDraft] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const trimmedQuestion = question.trim();
  const characterCount = question.length;

  function resetPipeline() {
    setQuestion("");
    setIsRunning(false);
    setCurrentStage("idle");
    setCompletedStages([]);
    setResult(null);
    setError(null);
    setShowDraft(false);
    setActionMessage(null);
  }

  function addCompletedStage(stage: string) {
    setCompletedStages((previous) =>
      previous.includes(stage) ? previous : [...previous, stage],
    );
  }

  async function runPipeline() {
    if (!trimmedQuestion || isRunning) {
      return;
    }

    setIsRunning(true);
    setCurrentStage("gpt");
    setCompletedStages([]);
    setResult(null);
    setError(null);
    setShowDraft(false);
    setActionMessage(null);

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmedQuestion,
          courseCode,
          topicTitle,
          assignmentContext,
          rubric,
          mode,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        throw new Error(errorPayload?.details ?? errorPayload?.error ?? "Pipeline request failed.");
      }

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

            try {
              const parsed = JSON.parse(data) as {
                stage?: string;
                status?: string;
                message?: string;
                gptDraft?: string;
                sources?: string[];
                finalAnswer?: string;
                rubricCheck?: string;
                confidence?: string;
              };

              if (parsed.stage === "gpt" && parsed.status === "running") {
                setCurrentStage("gpt");
              }

              if (parsed.stage === "search" && parsed.status === "running") {
                addCompletedStage("gpt");
                setCurrentStage("search");
              }

              if (parsed.stage === "claude" && parsed.status === "running") {
                addCompletedStage("gpt");
                addCompletedStage("search");
                setCurrentStage("claude");
              }

              if (parsed.stage === "complete") {
                setCurrentStage("complete");
                setCompletedStages(["gpt", "search", "claude", "complete"]);
                setResult({
                  gptDraft: parsed.gptDraft ?? "",
                  sources: parsed.sources ?? [],
                  finalAnswer: parsed.finalAnswer ?? "",
                  rubricCheck: parsed.rubricCheck ?? "",
                  confidence: parsed.confidence ?? "",
                });
              }

              if (parsed.stage === "error") {
                throw new Error(parsed.message ?? "Pipeline failed.");
              }
            } catch (parseError) {
              if (parseError instanceof Error) {
                throw parseError;
              }
            }
          }
        }
      }
    } catch (pipelineError) {
      setError(
        pipelineError instanceof Error
          ? pipelineError.message
          : "Pipeline failed. Please try again.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setQuestion(suggestion);
  }

  async function copyFinalAnswer() {
    if (!result?.finalAnswer || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.finalAnswer);
      setActionMessage("Final answer copied.");
    } catch {
      setActionMessage("Copy failed in this browser.");
    }
  }

  function saveToLibrary() {
    if (!result || typeof window === "undefined") {
      return;
    }

    try {
      const nextEntry: LibraryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `${topicTitle} pipeline answer`,
        courseCode,
        topic: topicTitle,
        content: result.finalAnswer,
        tags: ["pipeline", mode, topicTitle],
        type: "saved-draft",
        createdAt: new Date().toISOString(),
      };
      const nextEntries = [nextEntry, ...readLibraryEntries()];
      writeLibraryEntries(nextEntries);
      appendActivityEvent(`Saved pipeline answer: ${topicTitle}`, courseCode);
      setActionMessage("Saved to Library.");
    } catch {
      setActionMessage("Could not save to Library.");
    }
  }

  function useInDraft() {
    if (!result || typeof window === "undefined") {
      return;
    }

    try {
      const key = getDraftStorageKey(courseCode, topicTitle);
      const existingDraft = window.localStorage.getItem(key) ?? "";
      const nextDraft = existingDraft.trim()
        ? `${existingDraft}\n\n${result.finalAnswer}`
        : result.finalAnswer;
      window.localStorage.setItem(key, nextDraft);
      appendActivityEvent(`Appended pipeline answer to draft: ${topicTitle}`, courseCode);
      setActionMessage("Appended to your local draft.");
    } catch {
      setActionMessage("Could not append to draft.");
    }
  }

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/80 p-6">
      <div className="rounded-card border border-border/70 bg-panelAlt/50 p-5">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">
          Academic Intelligence Pipeline
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-text">Academic Intelligence Pipeline</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Ask one question. GPT-4o drafts, Perplexity finds real sources, Claude reviews and
          polishes, and you get one final answer.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {flowNodes.map((node, index) => {
            const complete = node.id === "you" || completedStages.includes(node.id);
            const active = node.id !== "you" && currentStage === node.id && isRunning;

            return (
              <div key={node.id} className="flex items-center gap-3">
                <div className="relative">
                  {active ? (
                    <span className="absolute inset-[-5px] rounded-full border border-accent/60 animate-ping" />
                  ) : null}
                  <span
                    className={`relative inline-flex rounded-full border px-4 py-2 text-sm ${
                      complete
                        ? "border-emerald-400/40 bg-emerald-500/10 text-text"
                        : active
                          ? "border-accent bg-accent/10 text-text"
                          : "border-border/70 bg-panel/70 text-muted"
                    }`}
                  >
                    {node.label}
                  </span>
                </div>
                {index < flowNodes.length - 1 ? (
                  <span className="text-muted" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/40 p-5">
        <label className="block text-sm font-medium text-text" htmlFor="pipeline-question">
          Your question
        </label>
        <textarea
          id="pipeline-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask anything about ${topicTitle}...
For example: Explain how IAM works for my Unit 2 assignment, or Help me understand the difference between IaaS and PaaS for my discussion post`}
          rows={6}
          className="mt-3 w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-3 text-sm leading-7 text-text outline-none transition focus:border-accent"
        />
        <div className="mt-2 text-xs text-muted">{characterCount} characters</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Explain this topic at graduate level",
            "How does this connect to my AWS experience",
            "What would I need for my discussion post",
            "Quiz me on the key concepts",
            "What real examples can I use in my assignment",
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void runPipeline()}
            disabled={!trimmedQuestion || isRunning}
            className="rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt/70 disabled:text-muted"
          >
            {isRunning ? "Pipeline Running..." : "Run Pipeline — Get Final Answer"}
          </button>

          {result ? (
            <button
              type="button"
              onClick={resetPipeline}
              className="rounded-full border border-border/70 bg-panel/70 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
            >
              Ask Another Question
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>

      {isRunning ? (
        <div className="rounded-card border border-border/70 bg-panelAlt/40 p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Pipeline progress</div>
          <div className="mt-4 space-y-3">
            {stageDescriptions.map((stage) => {
              const complete = isStageComplete(stage.id, completedStages);
              const active = currentStage === stage.id;

              return (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-panel/50 px-4 py-3"
                >
                  <span
                    className={`inline-flex h-3 w-3 rounded-full ${
                      complete
                        ? "bg-emerald-400"
                        : active
                          ? "animate-pulse bg-accent"
                          : "bg-border"
                    }`}
                  />
                  <span className={`${active || complete ? "text-text" : "text-muted"} text-sm`}>
                    {stage.label}
                  </span>
                  {complete ? <span className="ml-auto text-emerald-300">✓</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <article className="rounded-card border border-border/70 bg-panelAlt/50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-accent">
                  Your Final Answer
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-text">Your Final Answer</h3>
                <p className="mt-2 text-sm text-muted">
                  Reviewed by Claude · Sources verified · Rubric aligned
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyFinalAnswer()}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={saveToLibrary}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  Save to Library
                </button>
                <button
                  type="button"
                  onClick={useInDraft}
                  className="rounded-full border border-border/70 bg-panel/70 px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                >
                  Use in Draft
                </button>
              </div>
            </div>

            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-text">
              {result.finalAnswer}
            </div>
            {actionMessage ? <div className="mt-4 text-xs text-muted">{actionMessage}</div> : null}
          </article>

          <article className="rounded-card border border-border/70 bg-panelAlt/40 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Real Sources Found</div>
            <h3 className="mt-2 text-xl font-semibold text-text">Real Sources Found</h3>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {result.sources.length > 0 &&
              !(
                result.sources.length === 1 &&
                result.sources[0].toLowerCase() === "live search unavailable"
              ) ? (
                result.sources.map((source) => {
                  const [label, rawUrl] = source.split(" | ");
                  const href = rawUrl?.startsWith("http") ? rawUrl : undefined;

                  return href ? (
                    <a
                      key={source}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-border/60 bg-panel/50 px-4 py-3 text-text transition hover:border-accent/35 hover:text-accent"
                    >
                      {label}
                    </a>
                  ) : (
                    <div
                      key={source}
                      className="rounded-2xl border border-border/60 bg-panel/50 px-4 py-3 text-text"
                    >
                      {source}
                    </div>
                  );
                })
              ) : (
                <p>No external sources needed for this question — answer based on course knowledge.</p>
              )}
            </div>
          </article>

          {rubric ? (
            <article className="rounded-card border border-amber-400/30 bg-amber-500/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-amber-200">
                Rubric Alignment
              </div>
              <h3 className="mt-2 text-xl font-semibold text-text">Rubric Alignment</h3>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text">
                {result.rubricCheck || "Claude did not return a separate rubric section."}
              </div>
            </article>
          ) : null}

          <article className="rounded-card border border-emerald-400/30 bg-emerald-500/10 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-emerald-200">
              Prof. Scholar&apos;s Note
            </div>
            <h3 className="mt-2 text-xl font-semibold text-text">Prof. Scholar&apos;s Note</h3>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text">
              {result.confidence || "Claude did not return a separate confidence note."}
            </div>
          </article>

          <article className="rounded-card border border-border/70 bg-panelAlt/30 p-5">
            <button
              type="button"
              onClick={() => setShowDraft((current) => !current)}
              className="text-sm font-semibold text-text transition hover:text-accent"
            >
              {showDraft ? "Hide GPT-4o Initial Draft" : "Show GPT-4o Initial Draft"}
            </button>
            {showDraft ? (
              <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-border/60 bg-panel/50 p-4 text-sm leading-7 text-muted">
                {result.gptDraft}
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}
