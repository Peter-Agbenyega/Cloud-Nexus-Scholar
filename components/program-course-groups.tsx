"use client";

import { CourseCard } from "@/components/course-card";
import { useCatalogProgress } from "@/hooks/use-catalog-progress";
import { pluralize } from "@/lib/course-helpers";
import { Program } from "@/lib/types";

type ProgramCourseGroupsProps = {
  programs: Program[];
};

export function ProgramCourseGroups({ programs }: ProgramCourseGroupsProps) {
  const courses = programs.flatMap((program) => program.tracks.flatMap((track) => track.courses));
  const { courseProgressBySlug, isLoaded } = useCatalogProgress(courses);

  return (
    <div className="space-y-8">
      {programs.map((program) => (
        <section key={program.id} className="rounded-shell border border-border/70 bg-panelAlt/45 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-accent">{program.code}</div>
              <h2 className="mt-3 text-3xl font-semibold text-text">{program.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {program.creditHours} credit hours arranged in {program.tracks.length} track{program.tracks.length === 1 ? "" : "s"} for this private workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <div className="rounded-card border border-border/70 bg-panel/80 px-4 py-3">
                {program.type === "master" ? "Degree path" : "Certificate path"}
              </div>
              <div className="rounded-card border border-border/70 bg-panel/80 px-4 py-3">
                Official program structure
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-8">
            {program.tracks.map((track) => (
              <div key={track.id} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{track.label}</div>
                    <div className="mt-2 text-lg font-semibold text-text">{track.courses.length} mapped course{track.courses.length === 1 ? "" : "s"}</div>
                    <div className="mt-2 text-sm text-muted">
                      {pluralize(track.courses.reduce((total, course) => total + course.credits, 0), "credit")} in this track.
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      Official program structure
                    </span>
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      Learning map on course page
                    </span>
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {track.courses.map((course) => (
                    <CourseCard
                      key={course.slug}
                      course={course}
                      progress={courseProgressBySlug[course.slug]}
                      isLoaded={isLoaded}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
