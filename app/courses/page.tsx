import { ProgramCourseGroups } from "@/components/program-course-groups";
import { getPrograms } from "@/lib/programs";

export default function CoursesPage() {
  const programs = getPrograms();
  const courses = programs.flatMap((program) => program.tracks.flatMap((track) => track.courses));
  const totalCredits = courses.reduce((total, course) => total + course.credits, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-shell border border-border/70 bg-panelAlt/45 p-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Courses</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-text">
            Real UMGC course workspace for the cloud systems degree and cybersecurity certificate.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            Every course listed here is anchored to the actual UMGC program structure. Course pages use course-aligned learning maps so the foundation stays useful now without pretending official weekly syllabi have already been loaded into the workspace.
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

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-card border border-border/70 bg-panel/80 p-4">
            <div className="text-sm text-muted">Programs represented</div>
            <div className="mt-2 text-3xl font-semibold text-text">{programs.length}</div>
          </div>
          <div className="rounded-card border border-border/70 bg-panel/80 p-4">
            <div className="text-sm text-muted">Courses mapped</div>
            <div className="mt-2 text-3xl font-semibold text-text">{courses.length}</div>
          </div>
          <div className="rounded-card border border-border/70 bg-panel/80 p-4">
            <div className="text-sm text-muted">Credits represented</div>
            <div className="mt-2 text-3xl font-semibold text-text">{totalCredits}</div>
          </div>
        </div>
      </section>

      <ProgramCourseGroups programs={programs} />
    </div>
  );
}
