"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type ScanSentence = {
  text: string;
  score: number;
  flagged: boolean;
};

type ScanResults = {
  score: number;
  verdict: "Human" | "Mixed" | "AI-Generated";
  sentences: ScanSentence[];
};

type ScanSuccessPayload = { ok: true } & ScanResults;
type ScanErrorPayload = { ok: false; error?: string; details?: string };

function getScoreTheme(score: number) {
  if (score < 20) {
    return {
      tone: "text-emerald-300",
      border: "border-emerald-400/30",
      bg: "bg-emerald-500/10",
      progress: "bg-emerald-400",
      label: "Reads as Human Writing ✓",
    };
  }

  if (score < 60) {
    return {
      tone: "text-amber-300",
      border: "border-amber-400/30",
      bg: "bg-amber-500/10",
      progress: "bg-amber-400",
      label: "Mixed — Some sections need rewriting",
    };
  }

  return {
    tone: "text-rose-300",
    border: "border-rose-400/30",
    bg: "bg-rose-500/10",
    progress: "bg-rose-400",
    label: "AI-Generated — Must rewrite before submitting",
  };
}

function getAdvice(verdict: ScanResults["verdict"]) {
  if (verdict === "Human") {
    return "Your writing reads as authentically yours. You are clear to submit.";
  }

  if (verdict === "Mixed") {
    return "Some sections were flagged. Rewrite the highlighted sentences in your own words, using your own examples and phrasing. Do not paraphrase — completely reconstruct.";
  }

  return "This writing will likely be flagged by UMGC's detection tools. Do not submit this. Go back to Professor Scholar's Assignment mode, share your ideas only — not full drafts — and write the final version entirely yourself.";
}

export function WritingScanner() {
  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
  }, [text]);

  const characterCount = text.length;
  const flaggedCount = useMemo(
    () => results?.sentences.filter((sentence) => sentence.flagged).length ?? 0,
    [results],
  );

  const scoreTheme = results ? getScoreTheme(results.score) : null;

  async function handleScan() {
    if (text.trim().length < 50 || isScanning) {
      return;
    }

    setIsScanning(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/gptzero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const payload = (await response.json()) as ScanSuccessPayload | ScanErrorPayload;

      if (!response.ok || !payload.ok) {
        const errorPayload = payload as ScanErrorPayload;

        throw new Error(
          [errorPayload.error, errorPayload.details].filter(Boolean).join(": ") ||
            "Writing scan failed.",
        );
      }

      setResults({
        score: payload.score,
        verdict: payload.verdict,
        sentences: payload.sentences,
      });
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "The writing scan failed. Try again in a moment.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  function handleClear() {
    setText("");
    setResults(null);
    setError(null);
    textareaRef.current?.focus();
  }

  function handleRescan() {
    setResults(null);
    setError(null);
    textareaRef.current?.focus();
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  return (
    <section className="rounded-card border border-border/70 bg-panel/80 p-6 shadow-card">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Academic Integrity</div>
        <h2 className="mt-3 text-3xl font-semibold text-text">Academic Writing Scanner</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          Paste your writing below before submitting to UMGC. Professor Scholar will
          flag anything that reads as AI-generated so you can rewrite it in your own
          voice.
        </p>
      </div>

      <div className="mt-6 rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your discussion post, essay, or assignment here before submitting to UMGC..."
          className="min-h-[200px] w-full resize-none rounded-3xl border border-border/70 bg-panel/70 px-4 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
        />

        <div className="mt-3 text-sm text-muted">{characterCount} characters</div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleScan()}
            disabled={isScanning || text.trim().length < 50}
            className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:border-border disabled:bg-panel disabled:text-muted"
          >
            {isScanning ? "Scanning..." : "Scan My Writing"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-border/70 bg-panel/60 px-5 py-2 text-sm font-semibold text-muted transition hover:border-accent/35 hover:text-text"
          >
            Clear
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-card border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {results && scoreTheme ? (
        <div className="mt-6 space-y-6">
          <div className={`rounded-card border p-5 ${scoreTheme.border} ${scoreTheme.bg}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={`text-5xl font-semibold ${scoreTheme.tone}`}>
                  {results.score.toFixed(0)}
                </div>
                <div className={`mt-2 text-sm font-medium ${scoreTheme.tone}`}>
                  {scoreTheme.label}
                </div>
              </div>
              <div className="w-full max-w-xl">
                <div className="h-3 overflow-hidden rounded-full bg-panel/80">
                  <div
                    className={`h-full rounded-full transition-all ${scoreTheme.progress}`}
                    style={{ width: `${Math.min(100, Math.max(0, results.score))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text">Sentence-by-Sentence Breakdown</h3>
                <p className="mt-1 text-sm text-muted">
                  {flaggedCount} sentences flagged out of {results.sentences.length} total
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {results.sentences.map((sentence, index) => (
                <div
                  key={`${sentence.text.slice(0, 32)}-${index}`}
                  className={`rounded-2xl border-l-4 px-4 py-4 ${
                    sentence.flagged
                      ? "border-l-rose-400 bg-rose-500/10 text-text"
                      : "border-l-border bg-panel/60 text-muted"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <p className={`text-sm leading-7 ${sentence.flagged ? "text-text" : "text-muted"}`}>
                      {sentence.text}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                        {sentence.score.toFixed(0)}%
                      </span>
                      {sentence.flagged ? (
                        <span className="rounded-full border border-rose-400/35 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">
                          Rewrite this
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
            <h3 className="text-lg font-semibold text-text">Advice</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{getAdvice(results.verdict)}</p>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleRescan}
              className="rounded-full border border-amber-400/35 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300/45 hover:bg-amber-500/15"
            >
              Scan Again After Rewriting
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
