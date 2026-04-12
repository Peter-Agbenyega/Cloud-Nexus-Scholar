"use client";

import Link from "next/link";

import { useCompletedTopics } from "@/hooks/use-completed-topics";
import { getTopicSourceLabel } from "@/lib/course-helpers";
import { Course } from "@/lib/types";

type TopicListProps = {
  course: Course;
};

export function TopicList({ course }: TopicListProps) {
  const { completedTopicSet, isLoaded } = useCompletedTopics(course);

  return (
    <div className="space-y-4">
      {course.topics.map((topic, index) => {
        const isCompleted = completedTopicSet.has(topic.slug);

        return (
          <Link
            key={topic.slug}
            href={`/courses/${course.slug}/${topic.slug}`}
            className={`block rounded-card border p-5 transition ${
              isCompleted
                ? "border-accent/25 bg-accent/5 hover:border-accent/40 hover:bg-accent/10"
                : "border-border/70 bg-panelAlt/60 hover:border-accent/40 hover:bg-panelAlt"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  Topic {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-text">{topic.title}</h3>
              </div>
              <div className="text-right">
                <div className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                  {getTopicSourceLabel(course, topic.slug) ?? "Learning map"}
                </div>
                {isLoaded ? (
                  <div className={`mt-2 text-xs uppercase tracking-[0.18em] ${isCompleted ? "text-accent" : "text-muted"}`}>
                    {isCompleted ? "Completed" : "Ready"}
                  </div>
                ) : (
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">Progress loading</div>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{topic.description}</p>
            <div className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
              {topic.assessmentRelevance}
            </div>
            <div className="mt-4 inline-flex text-sm font-medium text-accent">
              {isLoaded && isCompleted ? "Review topic" : "Open topic"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
