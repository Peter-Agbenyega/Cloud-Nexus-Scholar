import {
  AssignmentOutputMode,
  AssignmentProfile,
  AssignmentRecord,
  AssignmentStatus,
  ComplianceReport,
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

const GENERIC_PHRASES = [
  "in today's rapidly evolving landscape",
  "delve into",
  "it is important to note",
  "in conclusion",
  "furthermore",
  "moreover",
  "leverages cutting-edge",
  "robust solution",
  "seamless integration",
  "navigate the complexities of",
];

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

function extractCourse(prompt: string) {
  return prompt.match(/\b([A-Z]{3,4}\s?\d{3})\b/)?.[1] ?? "";
}

function extractUnit(prompt: string) {
  const match = prompt.match(/\b(Unit|Week|Module)\s*([0-9]+)/i);
  return match ? `${match[1]} ${match[2]}` : "";
}

function extractType(prompt: string): AssignmentProfile["type"] {
  if (/peer response|discussion/i.test(prompt)) return "discussion";
  if (/quiz|multiple choice|true\/false/i.test(prompt)) return "quiz";
  if (/lab|practical|screenshot/i.test(prompt)) return "lab";
  if (/assignment|paper|essay|project/i.test(prompt)) return "assignment";
  return "other";
}

function extractWordCounts(prompt: string) {
  const initialRange =
    prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?[^.\n]*initial post)/i)?.[1] ??
    prompt.match(/initial post[^.\n]*(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1] ??
    prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1];

  const peerRange =
    prompt.match(/(\d{2,4}\s*-\s*\d{2,4}\s*words?[^.\n]*peer)/i)?.[1] ??
    prompt.match(/peer (?:response|reply|replies)[^.\n]*(\d{2,4}\s*-\s*\d{2,4}\s*words?)/i)?.[1];

  return {
    initialPostWordCount: initialRange?.replace(/\s+/g, " ").trim(),
    peerReplyWordCount: peerRange?.replace(/\s+/g, " ").trim(),
  };
}

function extractPeerRepliesRequired(prompt: string) {
  const explicitMatch = prompt.match(/(\d+)\s+peer (?:responses|replies)/i);
  if (explicitMatch) {
    return Number(explicitMatch[1]);
  }

  return /peer (?:responses|replies)/i.test(prompt) ? 2 : 0;
}

function extractDueDates(prompt: string) {
  const initialMatch =
    prompt.match(/initial post:\s*([^|\n]+)/i)?.[1]?.trim() ??
    prompt.match(/due(?: date)?:\s*([^|\n]+)/i)?.[1]?.trim();
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

  if (collected.size === 0) {
    const partMatches = [...prompt.matchAll(/Part\s*\d+[:.)-]?\s*([^\n.]+)/gi)];
    partMatches.forEach((match) => {
      const value = match[1]?.trim();
      if (value) {
        collected.add(value.toLowerCase());
      }
    });
  }

  if (collected.size === 0 && fallbackPrefix) {
    splitLines(prompt)
      .filter((line) => line.toLowerCase().includes(fallbackPrefix))
      .forEach((line) => collected.add(line.toLowerCase()));
  }

  return [...collected];
}

function extractRubricCriteria(prompt: string, rubricText?: string) {
  const source = `${prompt}\n${rubricText ?? ""}`;
  const criteria = new Set<string>();
  const rubricSectionMatches = [...source.matchAll(/([A-Za-z][A-Za-z /&-]{3,40})\s*:\s*\d+/g)];

  rubricSectionMatches.forEach((match) => {
    const value = match[1]?.trim();
    if (value && !/total/i.test(value)) {
      criteria.add(value);
    }
  });

  splitLines(source)
    .filter((line) => /rubric|criteria|evaluation/i.test(line))
    .forEach((line) => criteria.add(line));

  return [...criteria];
}

function inferPracticalEvidence(prompt: string) {
  const practicalItems: string[] = [];

  if (/screenshot/i.test(prompt)) practicalItems.push("Screenshots");
  if (/upload|attach|file|document|template/i.test(prompt)) practicalItems.push("Uploaded file or completed template");
  if (/lab|hands-on|implementation|practical/i.test(prompt)) practicalItems.push("Practical work evidence");

  return practicalItems;
}

export function parseAssignmentPrompt(prompt: string, rubric = ""): AssignmentProfile {
  const cleanPrompt = normalizeWhitespace(prompt);
  const wordCounts = extractWordCounts(cleanPrompt);
  const practicalEvidenceItems = inferPracticalEvidence(cleanPrompt);

  return {
    course: extractCourse(cleanPrompt),
    unit: extractUnit(cleanPrompt),
    type: extractType(cleanPrompt),
    title: titleFromPrompt(cleanPrompt),
    prompt: cleanPrompt,
    rubric: normalizeWhitespace(rubric),
    initialPostWordCount: wordCounts.initialPostWordCount,
    peerRepliesRequired: extractPeerRepliesRequired(cleanPrompt),
    peerReplyWordCount: wordCounts.peerReplyWordCount,
    citationRequired: /citation|reference|source/i.test(cleanPrompt),
    apaReferenceRequired: /apa/i.test(cleanPrompt),
    ...extractDueDates(cleanPrompt),
    requiredSections: extractRequiredList(cleanPrompt, /^(part|section)\s*\d+/i, ""),
    requiredDeliverables: extractRequiredList(
      cleanPrompt,
      /deliverable|submit|include|attach|upload|required/i,
      "include",
    ),
    rubricCriteria: extractRubricCriteria(cleanPrompt, rubric),
    submissionFormat: /discussion/i.test(cleanPrompt)
      ? "discussion post"
      : /quiz/i.test(cleanPrompt)
        ? "quiz"
        : /paper|essay|assignment|document/i.test(cleanPrompt)
          ? "document"
          : undefined,
    practicalRequired: practicalEvidenceItems.length > 0,
    practicalEvidenceItems,
    waitForPeerPosts: /wait for peer posts|after classmates post|once peers have posted/i.test(cleanPrompt),
    screenshotsOrFilesRequired: /screenshot|upload|attach|file/i.test(cleanPrompt),
    sourceHints: [
      /nist/i.test(cleanPrompt) ? "NIST publications" : "",
      /aws/i.test(cleanPrompt) ? "AWS documentation" : "",
      /apa/i.test(cleanPrompt) ? "APA 7 reference format" : "",
    ].filter(Boolean),
  };
}

export function buildGenerationPrompt({
  profile,
  draftText,
  mode,
  studentContext,
}: GenerationRequest) {
  const modeLine: Record<AssignmentOutputMode, string> = {
    initial_post: "Write a full discussion initial post that is ready to submit.",
    full_assignment: "Write the full assignment response that is ready to submit.",
    outline: "Create a concise outline only.",
    peer_reply: "Write one personalized peer reply only if a classmate post is provided in the prompt.",
    submission_comment: "Write a short professional submission comment only.",
    quiz_study_reasoning: "Explain the reasoning clearly for quiz study.",
    rubric_cleanup: "Revise the draft so it covers the rubric more directly.",
    apa_reference_cleanup: "Revise the draft and fix citations plus APA references.",
    compliance_check_only: "Do not write a new answer.",
  };

  return `
You are Prof. Scholar inside Cloud Nexus Scholar.
${studentContext ?? DEFAULT_STUDENT_CONTEXT}

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
- Practical required: ${profile.practicalRequired ? "Yes" : "No"}
- Required sections: ${profile.requiredSections.join("; ") || "None stated"}
- Required deliverables: ${profile.requiredDeliverables.join("; ") || "None stated"}
- Rubric criteria: ${profile.rubricCriteria.join("; ") || "None stated"}

Writing rules:
- Match the stated word count.
- Use plain, direct language.
- Sound human, not polished corporate AI.
- Use first person if the assignment is reflective or discussion-based.
- Include Peter's real AWS and DevSecOps experience only where it fits naturally.
- Do not invent personal stories, metrics, or sources.
- Avoid these phrases: ${GENERIC_PHRASES.join("; ")}.
- Keep the final answer clean and copy-ready with normal paragraphs.

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
  const weightedChecks = [
    report.wordCountPass,
    report.citationPass,
    report.apaReferencePass,
    report.promptCoveragePass,
    report.deliverablesPass,
    report.genericWritingPass,
    report.peerReplyReadinessPass,
    report.practicalEvidencePass,
    report.rubricAlignment === "Strong",
  ];

  const passedChecks = weightedChecks.filter(Boolean).length;
  const warningPenalty = Math.min(report.warnings.length * 4, 16);
  const missingPenalty = Math.min(report.missingItems.length * 10, 40);

  return Math.max(0, Math.min(100, Math.round((passedChecks / weightedChecks.length) * 100 - warningPenalty - missingPenalty)));
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

  if (record.practicalRequired && report && !report.practicalEvidencePass) {
    return "practical_needed";
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

function hasInTextCitation(text: string) {
  return /\([A-Z][A-Za-z]+,\s*\d{4}[a-z]?(?:,\s*p{1,2}\.?\s*\d+)?\)/.test(text);
}

function hasApaReferencesSection(text: string) {
  return /(^|\n)(references|reference)\s*\n/i.test(text);
}

function hasPersonalSpecificity(text: string) {
  return /I\b|my\b|AWS|EKS|Terraform|ArgoCD|Trivy|Checkov|Gitleaks|SonarCloud|OWASP ZAP/i.test(text);
}

function getRubricAlignment(text: string, rubricCriteria: string[]) {
  if (rubricCriteria.length === 0) {
    return "Strong" as const;
  }

  const hits = rubricCriteria.filter((criterion) =>
    text.toLowerCase().includes(criterion.toLowerCase().split(":")[0].trim()),
  ).length;

  if (hits >= Math.max(1, Math.ceil(rubricCriteria.length * 0.66))) return "Strong" as const;
  if (hits >= Math.max(1, Math.ceil(rubricCriteria.length * 0.33))) return "Partial" as const;
  return "Weak" as const;
}

function collectPromptCoverageGaps(text: string, profile: AssignmentProfile) {
  return profile.requiredSections.filter((section) => !text.toLowerCase().includes(section.toLowerCase()));
}

function collectDeliverableGaps(text: string, profile: AssignmentProfile) {
  return profile.requiredDeliverables.filter((item) => !text.toLowerCase().includes(item.toLowerCase().slice(0, 24)));
}

export function runComplianceCheck(profile: AssignmentProfile, draft: string): ComplianceReport {
  const trimmedDraft = draft.trim();
  const draftWordCount = countWords(trimmedDraft);
  const relevantWordCount = parseWordCountRange(
    profile.type === "discussion" ? profile.initialPostWordCount : profile.initialPostWordCount,
  );
  const wordCountPass =
    trimmedDraft.length > 0 &&
    (relevantWordCount.min === undefined || draftWordCount >= relevantWordCount.min) &&
    (relevantWordCount.max === undefined || draftWordCount <= relevantWordCount.max);
  const citationPass = !profile.citationRequired || hasInTextCitation(trimmedDraft);
  const apaReferencePass = !profile.apaReferenceRequired || hasApaReferencesSection(trimmedDraft);
  const coverageGaps = collectPromptCoverageGaps(trimmedDraft, profile);
  const deliverableGaps = collectDeliverableGaps(trimmedDraft, profile);
  const rubricAlignment = getRubricAlignment(trimmedDraft, profile.rubricCriteria);
  const genericPhraseHit = GENERIC_PHRASES.find((phrase) => trimmedDraft.toLowerCase().includes(phrase));
  const genericWritingPass = !genericPhraseHit && hasPersonalSpecificity(trimmedDraft);
  const peerReplyReadinessPass =
    profile.peerRepliesRequired === 0 ||
    !/peer reply|peer response/i.test(profile.prompt) ||
    !profile.waitForPeerPosts;
  const practicalEvidencePass = !profile.practicalRequired || profile.practicalEvidenceItems.length > 0;

  const missingItems: string[] = [];
  const warnings: string[] = [];

  if (!wordCountPass) {
    missingItems.push(
      relevantWordCount.label === "No stated word count"
        ? "Draft is missing or empty"
        : `Word count is ${draftWordCount}, but requirement is ${relevantWordCount.label}`,
    );
  }

  if (!citationPass) missingItems.push("Required in-text citation is missing");
  if (!apaReferencePass) missingItems.push("APA references section is missing");
  if (coverageGaps.length > 0) missingItems.push(`Missing prompt sections: ${coverageGaps.join(", ")}`);
  if (deliverableGaps.length > 0) missingItems.push(`Missing deliverables: ${deliverableGaps.join(", ")}`);
  if (rubricAlignment === "Weak") missingItems.push("Rubric criteria are not covered strongly enough");
  if (!peerReplyReadinessPass) missingItems.push("Peer posts are needed before writing personalized replies");
  if (!practicalEvidencePass) missingItems.push("Practical evidence or screenshots are still required");

  if (!genericWritingPass) {
    warnings.push(
      genericPhraseHit
        ? `Generic AI-style phrase found: "${genericPhraseHit}"`
        : "Writing needs more personal specificity or course-connected examples",
    );
  }

  if (profile.peerRepliesRequired > 0) {
    warnings.push(`This assignment still needs ${profile.peerRepliesRequired} peer repl${profile.peerRepliesRequired === 1 ? "y" : "ies"} after the initial post.`);
  }

  if (profile.practicalRequired) {
    warnings.push(`Practical evidence expected: ${profile.practicalEvidenceItems.join(", ")}`);
  }

  return {
    status: missingItems.length === 0 ? "Ready to submit" : "Needs revision",
    wordCount: draftWordCount,
    wordCountRequirement: relevantWordCount.label,
    wordCountPass,
    citationPass,
    apaReferencePass,
    promptCoveragePass: coverageGaps.length === 0,
    deliverablesPass: deliverableGaps.length === 0,
    rubricAlignment,
    genericWritingPass,
    peerReplyReadinessPass,
    practicalEvidencePass,
    missingItems,
    warnings,
    nextAction:
      missingItems.length === 0
        ? profile.peerRepliesRequired > 0
          ? "Submit the initial discussion post, then wait for peer posts before writing replies"
          : "Submit the assignment"
        : missingItems[0] ?? "Revise the draft",
  };
}

export function generateSubmissionComment(record: AssignmentRecord) {
  const dueLabel = record.dueDate || "the listed deadline";
  const typeLabel = record.type.replace("_", " ");
  return `Submitting my ${typeLabel} for ${record.course} ${record.unit ? `(${record.unit}) ` : ""}before ${dueLabel}. I reviewed the draft for assignment requirements, citations, and APA formatting before submission.`;
}
