import { ParsedPromptTemplate } from "@/lib/types";

export const PROMPT_INPUT_TEMPLATE = `COURSE:
UNIT:
PROFESSOR:
DUE:
TYPE:
WORD COUNT:

ASSIGNMENT INSTRUCTIONS:

RUBRIC:

SPECIAL REQUIREMENTS:`;

export const PROMPT_TEMPLATE_FIELDS: Array<keyof ParsedPromptTemplate> = [
  "course",
  "unit",
  "professor",
  "due",
  "type",
  "wordCount",
  "assignmentInstructions",
  "rubric",
  "specialRequirements",
];

export const EMPTY_PROMPT_TEMPLATE: ParsedPromptTemplate = {
  course: "",
  unit: "",
  professor: "",
  due: "",
  type: "",
  wordCount: "",
  assignmentInstructions: "",
  rubric: "",
  specialRequirements: "",
};

const TEMPLATE_LABELS: Record<keyof ParsedPromptTemplate, string> = {
  course: "COURSE",
  unit: "UNIT",
  professor: "PROFESSOR",
  due: "DUE",
  type: "TYPE",
  wordCount: "WORD COUNT",
  assignmentInstructions: "ASSIGNMENT INSTRUCTIONS",
  rubric: "RUBRIC",
  specialRequirements: "SPECIAL REQUIREMENTS",
};

export function buildPromptTemplateInput(template: ParsedPromptTemplate) {
  return [
    `${TEMPLATE_LABELS.course}: ${template.course}`.trimEnd(),
    `${TEMPLATE_LABELS.unit}: ${template.unit}`.trimEnd(),
    `${TEMPLATE_LABELS.professor}: ${template.professor}`.trimEnd(),
    `${TEMPLATE_LABELS.due}: ${template.due}`.trimEnd(),
    `${TEMPLATE_LABELS.type}: ${template.type}`.trimEnd(),
    `${TEMPLATE_LABELS.wordCount}: ${template.wordCount}`.trimEnd(),
    "",
    `${TEMPLATE_LABELS.assignmentInstructions}:`,
    template.assignmentInstructions.trim(),
    "",
    `${TEMPLATE_LABELS.rubric}:`,
    template.rubric.trim(),
    "",
    `${TEMPLATE_LABELS.specialRequirements}:`,
    template.specialRequirements.trim(),
  ]
    .join("\n")
    .trim();
}

function captureSection(input: string, label: string, nextLabels: string[]) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNext = nextLabels.map((next) => next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const boundary = escapedNext.length > 0 ? `(?=\\n(?:${escapedNext.join("|")}):|$)` : "$";
  const regex = new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)${boundary}`, "i");
  return input.match(regex)?.[1]?.trim() ?? "";
}

export function parsePromptTemplate(input: string): ParsedPromptTemplate {
  const labels = Object.values(TEMPLATE_LABELS);
  const getNextLabels = (current: string) => labels.filter((label) => label !== current);

  return {
    course: captureSection(input, TEMPLATE_LABELS.course, getNextLabels(TEMPLATE_LABELS.course)).split("\n")[0] ?? "",
    unit: captureSection(input, TEMPLATE_LABELS.unit, getNextLabels(TEMPLATE_LABELS.unit)).split("\n")[0] ?? "",
    professor: captureSection(input, TEMPLATE_LABELS.professor, getNextLabels(TEMPLATE_LABELS.professor)).split("\n")[0] ?? "",
    due: captureSection(input, TEMPLATE_LABELS.due, getNextLabels(TEMPLATE_LABELS.due)).split("\n")[0] ?? "",
    type: captureSection(input, TEMPLATE_LABELS.type, getNextLabels(TEMPLATE_LABELS.type)).split("\n")[0] ?? "",
    wordCount: captureSection(input, TEMPLATE_LABELS.wordCount, getNextLabels(TEMPLATE_LABELS.wordCount)).split("\n")[0] ?? "",
    assignmentInstructions: captureSection(
      input,
      TEMPLATE_LABELS.assignmentInstructions,
      [TEMPLATE_LABELS.rubric, TEMPLATE_LABELS.specialRequirements],
    ),
    rubric: captureSection(input, TEMPLATE_LABELS.rubric, [TEMPLATE_LABELS.specialRequirements]),
    specialRequirements: captureSection(input, TEMPLATE_LABELS.specialRequirements, []),
  };
}

export function isPromptTemplateComplete(template: ParsedPromptTemplate) {
  return PROMPT_TEMPLATE_FIELDS.every((field) => template[field].trim().length > 0);
}
