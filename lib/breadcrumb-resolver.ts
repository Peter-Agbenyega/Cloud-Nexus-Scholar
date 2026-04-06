import { getCourseBySlug, getTopicBySlug } from "@/lib/mock-data";
import { BreadcrumbItem } from "@/lib/types";

const LABEL_MAP: Record<string, string> = {
  courses: "Courses",
};

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const cleanPath = pathname.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
    },
  ];

  let href = "";

  segments.forEach((segment, index) => {
    href += `/${segment}`;

    if (segment === "courses") {
      breadcrumbs.push({
        label: LABEL_MAP[segment],
        href,
      });
      return;
    }

    if (segments[0] === "courses" && index === 1) {
      const course = getCourseBySlug(segment);
      breadcrumbs.push({
        label: course?.title ?? formatSegment(segment),
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
