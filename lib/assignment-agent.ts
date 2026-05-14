import { autoFixAPA7, buildCitationAudit, validateAPA7Format } from "@/lib/apa-validator";
import { buildAssignmentHeader, buildDiscussionHeader } from "@/lib/header-builder";
import { buildHumanizationReport, humanizeDraft } from "@/lib/humanizer";
import {
  buildPromptTemplateInput,
  EMPTY_PROMPT_TEMPLATE,
  parsePromptTemplate,
} from "@/lib/prompt-template";
import { enforceRubricInGeneration, parseRubric, rubricChecklistForUI } from "@/lib/rubric-enforcer";
import {
  AssignmentOutputMode,
  AssignmentProfile,
  AssignmentRecord,
  AssignmentStatus,
  ComplianceReport,
  ParsedPromptTemplate,
} from "@/lib/types";

type GenerationRequest = {
  profile: AssignmentProfile;
  draftText?: string;
  mode: AssignmentOutputMode;
  studentContext?: string;
};

type WordCountRange = {
  min?: number;
  max?: number;
  label: string;
};

const DEFAULT_STUDENT_CONTEXT = `Peter Christian Agbenyega is a UMGC graduate student in cloud computing, founder of Cloud Nexus Hub LLC, AWS certified, and working in real DevSecOps production environments with Terraform, EKS, ArgoCD, Trivy, Checkov, Gitleaks, SonarCloud, and OWASP ZAP.`;

const DISCUSSION_ATTRIBUTION =
  "AI attribution: I used AI assistance for brainstorming, source discovery, and structure checks while preparing this discussion post. The final analysis and wording reflect my own review of the course material.";

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function splitLines(value: string) {
  return normalizeWhitespace(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function parseWordCountRange(value?: string): WordCountRange {
  if (!value) {
    return { label: "No stated word count" };
  }

  const rangeMatch = value.match(/(\d{2,4})\s*-\s*(\d{2,4})/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
      label: `${rangeMatch[1]}-${rangeMatch[2]}`,
    };
  }

  const minimumMatch = value.match(/(\d{2,4})\s*(?:\+|or more|minimum|at least)/i);
  if (minimumMatch) {
    return {
      min: Number(minimumMatch[1]),
      label: `${minimumMatch[1]}+`,
    };
  }

  const standalone = value.match(/(\d{2,4})/);
  if (standalone) {
    return {
      min: Number(standalone[1]),
      label: standalone[1],
    };
  }

  return { label: value };
}

function titleFromPrompt(prompt: string) {
  const firstLine = splitLines(prompt)[0] ?? "Assignment";
  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}...` : firstLine;
}

function extractCourse(prompt: string, parsedTemplate: ParsedPromptTemplate) {
  return parsedTemplate.course || (prompt.match(/\b([A-Z]{3,4}\s?\d{3})\b/)?.[1] ?? "");
}

function extractUnit(prompt: string, parsedTemplate: ParsedPromptTemplate) {
  if (parsedTemplate.unit) {
    return parsedTemplate.unit;
  }

  const match = prompt.match(/\b(Unit|Week|Module)\s*([0-9]+)/i);
  return match ? `${match[1]} ${match[2]}` : "";
}

function extractType(prompt: string, parsedTemplate: ParsedPromptTemplate): AssignmentProfile["type"] {
  const source = `${parsedTemplate.type} ${prompt}`;
  if (/peer response|discussion/i.test(source)) return "discussion";
  if (/quiz|multiple choice|true\/false/i.test(source)) return "quiz";
  if (/lab|practical|screenshot/i.test(source)) return "lab";
  if (/assignment|paper|essay|project/i.test(source)) return "assignment";
  return "other";
}

function extractWordCounts(prompt: string, parsedTemplate: ParsedPromptTemplate) {
  const initialRange =
    parsedTemplate.wordCount ||
    (prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?[^.\n]*initial post)/i)?.[1] ??
      prompt.match(/initial post[^.\n]*(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1] ??
      prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1]);

  const peerRange =
    prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?[^.\n]*peer)/i)?.[1] ??
    prompt.match(/peer (?:response|reply|replies)[^.\n]*(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1];

  return {
    initialPostWordCount: initialRange?.replace(/\s+/g, " ").trim(),
    peerReplyWordCount: peerRange?.replace(/\s+/g, " ").trim(),
  };
}

function extractPeerRepliesRequired(prompt: string, parsedTemplate: ParsedPromptTemplate) {
  const source = `${parsedTemplate.specialRequirements}\n${prompt}`;
  const explicitMatch = source.match(/(\d+)\s+peer (?:responses|replies)/i);
  if (explicitMatch) {
    return Number(explicitMatch[1]);
  }

  return /peer (?:responses|replies)/i.test(source) ? 2 : 0;
}

function extractDueDates(prompt: string, parsedTemplate: ParsedPromptTemplate) {
  const initialMatch =
    parsedTemplate.due ||
    (prompt.match(/initial post:\s*([^|\n]+)/i)?.[1]?.trim() ??
      prompt.match(/due(?: date)?:\s*([^|\n]+)/i)?.[1]?.trim());
  const peerMatch = prompt.match(/peer (?:responses|replies):\s*([^|\n]+)/i)?.[1]?.trim();

  return {
    deadlineInitialPost: initialMatch,
    deadlinePeerReplies: peerMatch,
  };
}

function extractRequiredList(prompt: string, matcher: RegExp, fallbackPrefix: string) {
  const lines = splitLines(prompt);
  const collected = new Set<string>();

  lines.forEach((line) => {
    if (matcher.test(line)) {
      const cleaned = line
        .replace(/^[\-\d.)\s]+/, "")
        .replace(/^(part|section)\s*\d+[:.)-]?\s*/i, "")
        .trim();

      if (cleaned) {
        collected.add(cleaned.toLowerCase());
      }
    }
  });

  if (collected.size === 0 && fallbackPrefix) {
    splitLines(prompt)
      .filter((line) => line.toLowerCase().includes(fallbackPrefix))
      .forEach((line) => collected.add(line.toLowerCase()));
  }

  return [...collected];
}

function extractRubricCriteria(prompt: string, rubricText?: string) {
  const parsed = parseRubric(`${prompt}\n${rubricText ?? ""}`);
  if (parsed.length > 0) {
    return parsed.map((criterion) => criterion.label);
  }

  return splitLines(`${prompt}\n${rubricText ?? ""}`).filter((line) => /rubric|criteria|evaluation/i.test(line));
}

function inferPracticalEvidence(prompt: string) {
  const practicalItems: string[] = [];

  if (/screenshot/i.test(prompt)) practicalItems.push("Screenshots");
  if (/upload|attach|file|document|template/i.test(prompt)) practicalItems.push("Uploaded file or completed template");
  if (/lab|hands-on|implementation|practical/i.test(prompt)) practicalItems.push("Practical work evidence");

  return practicalItems;
}

function collectPromptCoverageGaps(text: string, profile: AssignmentProfile) {
  return profile.requiredSections.filter((section) => !text.toLowerCase().includes(section.toLowerCase().slice(0, 24)));
}

function hasRequiredHeader(draft: string, profile: AssignmentProfile) {
  const firstSixLines = draft.split("\n").slice(0, 6).join("\n");
  return /Peter Christian Agbenyega/i.test(firstSixLines) && new RegExp(profile.course || "Course", "i").test(firstSixLines);
}

function extractReferenceYears(draft: string) {
  const referencesSection = draft.match(/\nreferences\s*\n([\s\S]+)$/i)?.[1] ?? "";
  return [...referencesSection.matchAll(/\((19|20)\d{2}[a-z]?\)/g)].map((match) => Number(match[0].replace(/[()a-z]/gi, "")));
}

function buildSourceAudit(draft: string) {
  const years = extractReferenceYears(draft);
  const threshold = new Date().getFullYear() - 5;
  const recentReferenceCount = years.filter((year) => year >= threshold).length;
  const mostRecentYear = years.length > 0 ? Math.max(...years) : undefined;
  const outdatedReferences = years.filter((year) => year < threshold).map(String);

  return {
    currentYearThreshold: threshold,
    recentReferenceCount,
    mostRecentYear,
    outdatedReferences,
    pass: years.length === 0 || recentReferenceCount > 0,
  };
}

function isToneNatural(draft: string, profile: AssignmentProfile) {
  const banned = buildHumanizationReport(draft).replacedPhrases.length === 0;
  if (profile.type === "discussion") {
    return banned && /(I\b|my\b|in my work|I have seen|in practice)/i.test(draft);
  }

  return banned && !/tapestry|myriad|plethora|paramount importance/i.test(draft);
}

export function parseAssignmentPrompt(prompt: string, rubric = ""): AssignmentProfile {
  const cleanPrompt = normalizeWhitespace(prompt);
  const parsedTemplate = parsePromptTemplate(cleanPrompt);
  const promptSource = buildPromptTemplateInput({
    ...EMPTY_PROMPT_TEMPLATE,
    ...parsedTemplate,
  });
  const source = `${promptSource}\n\n${cleanPrompt}`;
  const wordCounts = extractWordCounts(source, parsedTemplate);
  const practicalEvidenceItems = inferPracticalEvidence(source);

  return {
    course: extractCourse(source, parsedTemplate),
    unit: extractUnit(source, parsedTemplate),
    type: extractType(source, parsedTemplate),
    title: parsedTemplate.type ? `${parsedTemplate.type}: ${parsedTemplate.unit || titleFromPrompt(source)}` : titleFromPrompt(source),
    prompt: cleanPrompt,
    rubric: normalizeWhitespace(rubric || parsedTemplate.rubric),
    initialPostWordCount: wordCounts.initialPostWordCount,
    peerRepliesRequired: extractPeerRepliesRequired(source, parsedTemplate),
    peerReplyWordCount: wordCounts.peerReplyWordCount,
    citationRequired: /citation|reference|source/i.test(source),
    apaReferenceRequired: /apa/i.test(source) || /reference/i.test(source),
    ...extractDueDates(source, parsedTemplate),
    requiredSections: extractRequiredList(
      `${parsedTemplate.assignmentInstructions}\n${parsedTemplate.specialRequirements}\n${source}`,
      /^(part|section)\s*\d+|explain|analyze|compare|discuss|evaluate|recommend|justify/i,
      "",
    ),
    requiredDeliverables: extractRequiredList(
      `${parsedTemplate.specialRequirements}\n${source}`,
      /deliverable|submit|include|attach|upload|required/i,
      "include",
    ),
    rubricCriteria: extractRubricCriteria(source, rubric || parsedTemplate.rubric),
    submissionFormat: /discussion/i.test(source)
      ? "discussion post"
      : /quiz/i.test(source)
        ? "quiz"
        : /paper|essay|assignment|document/i.test(source)
          ? "document"
          : undefined,
    practicalRequired: practicalEvidenceItems.length > 0,
    practicalEvidenceItems,
    waitForPeerPosts: /wait for peer posts|after classmates post|once peers have posted/i.test(source),
    screenshotsOrFilesRequired: /screenshot|upload|attach|file/i.test(source),
    sourceHints: [
      /nist/i.test(source) ? "NIST publications" : "",
      /aws/i.test(source) ? "AWS documentation" : "",
      /ieee|ffiec/i.test(source) ? "Official technical standards" : "",
      /peer-reviewed|journal/i.test(source) ? "Peer-reviewed academic source" : "",
    ].filter(Boolean),
  };
}

export async function formatSubmissionDraft(profile: AssignmentProfile, draft: string) {
  const header =
    profile.type === "discussion"
      ? buildDiscussionHeader(profile.course)
      : buildAssignmentHeader(profile.course, profile.type);
  const withApaFixes = autoFixAPA7(draft);
  const { draft: humanizedDraft } = await humanizeDraft(withApaFixes);
  const withAttribution =
    profile.type === "discussion" && !humanizedDraft.includes("AI attribution:")
      ? `${humanizedDraft}\n\n${DISCUSSION_ATTRIBUTION}`
      : humanizedDraft;

  return `${header}\n\n${withAttribution}`.trim();
}

export function buildGenerationPrompt({
  profile,
  draftText,
  mode,
  studentContext,
}: GenerationRequest) {
  const rubric = parseRubric(profile.rubric);
  const rubricLabels = rubric.length > 0 ? rubric.map((item) => item.label).join("; ") : profile.rubricCriteria.join("; ");
  const modeLine: Record<AssignmentOutputMode, string> = {
    initial_post: "Write a full discussion initial post that is ready to submit.",
    full_assignment: "Write the full assignment response that is ready to submit.",
    outline: "Create a concise outline only.",
    peer_reply: "Write one personalized peer reply only if a classmate post is provided in the prompt.",
    submission_comment: "Write a short professional submission comment only.",
    quiz_study_reasoning: "Explain the reasoning clearly for quiz study.",
    rubric_cleanup: "Revise the draft so it directly satisfies every rubric criterion and exceeds-expectations indicator.",
    apa_reference_cleanup: "Revise the draft and fix citations plus APA references.",
    compliance_check_only: "Do not write a new answer.",
  };

  return `
You are Prof. Scholar inside Cloud Nexus Scholar.
${studentContext ?? DEFAULT_STUDENT_CONTEXT}

Target standard: EXCEEDS EXPECTATIONS across the full rubric.

Assignment profile:
- Course: ${profile.course || "Not stated"}
- Unit: ${profile.unit || "Not stated"}
- Type: ${profile.type}
- Title: ${profile.title}
- Submission format: ${profile.submissionFormat ?? "Not stated"}
- Initial post word count: ${profile.initialPostWordCount ?? "Not stated"}
- Peer replies required: ${profile.peerRepliesRequired}
- Peer reply word count: ${profile.peerReplyWordCount ?? "Not stated"}
- Citation required: ${profile.citationRequired ? "Yes" : "No"}
- APA required: ${profile.apaReferenceRequired ? "Yes" : "No"}
- Required sections: ${profile.requiredSections.join("; ") || "None stated"}
- Required deliverables: ${profile.requiredDeliverables.join("; ") || "None stated"}
- Rubric criteria: ${rubricLabels || "None stated"}

Strict writing rules:
- Cover every prompt section explicitly.
- Match the stated word count.
- Use APA 7 in-text citations and a references section when sources are required.
- Use plain, direct language with a natural graduate-student tone.
- Sound like Peter's real working voice, not polished corporate AI.
- Use first person when the prompt is reflective or discussion-based.
- Avoid invented facts, invented citations, and filler transitions.
- Do not use generic AI phrasing.

Task:
${modeLine[mode]}

Assignment prompt:
${profile.prompt}

Rubric text:
${profile.rubric || "No rubric provided."}

Current draft:
${draftText?.trim() || "No draft yet."}
  `.trim();
}

export async function generateAcademicDraft(request: GenerationRequest) {
  const response = await fetch("/api/assignment-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile: request.profile,
      draftText: request.draftText,
      mode: request.mode,
    }),
  });

  const payload = (await response.json()) as {
    output?: string;
    error?: string;
    details?: string;
  };

  if (!response.ok) {
    throw new Error(payload.details || payload.error || "Generation failed.");
  }

  return payload.output?.trim() ?? "";
}

export function calculateReadinessScore(report: ComplianceReport) {
  const checks = [
    report.wordCountPass,
    report.headerPass,
    report.citationReferencePass,
    report.apa7Pass,
    report.sourceRecencyPass,
    report.turnitinSafePass,
    report.peerReplyReadinessPass,
    report.tonePass,
    report.humanizationPass,
    report.promptCoveragePass,
    report.rubricPass,
  ];

  const passedChecks = checks.filter(Boolean).length;
  const warningPenalty = Math.min(report.warnings.length * 3, 18);
  const missingPenalty = Math.min(report.missingItems.length * 8, 48);

  return Math.max(0, Math.min(100, Math.round((passedChecks / checks.length) * 100 - warningPenalty - missingPenalty)));
}

export function updateAssignmentStatus(record: AssignmentRecord, report?: ComplianceReport): AssignmentStatus {
  if (record.status === "submitted") {
    return "submitted";
  }

  const now = new Date();
  const dueDate = Date.parse(record.dueDate);
  const dueDatePassed = Number.isFinite(dueDate) && dueDate < now.getTime();

  if (dueDatePassed) {
    return "overdue";
  }

  if (record.type === "quiz" && !record.finalDraft?.trim()) {
    return "quiz_pending";
  }

  if (report?.status === "Ready to submit") {
    if (record.type === "discussion" && (record.profile?.peerRepliesRequired ?? 0) > 0) {
      return "peer_replies_needed";
    }

    return "ready_to_submit";
  }

  if (record.finalDraft?.trim()) {
    return "needs_revision";
  }

  return "not_started";
}

export function runComplianceCheck(profile: AssignmentProfile, draft: string): ComplianceReport {
  const trimmedDraft = draft.trim();
  const draftWordCount = countWords(trimmedDraft);
  const relevantWordCount = parseWordCountRange(profile.initialPostWordCount);
  const wordCountPass =
    trimmedDraft.length > 0 &&
    (relevantWordCount.min === undefined || draftWordCount >= relevantWordCount.min) &&
    (relevantWordCount.max === undefined || draftWordCount <= relevantWordCount.max);
  const citationAudit = buildCitationAudit(trimmedDraft);
  const apaValidation = validateAPA7Format(trimmedDraft);
  const sourceAudit = buildSourceAudit(trimmedDraft);
  const humanizationReport = buildHumanizationReport(trimmedDraft);
  const coverageGaps = collectPromptCoverageGaps(trimmedDraft, profile);
  const rubricChecklist = rubricChecklistForUI(profile.rubric, trimmedDraft);
  const rubricEnforcement = enforceRubricInGeneration(trimmedDraft, profile.rubric);
  const headerPass = hasRequiredHeader(trimmedDraft, profile);
  const peerReplyReadinessPass =
    profile.peerRepliesRequired === 0 ||
    !profile.waitForPeerPosts ||
    !/peer reply|peer response/i.test(trimmedDraft);
  const tonePass = isToneNatural(trimmedDraft, profile);
  const turnitinSafePass = humanizationReport.aiScore < 20;
  const humanizationPass =
    humanizationReport.pass && humanizationReport.duplicateParagraphs.length === 0;
  const sourceRecencyPass = !profile.citationRequired || sourceAudit.pass;

  const missingItems: string[] = [];
  const warnings: string[] = [];

  if (!wordCountPass) {
    missingItems.push(
      relevantWordCount.label === "No stated word count"
        ? "Draft is missing or empty."
        : `Word count is ${draftWordCount}, but requirement is ${relevantWordCount.label}.`,
    );
  }

  if (!headerPass) {
    missingItems.push("Required academic header block is missing or incomplete.");
  }

  if (!citationAudit.pass) {
    missingItems.push("Citations and references do not match cleanly.");
  }

  if (!apaValidation.pass) {
    missingItems.push("APA 7 formatting issues still need correction.");
  }

  if (!sourceRecencyPass) {
    missingItems.push(`Reference list needs at least one source published in ${sourceAudit.currentYearThreshold} or later.`);
  }

  if (!turnitinSafePass) {
    missingItems.push(`Estimated AI score is ${humanizationReport.aiScore} and must be under 20.`);
  }

  if (!peerReplyReadinessPass) {
    missingItems.push("Peer posts are still needed before a personalized reply can be finalized.");
  }

  if (!tonePass) {
    missingItems.push("Draft tone does not yet read like a natural graduate-student submission.");
  }

  if (!humanizationPass) {
    missingItems.push("Duplicate blocks or high-risk phrasing remain in the draft.");
  }

  if (coverageGaps.length > 0) {
    missingItems.push(`Prompt sections still missing: ${coverageGaps.join(", ")}.`);
  }

  if (!rubricEnforcement.pass) {
    missingItems.push("Not every rubric criterion is explicitly addressed at the exceeds-expectations level.");
  }

  if (citationAudit.orphanCitations.length > 0) {
    warnings.push(`Orphan citations: ${citationAudit.orphanCitations.join("; ")}`);
  }

  if (citationAudit.orphanReferences.length > 0) {
    warnings.push(`Uncited references: ${citationAudit.orphanReferences.join("; ")}`);
  }

  if (sourceAudit.outdatedReferences.length > 0) {
    warnings.push(`Older references detected: ${sourceAudit.outdatedReferences.join(", ")}`);
  }

  if (profile.peerRepliesRequired > 0) {
    warnings.push(`Peer response requirement tracked separately: ${profile.peerRepliesRequired} repl${profile.peerRepliesRequired === 1 ? "y" : "ies"} required.`);
  }

  humanizationReport.toneNotes.forEach((note) => warnings.push(note));

  const reportBase = {
    status: missingItems.length === 0 ? "Ready to submit" : "Needs revision",
    wordCount: draftWordCount,
    wordCountRequirement: relevantWordCount.label,
    wordCountPass,
    headerPass,
    citationReferencePass: citationAudit.pass,
    apa7Pass: apaValidation.pass,
    sourceRecencyPass,
    turnitinSafePass,
    peerReplyReadinessPass,
    tonePass,
    humanizationPass,
    promptCoveragePass: coverageGaps.length === 0,
    rubricPass: rubricEnforcement.pass,
    citationAudit,
    apaValidation,
    sourceAudit,
    humanizationReport,
    rubricChecklist,
    missingItems,
    warnings,
    nextAction:
      missingItems.length === 0
        ? profile.type === "discussion" && profile.peerRepliesRequired > 0
          ? "Initial post is ready. Track peer replies separately before closing the assignment."
          : "Submit the assignment."
        : missingItems[0] ?? "Revise the draft.",
  } satisfies Omit<ComplianceReport, "readinessScore">;

  return {
    ...reportBase,
    readinessScore: calculateReadinessScore({
      ...reportBase,
      readinessScore: 0,
    }),
  };
}

export function generateSubmissionComment(record: AssignmentRecord) {
  const dueLabel = record.dueDate || "the listed deadline";
  const typeLabel = record.type.replace("_", " ");
  return `Submitting my ${typeLabel} for ${record.course} ${record.unit ? `(${record.unit}) ` : ""}before ${dueLabel}. I reviewed the header, rubric coverage, APA format, reference recency, and humanization checks before submission.`;
}
