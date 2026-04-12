// Legacy compatibility shim.
// The app now reads from real UMGC program modules under `lib/programs`.
export {
  getAllTracks,
  getCourseByCode,
  getCourseBySlug,
  getCoursesForProgram,
  getCoursesForTrack,
  getCourses,
  getCrossProgramBridges,
  getProgramById,
  getProgramByCode,
  getProgramCreditHours,
  getPrograms,
  getTrackById,
  getTrackCreditHours,
  getTopicBySlug,
  groupCoursesByProgram,
} from "@/lib/programs";
