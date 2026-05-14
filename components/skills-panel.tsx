"use client";

import { getSkillProfileByCourseCode, Skill } from "@/lib/skills-framework";

type SkillsPanelProps = {
  courseCode: string;
};

function splitCompetency(competency: string) {
  const [title, ...descriptionParts] = competency.split(" — ");

  return {
    title: title ?? competency,
    description: descriptionParts.join(" — "),
  };
}

function SkillCard({
  skill,
  badgeClassName,
  relevanceClassName,
}: {
  skill: Skill;
  badgeClassName: string;
  relevanceClassName: string;
}) {
  return (
    <article className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
      <h4 className="text-lg font-semibold text-text">{skill.title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted">{skill.industryConnection}</p>
      <p className="mt-4 text-sm leading-7 text-text/90">{skill.skillStatement}</p>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">Assessed In</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {skill.assessedIn.map((item) => (
            <span
              key={item}
              className={`rounded-full border px-3 py-1 text-xs ${badgeClassName}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border px-4 py-4 text-sm leading-7 ${relevanceClassName}`}>
        {skill.careerRelevance}
      </div>
    </article>
  );
}

export function SkillsPanel({ courseCode }: SkillsPanelProps) {
  const profile = getSkillProfileByCourseCode(courseCode);

  if (!profile) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">{profile.courseCode}</div>
          <h2 className="mt-2 text-3xl font-semibold text-text">Skills You Are Building</h2>
        </div>
        <span className="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-medium text-text">
          UMGC Skills Framework
        </span>
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <p className="text-sm leading-7 text-muted">{profile.industryContext}</p>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-text">Career Competencies This Course Develops</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profile.careerCompetencies.map((competency) => {
            const { title, description } = splitCompetency(competency);

            return (
              <article
                key={competency}
                className="rounded-card border border-border/70 border-l-4 border-l-emerald-400 bg-panelAlt/55 p-4"
              >
                <h4 className="text-base font-semibold text-text">{title}</h4>
                <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-text">End of Program Skills</h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          These are the high-level skills employers are seeking that this course builds toward.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {profile.endOfProgramSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              badgeClassName="border-amber-400/30 bg-amber-500/10 text-amber-100"
              relevanceClassName="border-emerald-400/25 bg-emerald-500/10 text-emerald-50"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-text">End of Course Skills</h3>
        <p className="mt-2 text-sm leading-7 text-muted">
          These foundational skills scaffold your learning toward the end of program skills.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {profile.endOfCourseSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              badgeClassName="border-sky-400/30 bg-sky-500/10 text-sky-100"
              relevanceClassName="border-emerald-400/25 bg-emerald-500/10 text-emerald-50"
            />
          ))}
        </div>
      </div>

      <div className="rounded-card border border-accent bg-accent/10 p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-accent">Your Readiness Profile</div>
        <p className="mt-3 text-sm leading-7 text-text/90">{profile.readinessStatement}</p>
      </div>
    </section>
  );
}
