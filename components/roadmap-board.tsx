"use client";

import Link from "next/link";

import { useCatalogProgress } from "@/hooks/use-catalog-progress";
import { getCourseSourceLabel, pluralize } from "@/lib/course-helpers";
import { getCrossProgramBridges } from "@/lib/programs";
import { Program } from "@/lib/types";

type RoadmapBoardProps = {
  programs: Program[];
};

export function RoadmapBoard({ programs }: RoadmapBoardProps) {
  const courses = programs.flatMap((program) => program.tracks.flatMap((track) => track.courses));
  const bridges = getCrossProgramBridges().slice(0, 5);
  const { courseProgressBySlug, catalogProgress, isLoaded } = useCatalogProgress(courses);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-shell border border-border/70 bg-panelAlt/45 p-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Roadmap</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-text">
            Real UMGC program map for the private cloud and cybersecurity path.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            This roadmap is the new center of Cloud Nexus Scholar. It tracks the MS in Cloud Computing Systems, the Graduate Certificate in Cybersecurity Technology, and the concept bridges that link both programs into one study system.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-muted">
            <span className="rounded-full border border-border/70 px-3 py-1">
              Official program structure
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">Learning map</span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              Private owner workspace
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-card border border-border/70 bg-panel/80 p-4">
            <div className="text-sm text-muted">Programs mapped</div>
            <div className="mt-2 text-3xl font-semibold text-text">{programs.length}</div>
            <div className="mt-2 text-sm text-muted">
              {courses.length} total courses represented in the current foundation.
            </div>
          </div>
          <div className="rounded-card border border-border/70 bg-panel/80 p-4">
            <div className="text-sm text-muted">Topic progress</div>
            <div className="mt-2 text-3xl font-semibold text-text">
              {isLoaded ? `${catalogProgress.progressPercent}%` : "—"}
            </div>
            <div className="mt-2 text-sm text-muted">
              {isLoaded
                ? `${catalogProgress.completedTopics} of ${catalogProgress.totalTopics} structured topics completed on this device.`
                : "Local topic progress loads after hydration."}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-accent/20 bg-accent/5 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-accent">Bridge map</div>
          <h2 className="mt-3 text-2xl font-semibold text-text">Cloud to cyber overlaps</h2>
          <div className="mt-4 space-y-3">
            {bridges.map((bridge) => (
              <div
                key={bridge.id}
                className="rounded-2xl border border-accent/15 bg-panel/70 p-3 text-sm leading-6 text-muted"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-accent">
                  {bridge.fromCourseCode} {"->"} {bridge.toCourseCode}
                </div>
                <div className="mt-2 font-medium text-text">{bridge.conceptName}</div>
                <p className="mt-2">{bridge.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-border/70 bg-panel/80 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Private workspace direction</div>
          <h2 className="mt-3 text-2xl font-semibold text-text">Next modules staged</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Planner", "/planner"],
              ["Library", "/library"],
              ["Sandbox", "/sandbox"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-2xl border border-border/70 bg-panelAlt/60 px-4 py-4 text-sm font-medium text-text transition hover:border-accent/35 hover:text-accent"
              >
                {label}
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">Coming soon</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {programs.map((program) => (
          <section key={program.id} className="rounded-shell border border-border/70 bg-panelAlt/45 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-accent">{program.code}</div>
                <h2 className="mt-3 text-3xl font-semibold text-text">{program.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {program.creditHours} total credit hours across {pluralize(program.tracks.length, "track")}.
                </p>
              </div>
              <div className="rounded-card border border-border/70 bg-panel/80 px-4 py-3 text-sm text-muted">
                {program.type === "master" ? "Degree path" : "Certificate path"}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {program.tracks.map((track) => (
                <div key={track.id} className="rounded-card border border-border/70 bg-panel/60 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">{track.label}</div>
                      <div className="mt-2 text-lg font-semibold text-text">
                        {pluralize(track.courses.length, "course")}
                      </div>
                      <div className="mt-2 text-sm text-muted">
                        {track.courses.reduce((total, course) => total + course.credits, 0)} credit
                        {track.courses.reduce((total, course) => total + course.credits, 0) === 1
                          ? ""
                          : "s"}{" "}
                        represented in this track.
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                      <span className="rounded-full border border-border/70 px-3 py-1">
                        Official program structure
                      </span>
                      <span className="rounded-full border border-border/70 px-3 py-1">
                        Learning map in course view
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {track.courses.map((course) => {
                      const progress = courseProgressBySlug[course.slug];
                      const status = !isLoaded
                        ? "Loading"
                        : progress.isCompletedCourse
                          ? "Completed"
                          : progress.isInProgress
                            ? "In progress"
                            : "Not started";

                      return (
                        <Link
                          key={course.slug}
                          href={`/courses/${course.slug}`}
                          className="rounded-card border border-border/70 bg-panelAlt/60 p-4 transition hover:border-accent/35 hover:bg-panelAlt"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.18em] text-accent">{course.code}</div>
                              <div className="mt-2 text-lg font-semibold text-text">{course.title}</div>
                            </div>
                            <div className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                              {course.credits} cr
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                            <span className="rounded-full border border-border/70 px-3 py-1">{status}</span>
                            <span className="rounded-full border border-border/70 px-3 py-1">{pluralize(course.topics.length, "topic")}</span>
                            <span className="rounded-full border border-border/70 px-3 py-1">
                              {getCourseSourceLabel(course)}
                            </span>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-muted">{course.description}</p>

                          {course.cyberOverlap?.[0] ? (
                            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-3">
                              <div className="text-xs uppercase tracking-[0.18em] text-accent">Overlap</div>
                              <div className="mt-2 text-sm text-muted">{course.cyberOverlap[0]}</div>
                            </div>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
