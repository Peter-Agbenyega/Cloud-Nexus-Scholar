import { notFound } from "next/navigation";

import { UnitWorkspace } from "@/components/unit-workspace";
import { getSyllabusCourseBySlug } from "@/lib/syllabus-data";

type UnitWorkspacePageProps = {
  params: Promise<{
    courseSlug: string;
    unitNumber: string;
  }>;
};

export default async function UnitWorkspacePage({ params }: UnitWorkspacePageProps) {
  const { courseSlug, unitNumber } = await params;
  const course = getSyllabusCourseBySlug(courseSlug);
  const parsedUnitNumber = Number(unitNumber);

  if (!course || !Number.isInteger(parsedUnitNumber)) {
    notFound();
  }

  const unit = course.units.find((item) => item.unit === parsedUnitNumber);

  if (!unit) {
    notFound();
  }

  return <UnitWorkspace course={course} unit={unit} />;
}
