export type AcademicTaskType = "discussion" | "reading" | "quiz" | "assignment";

export type AcademicCoursePlan = {
  courseCode: string;
  courseName: string;
  active?: boolean;
};

export type AcademicSession = {
  id: string;
  label: string;
  timeframe: string;
  startsOn?: string;
  status: "complete" | "active" | "upcoming";
  courses: AcademicCoursePlan[];
};

export const academicSessions: AcademicSession[] = [
  {
    id: "summer-session",
    label: "Summer Session",
    timeframe: "Starts May 13, 2025",
    startsOn: "2025-05-13",
    status: "active",
    courses: [
      {
        courseCode: "CLCS 605",
        courseName: "Foundations of Cloud Computing",
        active: true,
      },
      {
        courseCode: "CLCS 615",
        courseName: "Cloud Architecture and Design",
        active: true,
      },
      {
        courseCode: "CTCH 605",
        courseName: "Introduction to Cybersecurity",
      },
    ],
  },
  {
    id: "fall-session-1",
    label: "Fall Session 1",
    timeframe: "Cloud security and automation push",
    status: "upcoming",
    courses: [
      {
        courseCode: "CLCS 625",
        courseName: "Cloud Security",
      },
      {
        courseCode: "CLCS 635",
        courseName: "Cloud DevOps and Automation",
      },
      {
        courseCode: "CTCH 615",
        courseName: "Cybersecurity Threats and Analysis",
      },
    ],
  },
  {
    id: "fall-session-2",
    label: "Fall Session 2",
    timeframe: "Advanced architecture and elective planning",
    status: "upcoming",
    courses: [
      {
        courseCode: "CLCS 645",
        courseName: "Advanced Cloud Topics",
      },
      {
        courseCode: "CLCS ELEC",
        courseName: "Elective TBD",
      },
      {
        courseCode: "CTCH 625",
        courseName: "Cybersecurity Defense for Systems and Networks",
      },
    ],
  },
  {
    id: "final-session",
    label: "Final",
    timeframe: "Capstone and final cyber integration",
    status: "upcoming",
    courses: [
      {
        courseCode: "CLCS 690",
        courseName: "Capstone",
      },
      {
        courseCode: "CTCH 635",
        courseName: "Cybersecurity Attack Prevention Strategies",
      },
    ],
  },
];

export const weeklyTaskLabels: Record<AcademicTaskType, string> = {
  discussion: "Discussion Post",
  reading: "Reading",
  quiz: "Quiz",
  assignment: "Assignment",
};

export const weeklyTaskTypes: AcademicTaskType[] = [
  "discussion",
  "reading",
  "quiz",
  "assignment",
];

export function getActiveAcademicSession() {
  return academicSessions.find((session) => session.status === "active") ?? academicSessions[0];
}
