import { getCourseBySlug, getTopicBySlug } from "@/lib/programs";
import { getSyllabusCourseBySlug } from "@/lib/syllabus-data";
import { BreadcrumbItem } from "@/lib/types";

const LABEL_MAP: Record<string, string> = {
  roadmap: "Roadmap",
  courses: "Courses",
  planner: "Planner",
  library: "Library",
  sandbox: "Sandbox",
  resources: "Resources",
  unit: "Unit",
};

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const cleanPath = pathname.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/roadmap",
    },
  ];

  let href = "";

  segments.forEach((segment, index) => {
    href += `/${segment}`;

    if (segments[0] === "courses" && index === 1) {
      const course = getCourseBySlug(segment);
      const syllabusCourse = getSyllabusCourseBySlug(segment);
      breadcrumbs.push({
        label: course?.title ?? syllabusCourse?.name ?? formatSegment(segment),
        href,
      });
      return;
    }

    if (segments[0] === "courses" && segments[2] === "unit" && index === 3) {
      breadcrumbs.push({
        label: `Unit ${segment}`,
        href,
      });
      return;
    }

    if (segments[0] === "courses" && index === 2) {
      const topic = getTopicBySlug(segments[1], segment);
      breadcrumbs.push({
        label: topic?.title ?? formatSegment(segment),
        href,
      });
      return;
    }

    breadcrumbs.push({
      label: LABEL_MAP[segment] ?? formatSegment(segment),
      href,
    });
  });

  return breadcrumbs;
}

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
