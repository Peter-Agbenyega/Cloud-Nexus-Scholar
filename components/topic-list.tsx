import Link from "next/link";

import { Course } from "@/lib/types";

type TopicListProps = {
  course: Course;
};

export function TopicList({ course }: TopicListProps) {
  return (
    <div className="space-y-4">
      {course.topics.map((topic, index) => (
        <Link
          key={topic.slug}
          href={`/courses/${course.slug}/${topic.slug}`}
          className="block rounded-card border border-border/70 bg-panelAlt/60 p-5 transition hover:border-accent/40 hover:bg-panelAlt"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Topic {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-text">{topic.title}</h3>
            </div>
            <div className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {topic.lessons.length} lesson
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{topic.description}</p>
        </Link>
      ))}
    </div>
  );
}
