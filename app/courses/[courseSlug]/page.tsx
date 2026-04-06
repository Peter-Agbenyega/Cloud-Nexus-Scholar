import Link from "next/link";
import { notFound } from "next/navigation";

import { TopicList } from "@/components/topic-list";
import { getCourseBySlug } from "@/lib/mock-data";

type CourseDetailPageProps = {
  params: Promise<{
    courseSlug: string;
  }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const firstTopic = course.topics[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
      <div className="space-y-6">
        <section className="rounded-card border border-border/70 bg-panel/80 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
              {course.code}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {course.level}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {course.duration}
            </span>
          </div>

          <h2 className="mt-5 text-3xl font-semibold text-text">{course.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{course.description}</p>
        </section>

        <section className="rounded-card border border-border/70 bg-panel/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-text">Topics</h3>
            {firstTopic ? (
              <Link
                href={`/courses/${course.slug}/${firstTopic.slug}`}
                className="text-sm font-medium text-accent transition hover:text-text"
              >
                Start first lesson
              </Link>
            ) : null}
          </div>
          <div className="mt-5">
            <TopicList course={course} />
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <h3 className="text-lg font-semibold text-text">Learning outcomes</h3>
          <ul className="mt-4 space-y-3">
            {course.outcomes.map((outcome) => (
              <li
                key={outcome}
                className="rounded-2xl border border-border/70 bg-panel px-4 py-3 text-sm leading-6 text-muted"
              >
                {outcome}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="text-sm text-muted">Course topology</div>
          <div className="mt-3 text-4xl font-semibold text-text">{course.topics.length}</div>
          <div className="mt-2 text-sm leading-6 text-muted">
            Topics are modeled as routeable content groups with a single lesson entry point for this
            foundation slice.
          </div>
        </section>
      </aside>
    </div>
  );
}
