"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";

import { flashCardsData, StudyQuestion, studyQuestions } from "@/lib/study-data";

type StudyMode = "study" | "quiz" | "weak";
type SelectedUnit = number | "all";
type StoredCourse = "all" | "CLCS-605" | "CLCS-615" | "CLCS-625" | "CLCS-635" | "CLCS-645";

interface StudyState {
  masteredIds: string[];
  weakIds: string[];
  currentCard: number;
  flipped: boolean;
  quizAnswers: Record<string, string>;
  quizComplete: boolean;
  sessionMode: StudyMode;
  selectedCourse: string;
  selectedUnit: SelectedUnit;
}

type StoredStudyState = StudyState & {
  quizHistory?: {
    date: string;
    course: string;
    score: number;
    total: number;
  }[];
  currentQuizIds?: string[];
};

const storageKey = "cns_study_v2";

const courseOptions: Array<{
  value: StoredCourse;
  label: string;
  comingSoon?: boolean;
}> = [
  { value: "all", label: "All" },
  { value: "CLCS-605", label: "CLCS 605" },
  { value: "CLCS-615", label: "CLCS 615" },
  { value: "CLCS-625", label: "CLCS 625", comingSoon: true },
  { value: "CLCS-635", label: "CLCS 635", comingSoon: true },
  { value: "CLCS-645", label: "CLCS 645", comingSoon: true },
];

const unitOptions = Array.from({ length: 8 }, (_, index) => index + 1);

const defaultState: StoredStudyState = {
  masteredIds: [],
  weakIds: [],
  currentCard: 0,
  flipped: false,
  quizAnswers: {},
  quizComplete: false,
  sessionMode: "study",
  selectedCourse: "all",
  selectedUnit: "all",
  quizHistory: [],
  currentQuizIds: [],
};

function readStudyState(): StoredStudyState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return defaultState;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredStudyState>;

    return {
      ...defaultState,
      ...parsed,
      masteredIds: Array.isArray(parsed.masteredIds) ? parsed.masteredIds : [],
      weakIds: Array.isArray(parsed.weakIds) ? parsed.weakIds : [],
      quizAnswers:
        parsed.quizAnswers && typeof parsed.quizAnswers === "object" ? parsed.quizAnswers : {},
      quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
      currentQuizIds: Array.isArray(parsed.currentQuizIds) ? parsed.currentQuizIds : [],
    };
  } catch {
    return defaultState;
  }
}

function writeStudyState(state: StoredStudyState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

function shuffleQuestions(questions: StudyQuestion[]) {
  const copy = [...questions];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function getCourseLabel(course: string) {
  const option = courseOptions.find((entry) => entry.value === course);
  return option?.label ?? course;
}

function getQuestionOptionLetter(option: string) {
  return option.slice(0, 1);
}

function getScoreTone(score: number, total: number) {
  if (score === total && total > 0) {
    return "text-amber-200";
  }

  if (score >= total - 2) {
    return "text-emerald-300";
  }

  if (score >= Math.ceil(total * 0.6)) {
    return "text-amber-300";
  }

  return "text-rose-300";
}

function getScoreMessage(score: number, total: number) {
  if (score === total && total > 0) {
    return "Perfect run. Peter has this material locked in.";
  }

  if (score >= total - 2) {
    return "Strong result. Review the misses once and move on.";
  }

  if (score >= Math.ceil(total * 0.6)) {
    return "Solid base. Focus on the explanations and weak areas next.";
  }

  return "This is exactly what the study layer is for. Review the misses, then rerun the quiz.";
}

export default function StudyPage() {
  const [studyState, setStudyState] = useState<StoredStudyState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [expandedWrongOptions, setExpandedWrongOptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setStudyState(readStudyState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeStudyState(studyState);
  }, [isHydrated, studyState]);

  const selectedCourse = studyState.selectedCourse as StoredCourse;
  const selectedUnit = studyState.selectedUnit;
  const currentCourse = courseOptions.find((entry) => entry.value === selectedCourse);

  const filteredQuestions = useMemo(() => {
    return studyQuestions.filter((question) => {
      const courseMatch = selectedCourse === "all" || question.course === selectedCourse;
      const unitMatch = selectedUnit === "all" || question.unit === selectedUnit;
      return courseMatch && unitMatch;
    });
  }, [selectedCourse, selectedUnit]);

  const weakQuestions = useMemo(
    () => filteredQuestions.filter((question) => studyState.weakIds.includes(question.id)),
    [filteredQuestions, studyState.weakIds],
  );

  const activeStudyDeck = studyState.sessionMode === "weak" ? weakQuestions : filteredQuestions;

  const quizPool = filteredQuestions;
  const quizQuestionIds = useMemo(() => {
    const activeIds = studyState.currentQuizIds ?? [];
    const activeQuestions = activeIds
      .map((id) => quizPool.find((question) => question.id === id))
      .filter((question): question is StudyQuestion => Boolean(question));

    if (activeQuestions.length > 0 && activeQuestions.length === activeIds.length) {
      return activeIds;
    }

    return shuffleQuestions(quizPool)
      .slice(0, Math.min(10, quizPool.length))
      .map((question) => question.id);
  }, [quizPool, studyState.currentQuizIds]);

  const quizQuestions = useMemo(
    () =>
      quizQuestionIds
        .map((id) => quizPool.find((question) => question.id === id))
        .filter((question): question is StudyQuestion => Boolean(question)),
    [quizPool, quizQuestionIds],
  );

  const currentCardIndex = Math.min(studyState.currentCard, Math.max(activeStudyDeck.length - 1, 0));
  const currentStudyQuestion = activeStudyDeck[currentCardIndex] ?? null;
  const currentQuizIndex = Math.min(studyState.currentCard, Math.max(quizQuestions.length - 1, 0));
  const currentQuizQuestion = quizQuestions[currentQuizIndex] ?? null;
  const quizScore = quizQuestions.reduce((total, question) => {
    return total + (studyState.quizAnswers[question.id] === question.correct ? 1 : 0);
  }, 0);
  const masteredInView = activeStudyDeck.filter((question) =>
    studyState.masteredIds.includes(question.id),
  ).length;
  const isEmptyCourse = currentCourse?.comingSoon && filteredQuestions.length === 0;

  useEffect(() => {
    if (studyState.currentCard <= activeStudyDeck.length - 1) {
      return;
    }

    setStudyState((current) => ({
      ...current,
      currentCard: Math.max(activeStudyDeck.length - 1, 0),
    }));
  }, [activeStudyDeck.length, studyState.currentCard]);

  useEffect(() => {
    if (studyState.sessionMode !== "quiz") {
      return;
    }

    if (studyState.currentCard <= quizQuestions.length - 1) {
      return;
    }

    setStudyState((current) => ({
      ...current,
      currentCard: Math.max(quizQuestions.length - 1, 0),
    }));
  }, [quizQuestions.length, studyState.currentCard, studyState.sessionMode]);

  function updateState(updater: (current: StoredStudyState) => StoredStudyState) {
    setStudyState((current) => updater(current));
  }

  function setMode(mode: StudyMode) {
    updateState((current) => ({
      ...current,
      sessionMode: mode,
      currentCard: 0,
      flipped: false,
      ...(mode === "quiz"
        ? {
            quizAnswers: {},
            quizComplete: false,
            currentQuizIds: shuffleQuestions(filteredQuestions)
              .slice(0, Math.min(10, filteredQuestions.length))
              .map((question) => question.id),
          }
        : {}),
    }));
    setExpandedWrongOptions({});
  }

  function setCourse(course: StoredCourse) {
    updateState((current) => ({
      ...current,
      selectedCourse: course,
      selectedUnit: "all",
      currentCard: 0,
      flipped: false,
      quizAnswers: {},
      quizComplete: false,
      currentQuizIds: [],
    }));
    setExpandedWrongOptions({});
  }

  function setUnit(unit: SelectedUnit) {
    updateState((current) => ({
      ...current,
      selectedUnit: unit,
      currentCard: 0,
      flipped: false,
      quizAnswers: {},
      quizComplete: false,
      currentQuizIds: [],
    }));
    setExpandedWrongOptions({});
  }

  function moveCard(direction: "next" | "previous") {
    if (activeStudyDeck.length === 0) {
      return;
    }

    updateState((current) => ({
      ...current,
      currentCard:
        direction === "next"
          ? (current.currentCard + 1) % activeStudyDeck.length
          : (current.currentCard - 1 + activeStudyDeck.length) % activeStudyDeck.length,
      flipped: false,
    }));
    setExpandedWrongOptions({});
  }

  function markMastered(questionId: string, removeFromWeak = false) {
    updateState((current) => ({
      ...current,
      masteredIds: current.masteredIds.includes(questionId)
        ? current.masteredIds
        : [...current.masteredIds, questionId],
      weakIds: removeFromWeak ? current.weakIds.filter((id) => id !== questionId) : current.weakIds,
    }));
  }

  function markWeak(questionId: string) {
    updateState((current) => ({
      ...current,
      weakIds: current.weakIds.includes(questionId) ? current.weakIds : [...current.weakIds, questionId],
      masteredIds: current.masteredIds.filter((id) => id !== questionId),
    }));
  }

  function answerQuestion(question: StudyQuestion, optionLetter: string) {
    if (studyState.quizAnswers[question.id]) {
      return;
    }

    const isWeak = optionLetter !== question.correct;

    updateState((current) => ({
      ...current,
      quizAnswers: {
        ...current.quizAnswers,
        [question.id]: optionLetter,
      },
      weakIds: isWeak && !current.weakIds.includes(question.id) ? [...current.weakIds, question.id] : current.weakIds,
    }));
  }

  function restartQuiz() {
    updateState((current) => ({
      ...current,
      currentCard: 0,
      quizAnswers: {},
      quizComplete: false,
      currentQuizIds: shuffleQuestions(filteredQuestions)
        .slice(0, Math.min(10, filteredQuestions.length))
        .map((question) => question.id),
    }));
  }

  function studyWrongAnswers() {
    updateState((current) => ({
      ...current,
      sessionMode: "weak",
      currentCard: 0,
      flipped: false,
    }));
  }

  function toggleWrongExplanation(optionLetter: string) {
    setExpandedWrongOptions((current) => ({
      ...current,
      [optionLetter]: !current[optionLetter],
    }));
  }

  const cardStyle: CSSProperties = {
    transformStyle: "preserve-3d",
    transform: studyState.flipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Study Layer</div>
            <h1 className="mt-2 text-3xl font-semibold text-text">Study Intelligence</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Practice from your real UMGC quiz history.
            </p>
          </div>
          <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-text">
            {studyQuestions.length} questions in bank
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Courses</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {courseOptions.map((course) => {
                const isActive = selectedCourse === course.value;

                return (
                  <button
                    key={course.value}
                    type="button"
                    onClick={() => setCourse(course.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-accent bg-accent/10 text-text"
                        : "border-border/70 bg-panel text-muted hover:border-accent/35 hover:text-text"
                    }`}
                  >
                    <span>{course.label}</span>
                    {course.comingSoon ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                        Coming Soon
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Units</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUnit("all")}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedUnit === "all"
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border/70 bg-panel text-muted hover:border-accent/35 hover:text-text"
                }`}
              >
                All Units
              </button>
              {unitOptions.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setUnit(unit)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selectedUnit === unit
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border/70 bg-panel text-muted hover:border-accent/35 hover:text-text"
                  }`}
                >
                  Unit {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {currentCourse?.comingSoon ? (
          <div className="mt-4 rounded-3xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Fall 2026 course — add course details when semester starts.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { id: "study", label: "📚 Study Mode" },
            { id: "quiz", label: "⚡ Quiz Mode" },
            { id: "weak", label: "🔥 Weak Areas" },
          ].map((mode) => {
            const isActive = studyState.sessionMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setMode(mode.id as StudyMode)}
                className={`rounded-3xl border px-5 py-4 text-left text-lg font-semibold transition ${
                  isActive
                    ? "border-accent bg-accent/10 text-text shadow-card"
                    : "border-border/70 bg-panelAlt/55 text-muted hover:border-accent/35 hover:text-text"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </section>

      {studyState.sessionMode !== "quiz" ? (
        <section className="space-y-6">
          {activeStudyDeck.length === 0 ? (
            <div className="rounded-card border border-border/70 bg-panel/85 p-8 text-center shadow-card">
              <h2 className="text-2xl font-semibold text-text">
                {studyState.sessionMode === "weak"
                  ? "No weak areas yet!"
                  : isEmptyCourse
                    ? "This course is queued for Fall 2026."
                    : "No study cards match this filter."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                {studyState.sessionMode === "weak"
                  ? "Start in Study Mode and mark questions that need more practice."
                  : isEmptyCourse
                    ? "Select CLCS 605 or CLCS 615 to practice from Summer 2026, or keep this selected until new course data is added."
                    : "Adjust the course or unit filter to load a larger study deck."}
              </p>
              <button
                type="button"
                onClick={() => setMode("study")}
                className="mt-6 inline-flex rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Go to Study Mode →
              </button>
            </div>
          ) : currentStudyQuestion ? (
            <div className="space-y-6">
              <div className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
                <div className="relative min-h-[420px] perspective-[1600px]">
                  <button
                    type="button"
                    onClick={() =>
                      updateState((current) => ({
                        ...current,
                        flipped: !current.flipped,
                      }))
                    }
                    className="relative block h-full min-h-[420px] w-full rounded-[28px] text-left transition-transform duration-500"
                    style={cardStyle}
                  >
                    <div
                      className="absolute inset-0 flex h-full flex-col rounded-[28px] border border-border/70 bg-panelAlt/55 p-6 [backface-visibility:hidden]"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {currentStudyQuestion.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-border/70 bg-panel px-3 py-1 text-xs text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-text">
                          {currentStudyQuestion.course.replace("-", " ")} · Unit {currentStudyQuestion.unit}
                        </span>
                      </div>
                      <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
                        <div className="text-xs uppercase tracking-[0.2em] text-accent">
                          {currentStudyQuestion.topic}
                        </div>
                        <p className="mt-5 max-w-4xl text-3xl font-semibold leading-tight text-text">
                          {currentStudyQuestion.question}
                        </p>
                      </div>
                      <div className="text-sm text-muted">Tap or click to flip</div>
                    </div>

                    <div
                      className="absolute inset-0 flex h-full flex-col rounded-[28px] border border-border/70 bg-panelAlt/55 p-6 [backface-visibility:hidden]"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-accent">Answer Breakdown</div>
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-text">
                          {currentStudyQuestion.course.replace("-", " ")} · Unit {currentStudyQuestion.unit}
                        </span>
                      </div>

                      <div className="mt-5 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Correct Answer</div>
                        <div className="mt-2 text-lg font-semibold text-emerald-100">
                          {currentStudyQuestion.correct}.{" "}
                          {currentStudyQuestion.options.find(
                            (option) => getQuestionOptionLetter(option) === currentStudyQuestion.correct,
                          )?.slice(3)}
                        </div>
                      </div>

                      <div className="mt-5 text-sm leading-7 text-text">{currentStudyQuestion.explanation}</div>

                      <div className="mt-5 space-y-3">
                        {Object.entries(currentStudyQuestion.wrongExplanations).map(([optionLetter, explanation]) => (
                          <div key={optionLetter} className="rounded-3xl border border-border/70 bg-panel/70">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleWrongExplanation(optionLetter);
                              }}
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text"
                            >
                              <span>Wrong option {optionLetter}</span>
                              <span className="text-muted">
                                {expandedWrongOptions[optionLetter] ? "Hide" : "Show"}
                              </span>
                            </button>
                            {expandedWrongOptions[optionLetter] ? (
                              <div className="border-t border-border/70 px-4 py-3 text-sm leading-7 text-muted">
                                {explanation}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => moveCard("previous")}
                    className="rounded-full border border-border/70 bg-panelAlt/55 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
                  >
                    ← Previous
                  </button>
                  <div className="text-sm text-muted">
                    Card {currentCardIndex + 1} of {activeStudyDeck.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => moveCard("next")}
                    className="rounded-full border border-border/70 bg-panelAlt/55 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
                <div className="flex flex-wrap gap-3">
                  {studyState.sessionMode === "weak" ? (
                    <button
                      type="button"
                      onClick={() => markMastered(currentStudyQuestion.id, true)}
                      className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45"
                    >
                      ✅ Mastered — Remove from weak areas
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => markMastered(currentStudyQuestion.id)}
                        className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45"
                      >
                        ✅ Got it — I know this
                      </button>
                      <button
                        type="button"
                        onClick={() => markWeak(currentStudyQuestion.id)}
                        className="rounded-full border border-rose-400/35 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300/45"
                      >
                        ❌ Need more practice
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-text">
                      {masteredInView} of {activeStudyDeck.length} cards mastered this session
                    </span>
                    <span className="text-muted">{Math.round((masteredInView / activeStudyDeck.length) * 100)}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-panelAlt/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-accent to-accent"
                      style={{ width: `${(masteredInView / activeStudyDeck.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {studyState.sessionMode === "quiz" ? (
        <section className="space-y-6">
          {quizQuestions.length === 0 ? (
            <div className="rounded-card border border-border/70 bg-panel/85 p-8 text-center shadow-card">
              <h2 className="text-2xl font-semibold text-text">No quiz questions available.</h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Select CLCS 605 or CLCS 615, or widen the unit filter to build a quiz set.
              </p>
            </div>
          ) : studyState.quizComplete ? (
            <div className="rounded-card border border-border/70 bg-panel/85 p-8 text-center shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">Quiz Complete</div>
              <div className={`mt-4 text-6xl font-semibold ${getScoreTone(quizScore, quizQuestions.length)}`}>
                {quizScore}/{quizQuestions.length}
              </div>
              <p className="mt-4 text-lg text-text">{getScoreMessage(quizScore, quizQuestions.length)}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={restartQuiz}
                  className="rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                >
                  🔁 Try Again
                </button>
                <button
                  type="button"
                  onClick={studyWrongAnswers}
                  className="rounded-full border border-border/70 bg-panelAlt/55 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35"
                >
                  📚 Study Wrong Answers
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-border/70 bg-panelAlt/55 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35"
                >
                  🏠 Dashboard
                </Link>
              </div>
            </div>
          ) : currentQuizQuestion ? (
            <div className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-accent">
                    Question {currentQuizIndex + 1} of {quizQuestions.length}
                  </div>
                <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                  {currentQuizQuestion.course.replace("-", " ")} · Unit {currentQuizQuestion.unit}
                </div>
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight text-text">
                {currentQuizQuestion.question}
              </h2>

              <div className="mt-6 grid gap-3">
                {currentQuizQuestion.options.map((option) => {
                  const optionLetter = getQuestionOptionLetter(option);
                  const selectedAnswer = studyState.quizAnswers[currentQuizQuestion.id];
                  const isAnswered = Boolean(selectedAnswer);
                  const isSelected = selectedAnswer === optionLetter;
                  const isCorrect = currentQuizQuestion.correct === optionLetter;

                  let className =
                    "border-border/70 bg-panelAlt/55 text-text hover:border-accent/35";

                  if (!isAnswered && isSelected) {
                    className = "border-sky-400/40 bg-sky-500/10 text-sky-100";
                  }

                  if (isAnswered && isCorrect) {
                    className = "border-emerald-400/35 bg-emerald-500/10 text-emerald-100";
                  }

                  if (isAnswered && isSelected && !isCorrect) {
                    className = "border-rose-400/35 bg-rose-500/10 text-rose-100";
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answerQuestion(currentQuizQuestion, optionLetter)}
                      disabled={isAnswered}
                      className={`rounded-3xl border p-5 text-left text-base transition ${className}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {studyState.quizAnswers[currentQuizQuestion.id] ? (
                <div className="mt-6 rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">Explanation</div>
                  <p className="mt-3 text-sm leading-7 text-text">{currentQuizQuestion.explanation}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStateAnswers = studyState.quizAnswers;
                      const finalScore = quizQuestions.reduce((total, quizQuestion) => {
                        const answer = nextStateAnswers[quizQuestion.id];
                        return total + (answer === quizQuestion.correct ? 1 : 0);
                      }, 0);

                      if (currentQuizIndex + 1 >= quizQuestions.length) {
                        updateState((current) => ({
                          ...current,
                          quizComplete: true,
                          quizHistory: [
                            {
                              date: new Date().toISOString(),
                              course:
                                current.selectedCourse === "all"
                                  ? "All Courses"
                                  : getCourseLabel(current.selectedCourse),
                              score: finalScore,
                              total: quizQuestions.length,
                            },
                            ...(current.quizHistory ?? []),
                          ].slice(0, 12),
                        }));
                        return;
                      }

                      updateState((current) => ({
                        ...current,
                        currentCard: current.currentCard + 1,
                      }));
                    }}
                    className="mt-5 rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                  >
                    Next Question →
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Question Bank</div>
          <div className="mt-3 text-3xl font-semibold text-text">{studyQuestions.length}</div>
          <p className="mt-2 text-sm leading-7 text-muted">
            Real quiz questions across completed Summer 2026 coursework.
          </p>
        </article>

        <article className="rounded-card border border-border/70 bg-panel/85 p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Flash Card Bank</div>
          <div className="mt-3 text-3xl font-semibold text-text">{flashCardsData.length}</div>
          <p className="mt-2 text-sm leading-7 text-muted">
            Core concept cards ready for Fall 2026 review and spaced repetition.
          </p>
        </article>
      </section>
    </div>
  );
}
