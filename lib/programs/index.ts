import { clcsProgram } from "@/lib/programs/clcs";
import { ctchProgram } from "@/lib/programs/ctch";
import { Program, UMGCCourse, CourseTopic } from "@/lib/types";

const programs: Program[] = [clcsProgram, ctchProgram];
const courses = programs.flatMap((program) => program.tracks.flatMap((track) => track.courses));
const coursesByCode = new Map(courses.map((course) => [course.code.toLowerCase(), course]));

export type CrossProgramBridge = {
  id: string;
  conceptId: string;
  conceptName: string;
  fromCourseCode: string;
  fromCourseTitle: string;
  toCourseCode: string;
  toCourseTitle: string;
  rationale: string;
};

export function getPrograms(): Program[] {
  return programs;
}

export function getProgramById(programId: string): Program | undefined {
  return programs.find((program) => program.id === programId);
}

export function getProgramByCode(programCode: string): Program | undefined {
  return programs.find((program) => program.code === programCode);
}

export function getTracksForProgram(programId: string) {
  return getProgramById(programId)?.tracks ?? [];
}

export function getAllTracks() {
  return programs.flatMap((program) => program.tracks);
}

export function getCourses(): UMGCCourse[] {
  return courses;
}

export function getCourseByCode(courseCode: string): UMGCCourse | undefined {
  return coursesByCode.get(courseCode.toLowerCase());
}

export function getCourseBySlug(courseSlug: string): UMGCCourse | undefined {
  return courses.find((course) => course.slug === courseSlug);
}

export function getTopicBySlug(courseSlug: string, topicSlug: string): CourseTopic | undefined {
  return getCourseBySlug(courseSlug)?.topics.find((topic) => topic.slug === topicSlug);
}

export function getTrackById(programId: string, trackId: string) {
  return getProgramById(programId)?.tracks.find((track) => track.id === trackId);
}

export function getCoursesForTrack(programId: string, trackId: string) {
  return getTrackById(programId, trackId)?.courses ?? [];
}

export function getCoursesForProgram(programId: string) {
  return getProgramById(programId)?.tracks.flatMap((track) => track.courses) ?? [];
}

export function getProgramCreditHours(programId: string) {
  return getCoursesForProgram(programId).reduce((total, course) => total + course.credits, 0);
}

export function getTrackCreditHours(programId: string, trackId: string) {
  return getCoursesForTrack(programId, trackId).reduce(
    (total, course) => total + course.credits,
    0,
  );
}

export function getProgramForCourse(course: UMGCCourse) {
  return getProgramById(course.program);
}

export function getTrackForCourse(course: UMGCCourse) {
  return getTrackById(course.program, course.track);
}

export function getNeighborCourses(courseSlug: string) {
  const index = courses.findIndex((course) => course.slug === courseSlug);

  if (index === -1) {
    return null;
  }

  return {
    previousCourse: courses[index - 1],
    nextCourse: courses[index + 1],
  };
}

export function groupCoursesByProgram() {
  return programs.map((program) => ({
    program,
    tracks: program.tracks.map((track) => ({
      track,
      courses: track.courses,
    })),
  }));
}

export function getCrossProgramBridges(): CrossProgramBridge[] {
  const bridges: CrossProgramBridge[] = [];
  const seen = new Set<string>();

  courses.forEach((course) => {
    course.topics.forEach((topic) => {
      topic.concepts.forEach((concept) => {
        concept.crossCourseLinks.forEach((link) => {
          const linkedCourse = getCourseByCode(link.courseCode);

          if (!linkedCourse || linkedCourse.program === course.program) {
            return;
          }

          const bridgeId = `${course.code}:${concept.id}:${linkedCourse.code}`;

          if (seen.has(bridgeId)) {
            return;
          }

          seen.add(bridgeId);
          bridges.push({
            id: bridgeId,
            conceptId: concept.id,
            conceptName: concept.name,
            fromCourseCode: course.code,
            fromCourseTitle: course.title,
            toCourseCode: linkedCourse.code,
            toCourseTitle: linkedCourse.title,
            rationale: link.rationale,
          });
        });
      });
    });
  });

  return bridges;
}

export { clcsProgram, ctchProgram };
