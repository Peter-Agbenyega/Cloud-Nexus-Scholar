import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseDetailCta } from "@/components/course-detail-cta";
import { TopicList } from "@/components/topic-list";
import {
  formatTrackLabel,
  getCourseSourceLabel,
  getProgramLabel,
  pluralize,
} from "@/lib/course-helpers";
import { getCourseBySlug, getTrackForCourse } from "@/lib/programs";

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

  const track = getTrackForCourse(course);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
      <div className="space-y-6">
        <section className="rounded-card border border-border/70 bg-panel/80 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
              {course.code}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {course.credits} credits
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {track?.label ?? formatTrackLabel(course.track)}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {getCourseSourceLabel(course)}
            </span>
          </div>

          <h2 className="mt-5 text-3xl font-semibold text-text">{course.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{course.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
            <div className="rounded-full border border-border/70 px-3 py-1">
              {pluralize(course.topics.length, "topic")}
            </div>
            <div className="rounded-full border border-border/70 px-3 py-1">
              {getProgramLabel(course.program, "full")}
            </div>
            <div className="rounded-full border border-border/70 px-3 py-1">
              {course.prereqs.length > 0 ? `Prereqs: ${course.prereqs.join(", ")}` : "No listed prereqs"}
            </div>
          </div>
          <div className="mt-6 rounded-card border border-border/70 bg-panelAlt/50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Foundation honesty</div>
            <p className="mt-3 text-sm leading-6 text-muted">
              {course.sourceType === "official-program-structure"
                ? "This course record reflects the official UMGC program structure. The topic sequence below is a course-aligned learning map for this private workspace unless a syllabus-derived source is added later."
                : "This record is an app-managed planning placeholder used to keep the real UMGC elective requirement visible without pretending a final elective has already been chosen."}
            </p>
          </div>
          {course.cyberOverlap?.length ? (
            <div className="mt-6 rounded-card border border-accent/20 bg-accent/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">Bridge to the other program</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {course.cyberOverlap.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rounded-card border border-border/70 bg-panel/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-text">Course overview</h3>
            <Link
              href="/courses"
              className="text-sm font-medium text-accent transition hover:text-text"
            >
              All courses
            </Link>
          </div>
          <div className="mt-5">
            <CourseDetailCta course={course} />
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
            {course.learningOutcomes.map((outcome) => (
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
          <div className="text-sm text-muted">Course structure</div>
          <div className="mt-3 text-4xl font-semibold text-text">{course.topics.length}</div>
          <div className="mt-2 text-sm leading-6 text-muted">
            {pluralize(course.topics.length, "topic")} arranged as a concept-ready learning map for future tutor, planner, and library slices.
          </div>
        </section>

        <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
          <div className="text-sm text-muted">Offering status</div>
          <div className="mt-3 text-lg font-semibold text-text">{course.semesterOffered}</div>
          {course.capstoneRelevance ? (
            <p className="mt-3 text-sm leading-6 text-muted">{course.capstoneRelevance}</p>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
