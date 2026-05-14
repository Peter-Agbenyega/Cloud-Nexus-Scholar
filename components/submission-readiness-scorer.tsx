"use client";

import { useEffect, useMemo, useState } from "react";

type SubmissionReadinessScorerProps = {
  assignmentId: string;
  courseCode: string;
  assignmentTitle: string;
  requiredWordCount?: number;
  points: number;
};

type ScanApiResult = {
  aiScore: number;
  verdict: string;
};

type ScanResult = {
  score: number;
  verdict: string;
};

type CheckStates = Record<string, boolean>;

const aiRedFlagPhrases = [
  "in conclusion",
  "it is important to note",
  "furthermore",
  "in today's digital landscape",
  "leveraging",
  "it is worth noting",
  "as we can see",
  "in summary",
  "the purpose of this paper",
  "this essay will",
];

function getDraftKey(assignmentId: string) {
  return `cns_draft_${assignmentId}`;
}

function getScorerStorageKey(assignmentId: string) {
  return `cns_submission_readiness_${assignmentId}`;
}

function readStoredChecks(assignmentId: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(getScorerStorageKey(assignmentId));

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as CheckStates;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredChecks(assignmentId: string, checks: CheckStates) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getScorerStorageKey(assignmentId), JSON.stringify(checks));
  } catch {}
}

function readDraftText(assignmentId: string) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(getDraftKey(assignmentId)) ?? "";
  } catch {
    return "";
  }
}

function wordCountFromText(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getDetectedPhrases(text: string) {
  const normalized = text.toLowerCase();
  return aiRedFlagPhrases.filter((phrase) => normalized.includes(phrase));
}

function getScoreTheme(score: number) {
  if (score === 10) {
    return {
      tone: "text-emerald-300",
      border: "border-emerald-400/35",
      bg: "bg-emerald-500/10",
      bar: "bg-emerald-400",
      verdict: "Ready to Submit ✓",
    };
  }

  if (score >= 8) {
    return {
      tone: "text-green-300",
      border: "border-green-400/35",
      bg: "bg-green-500/10",
      bar: "bg-green-400",
      verdict: "Almost Ready — fix remaining items",
    };
  }

  if (score >= 6) {
    return {
      tone: "text-amber-300",
      border: "border-amber-400/35",
      bg: "bg-amber-500/10",
      bar: "bg-amber-400",
      verdict: "Not Ready — significant gaps",
    };
  }

  return {
    tone: "text-rose-300",
    border: "border-rose-400/35",
    bg: "bg-rose-500/10",
    bar: "bg-rose-400",
    verdict: "Do Not Submit — major issues",
  };
}

export function SubmissionReadinessScorer({
  assignmentId,
  courseCode,
  assignmentTitle,
  requiredWordCount,
  points,
}: SubmissionReadinessScorerProps) {
  const [draftText, setDraftText] = useState("");
  const [checkStates, setCheckStates] = useState<CheckStates>({});
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    setDraftText(readDraftText(assignmentId));
    setCheckStates(readStoredChecks(assignmentId));
  }, [assignmentId]);

  useEffect(() => {
    writeStoredChecks(assignmentId, checkStates);
  }, [assignmentId, checkStates]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncDraft = () => {
      setDraftText(readDraftText(assignmentId));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getDraftKey(assignmentId)) {
        syncDraft();
      }
    };

    window.addEventListener("storage", handleStorage);
    const intervalId = window.setInterval(syncDraft, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(intervalId);
    };
  }, [assignmentId]);

  const wordCount = useMemo(() => wordCountFromText(draftText), [draftText]);
  const detectedPhrases = useMemo(() => getDetectedPhrases(draftText), [draftText]);
  const rubricChecksPassed = useMemo(
    () =>
      ["rubricPrompt", "rubricWordCount", "rubricAnalysis", "rubricApplication"].every(
        (key) => Boolean(checkStates[key]),
      ),
    [checkStates],
  );

  const criteria = useMemo(() => {
    const wordCountMet = requiredWordCount ? wordCount >= requiredWordCount * 0.95 : wordCount > 0;
    const integrityPassed = scanResult ? scanResult.score < 20 : false;
    const apaPresent = Boolean(checkStates.apaCitations);
    const noRedFlags = detectedPhrases.length === 0;
    const personalExperience = Boolean(checkStates.personalExperience);
    const proofread = Boolean(checkStates.proofread);

    return [
      { label: "Word Count Met", points: 1, passed: wordCountMet },
      { label: "Readiness Scan Complete", points: 2, passed: integrityPassed },
      { label: "APA Citations Present", points: 2, passed: apaPresent },
      { label: "No Risky Phrasing Detected", points: 1, passed: noRedFlags },
      { label: "Personal Experience Included", points: 1, passed: personalExperience },
      { label: "Rubric Criteria Addressed", points: 2, passed: rubricChecksPassed },
      { label: "Proofread Complete", points: 1, passed: proofread },
    ];
  }, [checkStates, detectedPhrases.length, requiredWordCount, rubricChecksPassed, scanResult, wordCount]);

  const totalScore = criteria.reduce((sum, item) => sum + (item.passed ? item.points : 0), 0);
  const scoreTheme = getScoreTheme(totalScore);

  async function runScan() {
    if (!draftText.trim() || isScanning) {
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch("/api/scan-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: draftText }),
      });

      const data = (await response.json()) as ScanApiResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Integrity scan failed.");
      }

      setScanResult({
        score: data.aiScore,
        verdict: data.verdict,
      });
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Integrity scan failed.");
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  }

  function toggleCheck(key: string, checked: boolean) {
    setCheckStates((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  function resetChecks() {
    setCheckStates({});
    setScanResult(null);
    setScanError(null);
  }

  return (
    <section className="rounded-card border border-border/70 bg-panel/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Submission Readiness</div>
          <h3 className="mt-2 text-2xl font-semibold text-text">{assignmentTitle}</h3>
          <p className="mt-2 text-sm text-muted">
            Readiness check for {courseCode} · {points} points at stake
          </p>
        </div>
        <div className={`rounded-card border px-5 py-4 text-center ${scoreTheme.border} ${scoreTheme.bg}`}>
          <div className={`text-4xl font-semibold ${scoreTheme.tone}`}>{totalScore}/10</div>
          <div className="mt-1 text-sm text-text">{scoreTheme.verdict}</div>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-panelAlt ring-1 ring-inset ring-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${scoreTheme.bar}`}
          style={{ width: `${(totalScore / 10) * 100}%` }}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="text-sm font-semibold text-text">Criterion 1 — Word Count Met</div>
            <div className="mt-2 text-sm text-muted">
              {requiredWordCount ? `${wordCount} / ${requiredWordCount} words` : `${wordCount} words`}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-text">Criterion 2 — Readiness Scan Complete</div>
                <div className="mt-2 text-sm text-muted">
                  {scanResult
                    ? `Score ${scanResult.score} · ${scanResult.verdict}`
                    : "Run the scan to flag risky phrasing before submission."}
                </div>
              </div>
              <button
                type="button"
                onClick={runScan}
                disabled={isScanning || !draftText.trim()}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
              >
                {isScanning ? "Scanning..." : "Run Scan"}
              </button>
            </div>
            {scanError ? <div className="mt-3 text-sm text-rose-300">{scanError}</div> : null}
          </div>

          <label className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-text">Criterion 3 — APA Citations Present</div>
                <div className="mt-2 text-sm text-muted">
                  Every factual claim needs an APA citation. Review before submission.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(checkStates.apaCitations)}
                onChange={(event) => toggleCheck("apaCitations", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
              />
            </div>
          </label>

          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="text-sm font-semibold text-text">Criterion 4 — No Risky Phrasing Detected</div>
            {detectedPhrases.length === 0 ? (
              <div className="mt-2 text-sm text-emerald-300">No risky phrasing detected.</div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {detectedPhrases.map((phrase) => (
                  <span
                    key={phrase}
                    className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1 text-xs text-rose-200"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-text">
                  Criterion 5 — Personal Experience Included
                </div>
                <div className="mt-2 text-sm text-muted">
                  The rubric rewards Evidence of Skill Development — your AWS and EKS experience is
                  your competitive advantage.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(checkStates.personalExperience)}
                onChange={(event) => toggleCheck("personalExperience", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
              />
            </div>
          </label>

          <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="text-sm font-semibold text-text">Criterion 6 — Rubric Criteria Addressed</div>
            <div className="mt-3 space-y-3">
              {[
                ["rubricPrompt", "Addressed all parts of the assignment prompt"],
                ["rubricWordCount", "Meets the word count requirement"],
                ["rubricAnalysis", "Includes analysis not just description"],
                ["rubricApplication", "Connected theory to real-world application"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-4 text-sm text-text">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(checkStates[key])}
                    onChange={(event) => toggleCheck(key, event.target.checked)}
                    className="h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-text">Criterion 7 — Proofread Complete</div>
                <div className="mt-2 text-sm text-muted">
                  Read it out loud. If it sounds like a robot wrote it, rewrite those sentences.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(checkStates.proofread)}
                onChange={(event) => toggleCheck("proofread", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border bg-panel text-accent focus:ring-accent"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={resetChecks}
            className="rounded-full border border-border/70 bg-panel/70 px-5 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
          >
            Start Over — Clear All Checks
          </button>
        </div>
      </div>

      {totalScore === 10 ? (
        <div className="mt-6 rounded-3xl border border-emerald-400/35 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-emerald-200">
            Your submission is ready. Here is how to submit:
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text">
            <li>Copy your draft from the Draft tab above</li>
            <li>
              Go to LEO:{" "}
              <a
                href="https://learn.umgc.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                direct link to course
              </a>
            </li>
            <li>Find {assignmentTitle} in the assignments section</li>
            <li>Paste your work and click Submit</li>
            <li>Screenshot your submission confirmation</li>
          </ol>
          <p className="mt-3 text-sm text-emerald-100">
            Remember to add your AI attribution statement at the bottom before submitting.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-border/70 bg-panelAlt/55 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">AI Attribution Template</div>
        <textarea
          readOnly
          value="AI attribution: I used AI assistance for brainstorming, concept clarification, and structural feedback during the preparation of this assignment. The analysis, examples, and final writing reflect my own understanding of the course material."
          className="mt-3 min-h-[110px] w-full rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm leading-7 text-text outline-none"
        />
      </div>
    </section>
  );
}
