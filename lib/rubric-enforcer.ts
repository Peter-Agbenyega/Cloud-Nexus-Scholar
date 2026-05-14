import { RubricChecklistItem, RubricCriterion, RubricEvaluation } from "@/lib/types";

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function extractKeywords(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 4);
}

export function parseRubric(rubricText: string): RubricCriterion[] {
  const lines = rubricText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines.map<RubricCriterion | null>((line) => {
      const label = line.replace(/^[\-\d.)\s]+/, "").trim();
      const points = Number(line.match(/(\d+)\s*(?:pts?|points?)/i)?.[1] ?? line.match(/:\s*(\d+)/)?.[1] ?? "");
      const exceedsText =
        line.match(/exceeds expectations[:\-]\s*(.+)$/i)?.[1] ??
        line.match(/distinguished[:\-]\s*(.+)$/i)?.[1] ??
        "";
      const exceedsExpectations = exceedsText
        .split(/[;•]/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (!label) {
        return null;
      }

      return {
        id: slugify(label),
        label,
        points: Number.isFinite(points) ? points : undefined,
        exceedsExpectations,
        evidenceKeywords: extractKeywords(`${label} ${exceedsText}`),
      } satisfies RubricCriterion;
    });

  return parsed.filter((item): item is RubricCriterion => item !== null);
}

function evaluateCriterion(draft: string, criterion: RubricCriterion): RubricEvaluation {
  const lowerDraft = draft.toLowerCase();
  const matchedKeywords = criterion.evidenceKeywords.filter((keyword) => lowerDraft.includes(keyword));
  const addressed = lowerDraft.includes(criterion.label.toLowerCase()) || matchedKeywords.length > 0;
  const exceedsMatches = criterion.exceedsExpectations.filter((item) =>
    lowerDraft.includes(item.toLowerCase().slice(0, 32)),
  );
  const exceedsExpectationsPass =
    criterion.exceedsExpectations.length === 0 ||
    exceedsMatches.length >= Math.max(1, Math.ceil(criterion.exceedsExpectations.length / 2));
  const score = addressed ? (exceedsExpectationsPass ? 1 : 0.7) : 0;

  return {
    criterion,
    matchedKeywords,
    addressed,
    exceedsExpectationsPass,
    score,
    feedback: addressed
      ? exceedsExpectationsPass
        ? "Criterion is addressed at an exceeds-expectations level."
        : "Criterion is present but needs stronger explicit evidence."
      : "Criterion is not explicitly covered in the draft.",
  };
}

export function enforceRubricInGeneration(draft: string, rubric: string | RubricCriterion[]) {
  const criteria = typeof rubric === "string" ? parseRubric(rubric) : rubric;
  const evaluations = criteria.map((criterion) => evaluateCriterion(draft, criterion));
  const passed = evaluations.filter((evaluation) => evaluation.addressed && evaluation.exceedsExpectationsPass).length;

  return {
    criteria,
    evaluations,
    pass: criteria.length === 0 || passed === criteria.length,
    coverageRatio: criteria.length === 0 ? 1 : passed / criteria.length,
  };
}

export function rubricChecklistForUI(rubric: string | RubricCriterion[], draft: string): RubricChecklistItem[] {
  const enforcement = enforceRubricInGeneration(draft, rubric);
  return enforcement.evaluations.map((evaluation) => ({
    id: evaluation.criterion.id,
    label: evaluation.criterion.label,
    pass: evaluation.addressed && evaluation.exceedsExpectationsPass,
    detail: evaluation.feedback,
  }));
}
