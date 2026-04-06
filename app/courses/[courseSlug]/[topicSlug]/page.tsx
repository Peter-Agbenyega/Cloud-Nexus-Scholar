import Link from "next/link";
import { notFound } from "next/navigation";

import { getCourseBySlug, getTopicBySlug } from "@/lib/mock-data";

type TopicLessonPageProps = {
  params: Promise<{
    courseSlug: string;
    topicSlug: string;
  }>;
};

export default async function TopicLessonPage({ params }: TopicLessonPageProps) {
  const { courseSlug, topicSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  const topic = getTopicBySlug(courseSlug, topicSlug);

  if (!course || !topic) {
    notFound();
  }

  const lesson = topic.lessons[0];

  if (!lesson) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
      <article className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {course.code}
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
            {lesson.duration}
          </span>
        </div>

        <h2 className="mt-5 text-3xl font-semibold text-text">{topic.title}</h2>
        <p className="mt-3 text-base leading-7 text-muted">{topic.description}</p>

        <div className="mt-8 rounded-card border border-border/70 bg-panelAlt/70 p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Lesson objective</div>
          <div className="mt-3 text-xl font-semibold text-text">{lesson.objective}</div>
          <p className="mt-4 text-sm leading-7 text-muted">{lesson.summary}</p>
        </div>

        <div className="mt-8">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Key takeaways</div>
          <ul className="mt-4 space-y-3">
            {lesson.bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-2xl border border-border/70 bg-panelAlt/50 px-4 py-4 text-sm leading-6 text-muted"
              >
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <aside className="space-y-6">
        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Current lesson</div>
          <h3 className="mt-3 text-2xl font-semibold text-text">{lesson.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Topic lesson pages are intentionally narrow in Slice 2: one clear summary, one objective,
            and structured takeaways.
          </p>
        </section>

        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Backtrack</div>
          <Link
            href={`/courses/${course.slug}`}
            className="mt-3 inline-flex text-sm font-medium text-accent transition hover:text-text"
          >
            Return to {course.title}
          </Link>
        </section>
      </aside>
    </div>
  );
}
