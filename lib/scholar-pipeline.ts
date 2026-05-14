export type ScholarCourseCode =
  | "CLCS 605"
  | "CLCS 615"
  | "CLCS 625"
  | "CLCS 635"
  | "CLCS 645";
export type ScholarPipelineMode = "full" | "discussion" | "quiz";

export type ScholarPipelineResult = {
  finalAnswer: string;
  sources: string[];
  rubricCheck: string;
  confidence: number;
  gptDraft: string;
};

export function isScholarCourseCode(value: string): value is ScholarCourseCode {
  return ["CLCS 605", "CLCS 615", "CLCS 625", "CLCS 635", "CLCS 645"].includes(value);
}
