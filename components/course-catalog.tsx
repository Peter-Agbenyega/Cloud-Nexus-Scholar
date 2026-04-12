"use client";

import { CourseCard } from "@/components/course-card";
import { useCatalogProgress } from "@/hooks/use-catalog-progress";
import { pluralize } from "@/lib/course-helpers";
import { Course } from "@/lib/types";

type CourseCatalogProps = {
  courses: Course[];
};

function SummaryMetric({
  eyebrow,
  value,
  description,
  isLoaded,
}: {
  eyebrow: string;
  value: string;
  description: string;
  isLoaded: boolean;
}) {
  return (
    <div className="rounded-card border border-border/70 bg-panel/80 p-5">
      <div className="text-sm text-muted">{eyebrow}</div>
      <div className="mt-2 min-h-[2.25rem] text-3xl font-semibold text-text">
        {isLoaded ? value : "—"}
      </div>
      <div className="mt-2 min-h-[3rem] text-sm text-muted">{description}</div>
    </div>
  );
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const { catalogProgress, courseProgressBySlug, isLoaded } = useCatalogProgress(courses);
  const notStartedCourses = courses.length - catalogProgress.startedCourses;
  const hasCourses = courses.length > 0;
  const allCoursesComplete =
    hasCourses &&
    isLoaded &&
    catalogProgress.totalTopics > 0 &&
    catalogProgress.completedCourses === courses.length;

  if (!hasCourses) {
    return (
      <div className="rounded-card border border-dashed border-border/70 bg-panel/70 p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Workspace status</div>
        <h3 className="mt-3 text-2xl font-semibold text-text">No courses available yet</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          No UMGC course records are loaded into this workspace yet, so there is nothing to resume.
          Add a program-aligned course record and this dashboard will pick it up cleanly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          eyebrow="Your progress"
          value={`${catalogProgress.completedTopics} / ${catalogProgress.totalTopics}`}
          description={
            isLoaded
              ? `${pluralize(catalogProgress.completedTopics, "topic")} completed across the workspace foundation.`
              : "Your saved lesson progress loads locally in this browser."
          }
          isLoaded={isLoaded}
        />
        <SummaryMetric
          eyebrow="Courses started"
          value={`${catalogProgress.startedCourses} / ${courses.length}`}
          description={
            isLoaded
              ? notStartedCourses > 0
                ? `${pluralize(notStartedCourses, "course")} still untouched.`
                : "Every mapped course has been started."
              : "Started-course counts appear after local progress loads."
          }
          isLoaded={isLoaded}
        />
        <SummaryMetric
          eyebrow="Courses completed"
          value={`${catalogProgress.completedCourses}`}
          description={
            isLoaded
              ? `${pluralize(catalogProgress.completedCourses, "learning path")} fully completed.`
              : "Completed-course counts stay neutral until saved state is ready."
          }
          isLoaded={isLoaded}
        />
        <SummaryMetric
          eyebrow="Workspace coverage"
          value={isLoaded ? `${catalogProgress.progressPercent}%` : "—"}
          description={
            isLoaded
              ? "Share of all topics completed across every course."
              : "Coverage is calculated from device-local progress."
          }
          isLoaded={isLoaded}
        />
      </div>

      {allCoursesComplete ? (
        <div className="rounded-card border border-accent/20 bg-accent/5 px-5 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Workspace complete</div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Every mapped course is completed on this device. Revisit any path when you want a review pass.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {courses.map((course) => (
          <CourseCard
            key={course.slug}
            course={course}
            progress={courseProgressBySlug[course.slug]}
            isLoaded={isLoaded}
          />
        ))}
      </div>
    </div>
  );
}
