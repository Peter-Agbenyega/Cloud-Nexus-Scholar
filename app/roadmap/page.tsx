import { RoadmapBoard } from "@/components/roadmap-board";
import { getPrograms } from "@/lib/programs";

export default function RoadmapPage() {
  const programs = getPrograms();

  return <RoadmapBoard programs={programs} />;
}
