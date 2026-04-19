"use client";

import { useEffect, useState } from "react";

import {
  getProfessorStorageKeys,
  getWidthClass,
  PROFESSOR_SESSION_EVENT,
  readNumberFromStorage,
  readStringFromStorage,
  writeNumberToStorage,
  writeStringToStorage,
} from "@/lib/app-state";

type ProfessorModeTrackerProps = {
  courseCode: string;
  topicTitle: string;
};

type ProfessorState = {
  sessions: number;
  confidence: number;
  lastPracticed: string;
};

function formatDate(value: string) {
  if (!value) {
    return "No session recorded yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorModeTracker({
  courseCode,
  topicTitle,
}: ProfessorModeTrackerProps) {
  const [state, setState] = useState<ProfessorState>({
    sessions: 0,
    confidence: 0,
    lastPracticed: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const keys = getProfessorStorageKeys(courseCode, topicTitle);

    try {
      setState({
        sessions: readNumberFromStorage(keys.sessions, 0),
        confidence: readNumberFromStorage(keys.confidence, 0),
        lastPracticed: readStringFromStorage(keys.last, ""),
      });
    } catch {}

    const handleComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ confidence: number }>).detail;
      const nextConfidence = detail?.confidence ?? 0;
      const nextTimestamp = new Date().toISOString();

      setState((currentState) => {
        const nextState = {
          sessions: currentState.sessions + 1,
          confidence: nextConfidence,
          lastPracticed: nextTimestamp,
        };

        writeNumberToStorage(keys.sessions, nextState.sessions);
        writeNumberToStorage(keys.confidence, nextState.confidence);
        writeStringToStorage(keys.last, nextState.lastPracticed);

        return nextState;
      });
    };

    window.addEventListener(PROFESSOR_SESSION_EVENT, handleComplete as EventListener);

    return () => {
      window.removeEventListener(PROFESSOR_SESSION_EVENT, handleComplete as EventListener);
    };
  }, [courseCode, topicTitle]);

  const confidencePercent = state.confidence * 10;

  return (
    <section className="rounded-card border border-border/70 bg-panelAlt/70 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-accent">Professor mode</div>
      <h3 className="mt-3 text-xl font-semibold text-text">Professor Mode Sessions</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Sessions</div>
          <div className="mt-2 text-3xl font-semibold text-text">{state.sessions}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Confidence</div>
          <div className="mt-2 text-3xl font-semibold text-text">
            {state.confidence > 0 ? `${state.confidence}/10` : "N/A"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Last practiced</div>
          <div className="mt-2 text-sm leading-6 text-muted">
            {formatDate(state.lastPracticed)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
          <span>Confidence bar</span>
          <span>{confidencePercent}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-panel ring-1 ring-inset ring-white/5">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-accent/60 via-accent to-accent-soft ${getWidthClass(
              confidencePercent,
            )}`}
          />
        </div>
      </div>
    </section>
  );
}
