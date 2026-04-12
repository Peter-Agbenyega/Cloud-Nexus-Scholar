import { notFound } from "next/navigation";

import { TopicLessonShell } from "@/components/topic-lesson-shell";
import { getTopicPosition } from "@/lib/course-helpers";
import { getCourseBySlug, getTopicBySlug } from "@/lib/programs";

type TopicLessonPageProps = {
  params: Promise<{
    courseSlug: string;
    topicSlug: string;
  }>;
};

export default async function TopicLessonPage({ params }: TopicLessonPageProps) {
  const { courseSlug, topicSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  const topic = getTopicBySlug(courseSlug, topicSlug);

  if (!course || !topic) {
    notFound();
  }

  const topicPosition = getTopicPosition(course, topic.slug);

  if (!topicPosition) {
    notFound();
  }

  return <TopicLessonShell course={course} topic={topic} topicPosition={topicPosition} />;
}
