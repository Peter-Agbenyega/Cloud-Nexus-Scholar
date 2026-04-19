"use client";

import { useEffect, useState } from "react";

import {
  getHeightClass,
  getWidthClass,
  QUIZ_COMPLETE_EVENT,
  readQuizScores,
  writeQuizScores,
} from "@/lib/app-state";

type QuizScoreTrackerProps = {
  courseCode: string;
  topicTitle: string;
};

function getAverage(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1));
}

export function QuizScoreTracker({ courseCode, topicTitle }: QuizScoreTrackerProps) {
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setScores(readQuizScores(courseCode, topicTitle));
    } catch {}

    const handleQuizComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ score: number }>).detail;

      if (typeof detail?.score !== "number") {
        return;
      }

      setScores((currentScores) => {
        const nextScores = [...currentScores, detail.score];
        writeQuizScores(courseCode, topicTitle, nextScores);
        return nextScores;
      });
    };

    window.addEventListener(QUIZ_COMPLETE_EVENT, handleQuizComplete as EventListener);

    return () => {
      window.removeEventListener(QUIZ_COMPLETE_EVENT, handleQuizComplete as EventListener);
    };
  }, [courseCode, topicTitle]);

  const averageScore = getAverage(scores);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const recentScores = scores.slice(-5);

  return (
    <section className="rounded-card border border-border/70 bg-panelAlt/70 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-accent">Quiz performance</div>
      <h3 className="mt-3 text-xl font-semibold text-text">Quiz Score Tracker</h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Quizzes taken</div>
          <div className="mt-2 text-3xl font-semibold text-text">{scores.length}</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Average</div>
          <div className="mt-2 text-3xl font-semibold text-text">
            {scores.length > 0 ? `${averageScore} / 10 avg` : "N/A"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-panel/70 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Best</div>
          <div className="mt-2 text-3xl font-semibold text-text">
            {scores.length > 0 ? `${bestScore} / 10` : "N/A"}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-panel/70 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Last 5 quiz scores</div>
        <div className="mt-4 flex h-24 items-end gap-3">
          {recentScores.length > 0 ? (
            recentScores.map((score, index) => (
              <div key={`${score}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end justify-center rounded-2xl bg-panelAlt p-1">
                  <div
                    className={`w-8 rounded-t-xl bg-gradient-to-t from-accent to-accent-soft ${getHeightClass(
                      score * 10,
                    )}`}
                  />
                </div>
                <div className="text-xs text-muted">{score}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">No quiz scores recorded for this topic yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
