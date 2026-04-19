import { notFound } from "next/navigation";

import { ProfessorModeTracker } from "@/components/professor-mode-tracker";
import { QuizScoreTracker } from "@/components/quiz-score-tracker";
import { TopicLessonShell } from "@/components/topic-lesson-shell";
import { TutorPanel } from "@/components/tutor-panel";
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

  const fallbackCourseCode = courseSlug
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" ");
  const fallbackTopicTitle = topicSlug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const courseCode = course?.code ?? fallbackCourseCode;
  const courseName = course?.title ?? fallbackCourseCode;
  const topicTitle = topic?.title ?? fallbackTopicTitle;

  return (
    <div className="space-y-8">
      <TopicLessonShell course={course} topic={topic} topicPosition={topicPosition} />

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border/70" />
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Your Private Tutor</div>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      <TutorPanel courseCode={courseCode} courseName={courseName} topicTitle={topicTitle} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfessorModeTracker courseCode={courseCode} topicTitle={topicTitle} />
        <QuizScoreTracker courseCode={courseCode} topicTitle={topicTitle} />
      </div>
    </div>
  );
}
