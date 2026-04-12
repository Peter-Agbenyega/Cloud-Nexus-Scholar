"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCompletedTopics } from "@/hooks/use-completed-topics";
import { getTopicSourceLabel, pluralize } from "@/lib/course-helpers";
import { Course, CourseTopic } from "@/lib/types";

type TopicLessonShellProps = {
  course: Course;
  topic: CourseTopic;
  topicPosition: {
    index: number;
    total: number;
    previousTopic?: CourseTopic;
    nextTopic?: CourseTopic;
  };
};

function StatusDot({ completed }: { completed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-2.5 w-2.5 rounded-full ${completed ? "bg-accent shadow-[0_0_0_4px_rgba(84,208,255,0.12)]" : "bg-border"}`}
    />
  );
}

export function TopicLessonShell({ course, topic, topicPosition }: TopicLessonShellProps) {
  const {
    isTopicComplete,
    markTopicComplete,
    markTopicIncomplete,
    completedTopicSet,
    completedCount,
    totalTopics,
    isCompletedCourse,
    isLoaded,
  } = useCompletedTopics(course);
  const isCompleted = isTopicComplete(topic.slug);
  const isFinalTopic = topicPosition.index === topicPosition.total - 1;
  const hasHydratedCourseCompletion = useRef(false);
  const previousCourseCompleted = useRef(false);
  const [justCompletedCourse, setJustCompletedCourse] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!hasHydratedCourseCompletion.current) {
      hasHydratedCourseCompletion.current = true;
      previousCourseCompleted.current = isCompletedCourse;
      setJustCompletedCourse(false);
      return;
    }

    if (!previousCourseCompleted.current && isCompletedCourse) {
      setJustCompletedCourse(true);
    }

    if (previousCourseCompleted.current && !isCompletedCourse) {
      setJustCompletedCourse(false);
    }

    previousCourseCompleted.current = isCompletedCourse;
  }, [isCompletedCourse, isLoaded]);

  const showFullCompletionPanel = isCompletedCourse && (isFinalTopic || justCompletedCourse);
  const showReviewStatePanel = isCompletedCourse && !showFullCompletionPanel;
  const progressPanelLabel = !isLoaded
    ? "Loading progress"
    : showFullCompletionPanel
      ? "Course completed"
      : showReviewStatePanel
        ? "Review mode"
      : isCompleted
        ? "Topic completed"
        : "Lesson progress";
  const progressSummary = !isLoaded
    ? "Saved progress is loading for this browser."
    : showFullCompletionPanel
      ? `You completed ${course.title}.`
      : showReviewStatePanel
        ? "Course complete, reviewing"
        : isCompleted
          ? "This topic is completed on this device."
          : "Track your progress for this lesson.";
  const nextTopicCompleted = Boolean(
    isLoaded && topicPosition.nextTopic && completedTopicSet.has(topicPosition.nextTopic.slug),
  );
  const sections = topic.sections ?? [
    {
      heading: "Topic framing",
      content: [topic.summary ?? topic.description],
    },
  ];
  const bullets =
    topic.bullets ??
    topic.concepts.slice(0, 3).map((concept) => `${concept.name}: ${concept.whyItMatters}`);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
      <article className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {course.code}
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
            {getTopicSourceLabel(course, topic.slug) ?? "Learning map"}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            Topic {topicPosition.index + 1} of {topicPosition.total}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-text">{topic.title}</h2>
            <p className="mt-3 text-base leading-7 text-muted">{topic.description}</p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-sm ${isCompleted ? "border-accent/30 bg-accent/10 text-text" : "border-border/70 bg-panelAlt/60 text-muted"}`}>
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Topic state</div>
            <div className="mt-2 font-medium">
              {!isLoaded ? "Progress loading" : isCompleted ? "Completed on this device" : "Not completed yet"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
          <span className="rounded-full border border-border/70 px-3 py-1">{course.credits} credits</span>
          <span className="rounded-full border border-border/70 px-3 py-1">{topic.assessmentRelevance}</span>
        </div>

        {topic.objective ? (
          <div className="mt-8 rounded-card border border-border/70 bg-panelAlt/70 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Topic objective</div>
            <div className="mt-3 text-xl font-semibold text-text">{topic.objective}</div>
            {topic.summary ? <p className="mt-4 text-sm leading-7 text-muted">{topic.summary}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 space-y-5">
          {sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-card border border-border/70 bg-panelAlt/40 p-5"
            >
              <h3 className="text-lg font-semibold text-text">{section.heading}</h3>
              <div className="mt-3 space-y-4">
                {section.content.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div
          className={`mt-8 rounded-card border p-5 ${
            isCompletedCourse ? "border-accent/35 bg-accent/10" : "border-border/70 bg-panelAlt/50"
          }`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted">{progressPanelLabel}</div>
              <div className="sr-only" role="status" aria-live="polite">
                {progressSummary}
              </div>
              {showFullCompletionPanel ? (
                <>
                  <div className="mt-2 text-xl font-semibold text-text">You completed {course.title}.</div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Every topic in this course is now marked complete on this device. You can revisit the sequence or move back into the roadmap for the next milestone.
                  </p>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-accent">
                    {completedCount} / {totalTopics} topics complete
                  </div>
                </>
              ) : showReviewStatePanel ? (
                <>
                  <div className="mt-2 inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
                    Course complete
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    You are reviewing an earlier topic from a completed course. Your completion state stays saved on this device while you revisit the sequence.
                  </p>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-accent">
                    {completedCount} / {totalTopics} topics complete
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-muted">
                  {!isLoaded
                    ? "Completion state is loading from local storage, so this panel stays neutral until your saved progress is ready."
                    : "Your topic progress is saved locally in this browser so the workspace can keep your study sequence stable without a backend."}
                </p>
              )}
            </div>

            {showFullCompletionPanel ? (
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                  >
                    Review course
                  </Link>
                  <Link
                    href="/roadmap"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-panel/70 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent/35 hover:text-accent"
                  >
                    Return to roadmap
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => markTopicIncomplete(topic.slug)}
                  className="text-sm text-muted transition hover:text-text"
                  aria-label={`Mark ${topic.title} incomplete`}
                >
                  Mark this topic incomplete
                </button>
              </div>
            ) : showReviewStatePanel ? (
              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-text">
                  Reviewing
                </div>
                <button
                  type="button"
                  onClick={() => markTopicIncomplete(topic.slug)}
                  className="text-sm text-muted transition hover:text-text"
                  aria-label={`Mark ${topic.title} incomplete`}
                >
                  Mark incomplete
                </button>
              </div>
            ) : isCompleted ? (
              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-text">
                  Completed
                </div>
                <button
                  type="button"
                  onClick={() => markTopicIncomplete(topic.slug)}
                  className="text-sm text-muted transition hover:text-text"
                  aria-label={`Mark ${topic.title} incomplete`}
                >
                  Mark incomplete
                </button>
              </div>
            ) : !isLoaded ? (
              <div className="rounded-full border border-border/70 bg-panel/60 px-4 py-2 text-sm text-muted">
                Loading saved state
              </div>
            ) : (
              <button
                type="button"
                onClick={() => markTopicComplete(topic.slug)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                aria-label={`Mark ${topic.title} as complete`}
              >
                Mark as complete
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Key takeaways</div>
          <ul className="mt-4 space-y-3">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-2xl border border-border/70 bg-panelAlt/50 px-4 py-4 text-sm leading-6 text-muted"
              >
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <footer className="mt-10 grid gap-4 border-t border-border/70 pt-6 md:grid-cols-2">
          {topicPosition.previousTopic ? (
            <Link
              href={`/courses/${course.slug}/${topicPosition.previousTopic.slug}`}
              className="rounded-card border border-border/70 bg-panelAlt/60 p-4 transition hover:border-accent/40 hover:bg-panelAlt"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Previous topic</div>
              <div className="mt-2 text-lg font-semibold text-text">{topicPosition.previousTopic.title}</div>
              <div className="mt-2 text-sm text-muted">Review the prior concept before moving on.</div>
            </Link>
          ) : (
            <div className="rounded-card border border-dashed border-border/70 bg-panelAlt/40 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Previous topic</div>
              <div className="mt-2 text-sm text-muted">You're at the start of this course.</div>
            </div>
          )}

          {topicPosition.nextTopic ? (
            <Link
              href={`/courses/${course.slug}/${topicPosition.nextTopic.slug}`}
              className="rounded-card border border-accent/30 bg-accent/10 p-4 text-right transition hover:border-accent/50 hover:bg-accent/15"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-accent">Next topic</div>
              <div className="mt-2 text-lg font-semibold text-text">{topicPosition.nextTopic.title}</div>
              <div className="mt-2 text-sm text-muted">
                {nextTopicCompleted
                  ? "Revisit this completed topic."
                  : "Continue forward through the course foundation."}
              </div>
            </Link>
          ) : (
            <div className="rounded-card border border-dashed border-border/70 bg-panelAlt/40 p-4 text-right">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Next topic</div>
              <div className="mt-2 text-sm text-muted">You've reached the end of this course.</div>
            </div>
          )}
        </footer>
      </article>

      <aside className="space-y-6">
        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Concept focus</div>
              <h3 className="mt-3 text-2xl font-semibold text-text">Topic concepts</h3>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {pluralize(topic.concepts.length, "concept")}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {topic.concepts.map((concept) => (
              <div key={concept.id} className="rounded-card border border-border/70 bg-panel/60 p-4">
                <div className="text-sm font-semibold text-text">{concept.name}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{concept.explanations.intermediate}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">Why it matters</div>
                <p className="mt-2 text-sm leading-6 text-muted">{concept.whyItMatters}</p>
                {concept.crossCourseLinks.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/5 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-accent">Cross-program bridge</div>
                    <div className="mt-2 text-sm text-muted">
                      Also appears in {concept.crossCourseLinks[0].courseCode}: {concept.crossCourseLinks[0].rationale}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted">Continue learning</div>
              <h3 className="mt-3 text-2xl font-semibold text-text">Topic navigation</h3>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {topicPosition.index + 1} of {topicPosition.total}
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            {pluralize(course.topics.length, "topic")} in {course.title}. Use this panel to stay oriented, revisit completed topics, and move through the sequence with context.
          </p>

          <div className="mt-5 space-y-3">
            {course.topics.map((courseTopic, index) => {
              const isActive = courseTopic.slug === topic.slug;
              const isCompletedTopic = completedTopicSet.has(courseTopic.slug);

              return (
                <Link
                  key={courseTopic.slug}
                  href={`/courses/${course.slug}/${courseTopic.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-card border p-4 transition ${
                    isActive
                      ? "border-accent/40 bg-accent/10 ring-1 ring-accent/20"
                      : isCompletedTopic
                        ? "border-accent/20 bg-accent/5 hover:border-accent/35 hover:bg-accent/10"
                        : "border-border/70 bg-panel/60 hover:border-accent/30 hover:bg-panel"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className={`text-xs uppercase tracking-[0.18em] ${isActive ? "text-accent" : "text-muted"}`}>
                        Topic {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-text">{courseTopic.title}</div>
                      <div className="mt-2 text-sm leading-6 text-muted">{courseTopic.description}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      {isLoaded ? (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted">
                          <StatusDot completed={isCompletedTopic} />
                          <span>{isCompletedTopic ? "Completed" : "Not started"}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted">Progress loading</div>
                      )}
                      {isActive ? (
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-accent">Current focus</div>
                      ) : (
                        <div className="mt-2 text-xs text-muted">
                          {getTopicSourceLabel(course, courseTopic.slug) ?? "Learning map"}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            href={`/courses/${course.slug}`}
            className="mt-5 inline-flex text-sm font-medium text-accent transition hover:text-text"
          >
            Return to course overview
          </Link>
        </section>
      </aside>
    </div>
  );
}
