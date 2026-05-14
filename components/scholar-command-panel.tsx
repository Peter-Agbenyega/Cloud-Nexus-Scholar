"use client";

import { useScholarPipeline } from "@/hooks/use-scholar-pipeline";
import { ScholarCourseCode } from "@/lib/scholar-pipeline";

type ScholarCommandPanelProps = {
  title?: string;
  placeholder: string;
  topicTitle?: string;
  initialCourse?: ScholarCourseCode;
  fixedCourse?: ScholarCourseCode;
  courseStorageKey?: string;
  compact?: boolean;
  showCourseSelector?: boolean;
};

const stages = ["GPT-4o", "Sources", "Claude", "Done"];
const courseOptions: Array<{
  code: ScholarCourseCode;
  label: string;
  badge?: string;
}> = [
  { code: "CLCS 605", label: "CLCS 605 ✓" },
  { code: "CLCS 615", label: "CLCS 615 ✓" },
  { code: "CLCS 625", label: "CLCS 625", badge: "Fall" },
  { code: "CLCS 635", label: "CLCS 635", badge: "Fall" },
  { code: "CLCS 645", label: "CLCS 645", badge: "Fall" },
];

export function ScholarCommandPanel({
  title = "Ask Prof. Scholar Anything",
  placeholder,
  topicTitle = "Unit 1",
  initialCourse,
  fixedCourse,
  courseStorageKey,
  compact = false,
  showCourseSelector = true,
}: ScholarCommandPanelProps) {
  const pipeline = useScholarPipeline({
    initialCourse,
    fixedCourse,
    courseStorageKey,
    topicTitle,
  });
  const activeStageIndex = Math.max(0, stages.indexOf(pipeline.currentStage));
  const isFallCourse =
    pipeline.selectedCourse === "CLCS 625" ||
    pipeline.selectedCourse === "CLCS 635" ||
    pipeline.selectedCourse === "CLCS 645";

  return (
    <section className="space-y-5 rounded-card border border-border/70 bg-panel/85 p-5 shadow-card sm:p-6">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Prof. Scholar</div>
        <h2 className="mt-2 text-2xl font-semibold text-text">{title}</h2>
      </div>

      <textarea
        value={pipeline.question}
        onChange={(event) => pipeline.setQuestion(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-3xl border border-border/70 bg-panelAlt/60 px-5 py-4 text-base text-text outline-none transition focus:border-accent ${
          compact ? "min-h-32" : "min-h-64"
        }`}
      />

      <div className="text-sm text-muted">{pipeline.wordCount} words</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void pipeline.runPipeline("full")}
          disabled={pipeline.isRunning}
          className="rounded-3xl border border-accent bg-accent px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          🔍 Get Full Answer
        </button>
        <button
          type="button"
          onClick={() => void pipeline.runPipeline("discussion")}
          disabled={pipeline.isRunning}
          className="rounded-3xl border border-border/70 bg-panelAlt/70 px-5 py-4 text-base font-semibold text-text transition hover:border-accent/35 disabled:cursor-not-allowed disabled:opacity-60"
        >
          📝 Help Me Write This
        </button>
        <button
          type="button"
          onClick={() => void pipeline.runPipeline("quiz")}
          disabled={pipeline.isRunning}
          className="rounded-3xl border border-border/70 bg-panelAlt/70 px-5 py-4 text-base font-semibold text-text transition hover:border-accent/35 disabled:cursor-not-allowed disabled:opacity-60"
        >
          🎓 Quiz Me On This
        </button>
        <button
          type="button"
          onClick={() => void pipeline.runIntegrityScan()}
          disabled={pipeline.isRunning}
          className="rounded-3xl border border-border/70 bg-panelAlt/70 px-5 py-4 text-base font-semibold text-text transition hover:border-accent/35 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ✅ Check Before I Submit
        </button>
      </div>

      {showCourseSelector && !fixedCourse ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {courseOptions.map((course) => {
              const isActive = pipeline.selectedCourse === course.code;

              return (
                <button
                  key={course.code}
                  type="button"
                  onClick={() => pipeline.setSelectedCourse(course.code)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border/70 bg-panelAlt/55 text-muted hover:border-accent/35 hover:text-text"
                  }`}
                >
                  <span>{course.label}</span>
                  {course.badge ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                      {course.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {isFallCourse ? (
            <div className="rounded-3xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Fall 2026 course — add course details when semester starts.
            </div>
          ) : null}
        </div>
      ) : null}

      {pipeline.isRunning ? (
        <div className="space-y-3 rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
          <div className="h-3 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/70 via-accent to-emerald-300 transition-all duration-500"
              style={{ width: `${((activeStageIndex + 1) / stages.length) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs uppercase tracking-[0.18em] text-muted">
            {stages.map((stage, index) => (
              <div
                key={stage}
                className={`rounded-full px-2 py-2 ${
                  pipeline.currentStage === stage
                    ? "bg-accent/10 text-accent"
                    : index < activeStageIndex
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-panel text-muted"
                }`}
              >
                {stage}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pipeline.error ? (
        <div className="rounded-3xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pipeline.error}
        </div>
      ) : null}

      {pipeline.result ? (
        <div className="space-y-4">
          <article className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">
              Final Answer · Confidence {pipeline.result.confidence}%
            </div>
            <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-text">
              {pipeline.result.finalAnswer}
            </div>
          </article>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void pipeline.copyAnswer()}
              className="rounded-full border border-border/70 bg-panelAlt/70 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
            >
              {pipeline.copyLabel}
            </button>
            <button
              type="button"
              onClick={() => pipeline.saveToLibrary()}
              className="rounded-full border border-border/70 bg-panelAlt/70 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
            >
              {pipeline.saveLabel}
            </button>
            <button
              type="button"
              onClick={() => pipeline.reset()}
              className="rounded-full border border-border/70 bg-panelAlt/70 px-4 py-2 text-sm font-medium text-text transition hover:border-accent/35"
            >
              🔄 New Question
            </button>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => pipeline.setShowSources(!pipeline.showSources)}
              className="w-full rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-3 text-left text-sm font-medium text-text transition hover:border-accent/35"
            >
              Show Sources
            </button>
            {pipeline.showSources ? (
              <div className="rounded-3xl border border-border/70 bg-panelAlt/45 p-4 text-sm text-muted">
                {pipeline.result.sources.length > 0 ? (
                  <ul className="space-y-2">
                    {pipeline.result.sources.map((source) => (
                      <li key={source} className="break-all">
                        {source}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No sources returned."
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => pipeline.setShowRubric(!pipeline.showRubric)}
              className="w-full rounded-3xl border border-border/70 bg-panelAlt/55 px-4 py-3 text-left text-sm font-medium text-text transition hover:border-accent/35"
            >
              Show Rubric Check
            </button>
            {pipeline.showRubric ? (
              <div className="rounded-3xl border border-border/70 bg-panelAlt/45 p-4 whitespace-pre-wrap text-sm leading-7 text-muted">
                {pipeline.result.rubricCheck}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
