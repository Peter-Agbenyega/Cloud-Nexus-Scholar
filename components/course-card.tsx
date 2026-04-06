import Link from "next/link";

import { Course } from "@/lib/types";

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group rounded-card border border-border/70 bg-panelAlt/70 p-5 shadow-card transition hover:-translate-y-1 hover:border-accent/40 hover:bg-panelAlt"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">{course.code}</div>
          <h3 className="mt-3 text-xl font-semibold text-text">{course.title}</h3>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
          {course.level}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted">{course.description}</p>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-muted">{course.duration}</span>
        <span className="font-medium text-accent transition group-hover:text-text">
          Open course
        </span>
      </div>
    </Link>
  );
}
