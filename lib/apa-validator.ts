import { APAValidation, CitationAudit } from "@/lib/types";

const IN_TEXT_CITATION_REGEX = /\(([A-Z][A-Za-z'’-]+(?:\s*&\s*[A-Z][A-Za-z'’-]+)?(?:\s+et al\.)?,\s*\d{4}[a-z]?(?:,\s*pp?\.?\s*\d+(?:-\d+)?)?)\)/g;

function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function getReferencesSection(draft: string) {
  const match = normalizeWhitespace(draft).match(/\nreferences\s*\n([\s\S]+)$/i);
  return match?.[1]?.trim() ?? "";
}

function getReferenceEntries(draft: string) {
  const references = getReferencesSection(draft);
  if (!references) {
    return [];
  }

  return references
    .split(/\n(?=[A-Z][A-Za-z'’ -]+,\s*[A-Z])/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getInTextCitations(draft: string) {
  return [...draft.matchAll(IN_TEXT_CITATION_REGEX)].map((match) => match[1]);
}

function getCitationAnchor(citation: string) {
  const match = citation.match(/^([A-Z][A-Za-z'’-]+)/);
  return match?.[1]?.toLowerCase() ?? citation.toLowerCase();
}

function getReferenceAnchor(reference: string) {
  const match = reference.match(/^([A-Z][A-Za-z'’-]+)/);
  return match?.[1]?.toLowerCase() ?? reference.toLowerCase();
}

export function buildCitationAudit(draft: string): CitationAudit {
  const inTextCitations = getInTextCitations(draft);
  const referenceEntries = getReferenceEntries(draft);
  const citationAnchors = inTextCitations.map(getCitationAnchor);
  const referenceAnchors = referenceEntries.map(getReferenceAnchor);
  const orphanCitations = inTextCitations.filter((citation) => !referenceAnchors.includes(getCitationAnchor(citation)));
  const orphanReferences = referenceEntries.filter((reference) => !citationAnchors.includes(getReferenceAnchor(reference)));

  return {
    inTextCitations,
    referenceEntries,
    orphanCitations,
    orphanReferences,
    pass: orphanCitations.length === 0 && orphanReferences.length === 0,
  };
}

export function validateAPA7Format(draft: string): APAValidation {
  const citationAudit = buildCitationAudit(draft);
  const hasReferenceSection = /\nreferences\s*\n/i.test(normalizeWhitespace(draft));
  const doiIssues = getReferenceEntries(draft).filter(
    (entry) => /doi/i.test(entry) && !/https:\/\/doi\.org\/10\./i.test(entry),
  );
  const issues: string[] = [];

  if (citationAudit.inTextCitations.length === 0) {
    issues.push("No APA-style in-text citations detected.");
  }

  if (!hasReferenceSection) {
    issues.push("References heading is missing.");
  }

  if (citationAudit.orphanCitations.length > 0) {
    issues.push("One or more in-text citations do not match a reference entry.");
  }

  if (citationAudit.orphanReferences.length > 0) {
    issues.push("One or more reference entries are never cited in the draft.");
  }

  if (doiIssues.length > 0) {
    issues.push("DOIs should use the https://doi.org/ format.");
  }

  return {
    pass: issues.length === 0,
    issues,
    inTextCitationPass: citationAudit.inTextCitations.length > 0 && citationAudit.orphanCitations.length === 0,
    referenceSectionPass: hasReferenceSection && citationAudit.orphanReferences.length === 0,
    doiFormattingPass: doiIssues.length === 0,
  };
}

export function autoFixAPA7(draft: string) {
  let nextDraft = normalizeWhitespace(draft);

  if (!/\nreferences\s*\n/i.test(nextDraft) && /\n[A-Z][A-Za-z'’ -]+,\s*[A-Z].+\(\d{4}\)\./.test(nextDraft)) {
    nextDraft = `${nextDraft}\n\nReferences`;
  }

  nextDraft = nextDraft.replace(/\bdoi:\s*(10\.[^\s]+)/gi, "https://doi.org/$1");
  nextDraft = nextDraft.replace(/\bDOI:\s*(10\.[^\s]+)/g, "https://doi.org/$1");

  return nextDraft.trim();
}
