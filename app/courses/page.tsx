import { CourseCard } from "@/components/course-card";
import { getCourses } from "@/lib/mock-data";

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-border/70 bg-panel/80 p-5">
          <div className="text-sm text-muted">Total courses</div>
          <div className="mt-2 text-3xl font-semibold text-text">{courses.length}</div>
        </div>
        <div className="rounded-card border border-border/70 bg-panel/80 p-5">
          <div className="text-sm text-muted">Current focus</div>
          <div className="mt-2 text-3xl font-semibold text-text">Platform literacy</div>
        </div>
        <div className="rounded-card border border-border/70 bg-panel/80 p-5">
          <div className="text-sm text-muted">Content mode</div>
          <div className="mt-2 text-3xl font-semibold text-text">Mock</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </div>
  );
}
