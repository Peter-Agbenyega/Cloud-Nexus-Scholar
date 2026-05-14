type AcademicProfile = {
  studentName: string;
  institution: string;
  writingStyle: string;
  defaultProfessor: string;
};

const ACADEMIC_PROFILE_KEY = "cns_academic_profile_v1";

const DEFAULT_PROFILE: AcademicProfile = {
  studentName: "Peter Christian Agbenyega",
  institution: "University of Maryland Global Campus",
  writingStyle: "APA 7",
  defaultProfessor: "Professor",
};

function canUseLocalStorage() {
  return typeof window !== "undefined";
}

export function readAcademicProfile(): AcademicProfile {
  if (!canUseLocalStorage()) {
    return DEFAULT_PROFILE;
  }

  try {
    const stored = window.localStorage.getItem(ACADEMIC_PROFILE_KEY);
    if (!stored) {
      return DEFAULT_PROFILE;
    }

    const parsed = JSON.parse(stored) as Partial<AcademicProfile>;
    return {
      studentName: parsed.studentName || DEFAULT_PROFILE.studentName,
      institution: parsed.institution || DEFAULT_PROFILE.institution,
      writingStyle: parsed.writingStyle || DEFAULT_PROFILE.writingStyle,
      defaultProfessor: parsed.defaultProfessor || DEFAULT_PROFILE.defaultProfessor,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function writeAcademicProfile(profile: Partial<AcademicProfile>) {
  const nextProfile = {
    ...readAcademicProfile(),
    ...profile,
  };

  if (!canUseLocalStorage()) {
    return nextProfile;
  }

  try {
    window.localStorage.setItem(ACADEMIC_PROFILE_KEY, JSON.stringify(nextProfile));
  } catch {}

  return nextProfile;
}

export function buildAssignmentHeader(course: string, type: string) {
  const profile = readAcademicProfile();
  return [
    profile.studentName,
    profile.institution,
    course || "Course Not Provided",
    `Submission Type: ${type || "Assignment"}`,
    `Professor: ${profile.defaultProfessor}`,
    `Format: ${profile.writingStyle}`,
  ].join("\n");
}

export function buildDiscussionHeader(course: string) {
  const profile = readAcademicProfile();
  return [
    `${profile.studentName} | ${course || "Course Not Provided"}`,
    `${profile.institution} | ${profile.writingStyle}`,
  ].join("\n");
}
