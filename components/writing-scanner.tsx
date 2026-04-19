"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type SentenceResult = {
  text: string;
  aiFlag: boolean;
  aiReason: string;
  patchwritingFlag: boolean;
  patchwritingReason: string;
  citationFlag: boolean;
  citationReason: string;
  voiceFlag: boolean;
  voiceReason: string;
  riskLevel: string;
};

type CitationGap = {
  sentence: string;
  suggestedCitation: string;
};

type ChecklistItem = {
  item: string;
  passed: boolean;
  note: string;
};

type ScanResult = {
  aiScore: number;
  plagiarismRisk: number;
  citationScore: number;
  voiceScore: number;
  overallScore: number;
  verdict: string;
  summary: string;
  sentences: SentenceResult[];
  citationGaps: CitationGap[];
  advice: string;
  preSubmissionChecklist: ChecklistItem[];
};

type ScanError = {
  error?: string;
};

function getVerdictTheme(verdict: string) {
  switch (verdict) {
    case "Clear":
      return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
    case "Needs Work":
      return "border-amber-400/35 bg-amber-500/10 text-amber-200";
    case "High Risk":
      return "border-orange-400/35 bg-orange-500/10 text-orange-200";
    default:
      return "border-rose-400/35 bg-rose-500/10 text-rose-200";
  }
}

function getRiskStyles(riskLevel: string) {
  switch (riskLevel) {
    case "low":
      return "border-l-yellow-300/50 bg-yellow-300/5 text-text";
    case "medium":
      return "border-l-amber-400 bg-amber-400/10 text-text";
    case "high":
      return "border-l-red-400 bg-red-400/10 text-text";
    default:
      return "border-l-border bg-panel/60 text-muted";
  }
}

function getDangerScoreTheme(score: number) {
  if (score < 20) {
    return {
      tone: "text-emerald-300",
      bar: "bg-emerald-400",
    };
  }

  if (score < 60) {
    return {
      tone: "text-amber-300",
      bar: "bg-amber-400",
    };
  }

  return {
    tone: "text-rose-300",
    bar: "bg-rose-400",
  };
}

function getPositiveScoreTheme(score: number) {
  if (score > 80) {
    return {
      tone: "text-emerald-300",
      bar: "bg-emerald-400",
    };
  }

  if (score >= 50) {
    return {
      tone: "text-amber-300",
      bar: "bg-amber-400",
    };
  }

  return {
    tone: "text-rose-300",
    bar: "bg-rose-400",
  };
}

function Tag({ label, reason, className }: { label: string; reason: string; className: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${className}`}>
      <span className="font-semibold">{label}</span>
      {reason ? ` · ${reason}` : ""}
    </span>
  );
}

export function WritingScanner() {
  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sentences" | "citations" | "checklist">(
    "overview",
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(220, textarea.scrollHeight)}px`;
  }, [text]);

  const characterCount = text.length;
  const flaggedSentences = useMemo(() => {
    if (!result) {
      return 0;
    }

    return result.sentences.filter(
      (sentence) =>
        sentence.aiFlag ||
        sentence.patchwritingFlag ||
        sentence.citationFlag ||
        sentence.voiceFlag,
    ).length;
  }, [result]);

  const passedChecklistItems = useMemo(() => {
    if (!result) {
      return 0;
    }

    return result.preSubmissionChecklist.filter((item) => item.passed).length;
  }, [result]);

  const allChecksPassed = result ? result.preSubmissionChecklist.every((item) => item.passed) : false;

  async function scanWriting() {
    setIsScanning(true);
    setError(null);
    setResult(null);
    setActiveTab("overview");

    try {
      const response = await fetch("/api/scan-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as ScanResult | ScanError;

      if (!response.ok) {
        setError((data as ScanError).error || "Scan failed");
        return;
      }

      setResult(data as ScanResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  function clearAll() {
    setText("");
    setResult(null);
    setError(null);
    setActiveTab("overview");
    textareaRef.current?.focus();
  }

  const aiTheme = result ? getDangerScoreTheme(result.aiScore) : null;
  const plagiarismTheme = result ? getDangerScoreTheme(result.plagiarismRisk) : null;
  const citationTheme = result ? getPositiveScoreTheme(result.citationScore) : null;
  const voiceTheme = result ? getPositiveScoreTheme(result.voiceScore) : null;

  return (
    <section className="space-y-6 rounded-card border border-border/70 bg-panel/80 p-6 shadow-card">
      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Professor Scholar</div>
        <h2 className="mt-3 text-3xl font-semibold text-text">Academic Integrity Scanner</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted">
          Paste your writing below. Professor Scholar runs a full integrity analysis:
          AI detection, patchwriting check, citation gap review, and voice consistency
          — all in one scan.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
            AI Detection
          </span>
          <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
            Turnitin-Style Analysis
          </span>
          <span className="rounded-full border border-border/70 bg-panel/60 px-3 py-1 text-xs text-muted">
            Powered by Professor Scholar
          </span>
        </div>
      </div>

      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your UMGC discussion post, essay, or assignment draft here before submitting..."
          className="min-h-[220px] w-full resize-none rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
        />

        <div className="mt-3 text-sm text-muted">{characterCount} characters</div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void scanWriting()}
            disabled={text.trim().length < 50 || isScanning}
            className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
          >
            <span className={isScanning ? "animate-pulse" : ""}>
              {isScanning ? "Professor Scholar is analyzing..." : "Run Full Integrity Scan"}
            </span>
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-border/70 bg-panel/60 px-5 py-2 text-sm font-semibold text-muted transition hover:border-accent/35 hover:text-text"
          >
            Clear
          </button>
        </div>
      </div>

      {result ? (
        <div className="space-y-6">
          <div className={`rounded-card border p-5 ${getVerdictTheme(result.verdict)}`}>
            <div className="text-2xl font-semibold">{result.verdict}</div>
            <p className="mt-2 text-sm leading-7">{result.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-sm text-muted">AI Detection</div>
              <div className={`mt-2 text-4xl font-semibold ${aiTheme?.tone}`}>{result.aiScore}/100</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel/80">
                <div className={`h-full ${aiTheme?.bar}`} style={{ width: `${result.aiScore}%` }} />
              </div>
            </div>

            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-sm text-muted">Patchwriting Risk</div>
              <div className={`mt-2 text-4xl font-semibold ${plagiarismTheme?.tone}`}>
                {result.plagiarismRisk}/100
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel/80">
                <div
                  className={`h-full ${plagiarismTheme?.bar}`}
                  style={{ width: `${result.plagiarismRisk}%` }}
                />
              </div>
            </div>

            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-sm text-muted">Citation Coverage</div>
              <div className={`mt-2 text-4xl font-semibold ${citationTheme?.tone}`}>
                {result.citationScore}/100
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel/80">
                <div
                  className={`h-full ${citationTheme?.bar}`}
                  style={{ width: `${result.citationScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="text-sm text-muted">Voice Consistency</div>
              <div className={`mt-2 text-4xl font-semibold ${voiceTheme?.tone}`}>
                {result.voiceScore}/100
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel/80">
                <div
                  className={`h-full ${voiceTheme?.bar}`}
                  style={{ width: `${result.voiceScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-border/70">
            <div className="flex flex-wrap gap-5">
              {(["overview", "sentences", "citations", "checklist"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-3 text-sm transition ${
                    activeTab === tab
                      ? "border-accent text-text"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {tab === "overview"
                    ? "Overview"
                    : tab === "sentences"
                      ? "Sentences"
                      : tab === "citations"
                        ? "Citations"
                        : "Checklist"}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-4">
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <h3 className="text-lg font-semibold text-text">What To Fix Before Submitting</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
                  {result.advice}
                </p>
              </div>

              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5 text-sm text-muted">
                {flaggedSentences} sentences flagged · {result.citationGaps.length} citation gaps ·{" "}
                {passedChecklistItems} checklist items passed
              </div>
            </div>
          ) : null}

          {activeTab === "sentences" ? (
            <div className="space-y-3">
              {result.sentences.map((sentence, index) => (
                <div
                  key={`${sentence.text.slice(0, 48)}-${index}`}
                  className={`rounded-2xl border-l-4 px-4 py-4 ${getRiskStyles(sentence.riskLevel)}`}
                >
                  <p className="text-sm leading-7">{sentence.text}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {sentence.aiFlag ? (
                      <Tag
                        label="AI"
                        reason={sentence.aiReason}
                        className="border-sky-400/30 bg-sky-400/10 text-sky-200"
                      />
                    ) : null}
                    {sentence.patchwritingFlag ? (
                      <Tag
                        label="Patchwriting"
                        reason={sentence.patchwritingReason}
                        className="border-violet-400/30 bg-violet-400/10 text-violet-200"
                      />
                    ) : null}
                    {sentence.citationFlag ? (
                      <Tag
                        label="Citation needed"
                        reason={sentence.citationReason}
                        className="border-orange-400/30 bg-orange-400/10 text-orange-200"
                      />
                    ) : null}
                    {sentence.voiceFlag ? (
                      <Tag
                        label="Voice shift"
                        reason={sentence.voiceReason}
                        className="border-slate-400/30 bg-slate-400/10 text-slate-200"
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "citations" ? (
            <div className="space-y-4">
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <h3 className="text-lg font-semibold text-text">
                  Citation Gaps Found — {result.citationGaps.length} claims need citations
                </h3>
                <p className="mt-2 text-sm text-muted">
                  UMGC requires APA format for all factual claims.
                </p>
              </div>

              {result.citationGaps.length > 0 ? (
                result.citationGaps.map((gap, index) => (
                  <div
                    key={`${gap.sentence.slice(0, 48)}-${index}`}
                    className="rounded-card border border-border/70 bg-panelAlt/55 p-5"
                  >
                    <p className="text-sm leading-7 text-text">{gap.sentence}</p>
                    <p className="mt-3 text-sm text-muted">
                      Suggested format: {gap.suggestedCitation}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Find the original source and add a proper APA citation before submitting
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-card border border-emerald-400/35 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                  All claims appear properly cited ✓
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "checklist" ? (
            <div className="space-y-4">
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <h3 className="text-lg font-semibold text-text">Pre-Submission Checklist</h3>
                <p className="mt-2 text-sm text-muted">
                  All 6 items must pass before submitting to UMGC
                </p>
              </div>

              {result.preSubmissionChecklist.map((item) => (
                <div
                  key={item.item}
                  className={`rounded-card border p-5 ${
                    item.passed
                      ? "border-border/70 bg-panelAlt/55"
                      : "border-amber-400/35 bg-amber-400/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={item.passed ? "text-emerald-300" : "text-rose-300"}>
                      {item.passed ? "✓" : "✗"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text">{item.item}</div>
                      <p className="mt-2 text-sm leading-7 text-muted">{item.note}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div
                className={`rounded-card border p-5 text-sm font-medium ${
                  allChecksPassed
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/35 bg-rose-500/10 text-rose-200"
                }`}
              >
                {allChecksPassed
                  ? "All checks passed — You are clear to submit"
                  : "Fix the flagged items above before submitting to UMGC"}
              </div>
            </div>
          ) : null}

          <div className="flex justify-start">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-amber-400/35 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300/45 hover:bg-amber-500/15"
            >
              Scan Again After Rewriting
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}
