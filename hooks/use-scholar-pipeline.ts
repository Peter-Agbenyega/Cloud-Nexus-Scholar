"use client";

import { useEffect, useMemo, useState } from "react";

import { LibraryEntry, readLibraryEntries, writeLibraryEntries } from "@/lib/app-state";
import {
  isScholarCourseCode,
  ScholarCourseCode,
  ScholarPipelineMode,
  ScholarPipelineResult,
} from "@/lib/scholar-pipeline";

export type { ScholarCourseCode, ScholarPipelineMode, ScholarPipelineResult };

type UseScholarPipelineOptions = {
  initialCourse?: ScholarCourseCode;
  courseStorageKey?: string;
  fixedCourse?: ScholarCourseCode;
  topicTitle?: string;
};

type PipelineEvent =
  | { type: "stage"; stage: string }
  | { type: "result"; result: ScholarPipelineResult }
  | { type: "error"; error: string };

const defaultTopicTitle = "Unit 1";
const defaultCourse: ScholarCourseCode = "CLCS 605";

function safeReadStorage(key: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWriteStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function useScholarPipeline(options?: UseScholarPipelineOptions) {
  const topicTitle = options?.topicTitle ?? defaultTopicTitle;
  const fixedCourse = options?.fixedCourse;
  const [question, setQuestion] = useState("");
  const [selectedCourse, setSelectedCourseState] = useState<ScholarCourseCode>(
    fixedCourse ?? options?.initialCourse ?? defaultCourse,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState("GPT-4o");
  const [result, setResult] = useState<ScholarPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const [copyLabel, setCopyLabel] = useState("📋 Copy Answer");
  const [saveLabel, setSaveLabel] = useState("💾 Save to Library");

  useEffect(() => {
    if (fixedCourse || !options?.courseStorageKey) {
      return;
    }

    const stored = safeReadStorage(options.courseStorageKey, selectedCourse);
    if (isScholarCourseCode(stored)) {
      setSelectedCourseState(stored);
    }
  }, [fixedCourse, options?.courseStorageKey, selectedCourse]);

  function setSelectedCourse(course: ScholarCourseCode) {
    if (fixedCourse) {
      return;
    }

    setSelectedCourseState(course);

    if (options?.courseStorageKey) {
      safeWriteStorage(options.courseStorageKey, course);
    }
  }

  const wordCount = useMemo(() => {
    const trimmed = question.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [question]);

  const activeCourse = fixedCourse ?? selectedCourse;

  async function consumePipelineStream(response: Response) {
    if (!response.body) {
      throw new Error("Pipeline response did not include a stream.");
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
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) {
          continue;
        }

        const payload = line.slice(6).trim();

        if (!payload || payload === "[DONE]") {
          continue;
        }

        const parsed = JSON.parse(payload) as PipelineEvent;

        if (parsed.type === "stage") {
          setCurrentStage(parsed.stage);
          continue;
        }

        if (parsed.type === "result") {
          setCurrentStage("Done");
          setResult(parsed.result);
          setShowSources(false);
          setShowRubric(false);
          continue;
        }

        if (parsed.type === "error") {
          throw new Error(parsed.error);
        }
      }
    }
  }

  async function runPipeline(mode: ScholarPipelineMode) {
    const trimmed = question.trim();

    if (!trimmed || isRunning) {
      return;
    }

    setIsRunning(true);
    setCurrentStage("GPT-4o");
    setResult(null);
    setError(null);
    setCopyLabel("📋 Copy Answer");
    setSaveLabel("💾 Save to Library");

    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          courseCode: activeCourse,
          topicTitle,
          mode,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Pipeline request failed.");
      }

      await consumePipelineStream(response);
    } catch (pipelineError) {
      setError(
        pipelineError instanceof Error
          ? pipelineError.message
          : "The pipeline failed. Try again.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function runIntegrityScan() {
    const trimmed = question.trim();

    if (!trimmed || isRunning) {
      return;
    }

    setIsRunning(true);
    setCurrentStage("GPT-4o");
    setResult(null);
    setError(null);
    setCopyLabel("📋 Copy Answer");
    setSaveLabel("💾 Save to Library");

    try {
      const response = await fetch("/api/scan-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: trimmed }),
      });

      const payload = (await response.json()) as {
        overallScore?: number;
        verdict?: string;
        summary?: string;
        advice?: string;
        citationGaps?: Array<{ sentence?: string; suggestedCitation?: string }>;
        preSubmissionChecklist?: Array<{ item?: string; passed?: boolean; note?: string }>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Integrity scan failed.");
      }

      const checklist = (payload.preSubmissionChecklist ?? [])
        .map((item) => `${item.passed ? "PASS" : "FIX"} — ${item.item}: ${item.note}`)
        .join("\n");
      const citations = (payload.citationGaps ?? [])
        .map((gap) => `${gap.sentence} ${gap.suggestedCitation ?? ""}`.trim())
        .filter(Boolean);

      setCurrentStage("Done");
      setResult({
        finalAnswer: [
          `Submission Integrity Review`,
          ``,
          `Verdict: ${payload.verdict ?? "Needs Work"}`,
          `Risk Score: ${payload.overallScore ?? 0}/100`,
          ``,
          payload.summary ?? "No summary returned.",
          ``,
          payload.advice ?? "No advice returned.",
        ].join("\n"),
        sources: citations,
        rubricCheck: checklist || "No rubric or checklist feedback returned.",
        confidence: Math.max(0, 100 - (payload.overallScore ?? 100)),
        gptDraft: trimmed,
      });
    } catch (scanError) {
      setError(
        scanError instanceof Error ? scanError.message : "Integrity scan failed.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function copyAnswer() {
    if (!result?.finalAnswer || typeof window === "undefined") {
      return;
    }

    try {
      await window.navigator.clipboard.writeText(result.finalAnswer);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy failed");
    }
  }

  function saveToLibrary() {
    if (!result) {
      return;
    }

    try {
      const entry: LibraryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: question.slice(0, 80) || "Prof. Scholar result",
        courseCode: activeCourse,
        topic: topicTitle,
        content: `${result.finalAnswer}\n\nSources:\n${result.sources.join("\n")}`,
        tags: ["pipeline", activeCourse, topicTitle],
        type: "saved-draft",
        createdAt: new Date().toISOString(),
      };
      writeLibraryEntries([entry, ...readLibraryEntries()]);
      setSaveLabel("Saved");
    } catch {
      setSaveLabel("Save failed");
    }
  }

  function reset() {
    setQuestion("");
    setResult(null);
    setError(null);
    setShowSources(false);
    setShowRubric(false);
    setCurrentStage("GPT-4o");
    setCopyLabel("📋 Copy Answer");
    setSaveLabel("💾 Save to Library");
  }

  return {
    question,
    setQuestion,
    selectedCourse: activeCourse,
    setSelectedCourse,
    isRunning,
    currentStage,
    result,
    error,
    showSources,
    setShowSources,
    showRubric,
    setShowRubric,
    wordCount,
    runPipeline,
    runIntegrityScan,
    copyAnswer,
    saveToLibrary,
    reset,
    copyLabel,
    saveLabel,
  };
}
