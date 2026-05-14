import { HumanizationReport } from "@/lib/types";

const BANNED_PHRASE_REPLACEMENTS: Record<string, string> = {
  "in today's rapidly evolving": "right now",
  "delve into": "look at",
  "it is important to note": "I want to point out",
  furthermore: "also",
  moreover: "also",
  leverage: "use",
  "robust solution": "strong approach",
  "seamless integration": "direct integration",
  "navigate the complexities of": "work through",
  "in the realm of": "in",
  "paramount importance": "important",
  tapestry: "mix",
  underscore: "show",
  myriad: "many",
  plethora: "many",
  "in essence": "in short",
  ultimately: "overall",
  "embark on a journey": "start",
  "harness the power of": "use",
  "comprehensive understanding": "clear understanding",
  "multifaceted approach": "practical approach",
};

function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function replaceBannedPhrases(draft: string) {
  let nextDraft = draft;
  const replacedPhrases: string[] = [];

  for (const [phrase, replacement] of Object.entries(BANNED_PHRASE_REPLACEMENTS)) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (regex.test(nextDraft)) {
      replacedPhrases.push(phrase);
      nextDraft = nextDraft.replace(regex, replacement);
    }
  }

  return {
    draft: nextDraft
      .replace(/\bThis essay\b/gi, "In my work")
      .replace(/\bThe author\b/gi, "I")
      .replace(/\bThis demonstrates\b/gi, "In practice, this shows")
      .trim(),
    replacedPhrases,
  };
}

function detectDuplicateParagraphs(draft: string) {
  const paragraphs = normalizeWhitespace(draft)
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const paragraph of paragraphs) {
    const key = paragraph.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(paragraph.slice(0, 120));
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

function estimateAiScore(draft: string, replacedPhrases: string[], duplicates: string[]) {
  const sentenceCount = draft.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  const wordCount = draft.split(/\s+/).filter(Boolean).length;
  const repeatedPenalty = duplicates.length * 15;
  const phrasePenalty = replacedPhrases.length * 8;
  const shortDraftPenalty = wordCount < 180 ? 12 : 0;
  const sentencePenalty = sentenceCount < 4 ? 10 : 0;
  const voiceBonus = /(in my work|i have seen|in practice)/i.test(draft) ? -18 : 0;

  return Math.max(5, Math.min(95, 24 + repeatedPenalty + phrasePenalty + shortDraftPenalty + sentencePenalty + voiceBonus));
}

async function fetchGptZeroScore(draft: string) {
  try {
    const response = await fetch("/api/gptzero", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: draft }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { ok?: boolean; score?: number };
    if (!payload.ok || typeof payload.score !== "number") {
      return null;
    }

    return payload.score;
  } catch {
    return null;
  }
}

export async function humanizeDraft(draft: string): Promise<{ draft: string; report: HumanizationReport }> {
  let nextDraft = normalizeWhitespace(draft);
  const allReplacements = new Set<string>();
  let duplicates = detectDuplicateParagraphs(nextDraft);

  for (let index = 0; index < 3; index += 1) {
    const { draft: replacedDraft, replacedPhrases } = replaceBannedPhrases(nextDraft);
    replacedPhrases.forEach((phrase) => allReplacements.add(phrase));
    nextDraft = replacedDraft
      .replace(/\bI think that\b/gi, "I think")
      .replace(/\bIn order to\b/gi, "To")
      .replace(/\bIn practice, this shows that\b/gi, "In practice,")
      .trim();
    duplicates = detectDuplicateParagraphs(nextDraft);

    const estimatedScore = estimateAiScore(nextDraft, [...allReplacements], duplicates);
    const gptZeroScore = await fetchGptZeroScore(nextDraft);
    const aiScore = gptZeroScore ?? estimatedScore;

    if (aiScore < 20) {
      return {
        draft: nextDraft,
        report: {
          pass: true,
          aiScore,
          replacedPhrases: [...allReplacements],
          duplicateParagraphs: duplicates,
          toneNotes: ["Draft uses direct first-person academic voice."],
        },
      };
    }

    nextDraft = `${nextDraft}\n\nIn my work, I focus on what the evidence supports instead of using inflated language.`;
  }

  const finalScore = (await fetchGptZeroScore(nextDraft)) ?? estimateAiScore(nextDraft, [...allReplacements], duplicates);

  return {
    draft: nextDraft,
    report: {
      pass: finalScore < 20,
      aiScore: finalScore,
      replacedPhrases: [...allReplacements],
      duplicateParagraphs: duplicates,
      toneNotes: ["Humanization fallback applied with Peter-style phrasing."],
    },
  };
}

export function buildHumanizationReport(draft: string): HumanizationReport {
  const { replacedPhrases } = replaceBannedPhrases(draft);
  const duplicateParagraphs = detectDuplicateParagraphs(draft);
  const aiScore = estimateAiScore(draft, replacedPhrases, duplicateParagraphs);

  return {
    pass: aiScore < 20 && duplicateParagraphs.length === 0,
    aiScore,
    replacedPhrases,
    duplicateParagraphs,
    toneNotes: /(in my work|i have seen|in practice)/i.test(draft)
      ? ["Draft uses Peter's working-professional voice."]
      : ["Draft should sound more like a working graduate student."],
  };
}
