"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { TutorPanel } from "@/components/tutor-panel";
import { LibraryEntry, readLibraryEntries, writeLibraryEntries } from "@/lib/app-state";

type ThreeBrainPanelProps = {
  courseCode: string;
  topicTitle: string;
  courseName?: string;
  unitContext?: string;
  initialSilentContext?: string;
  pendingPrompt?: {
    id: string;
    content: string;
    mode?: "assignment" | "discussion" | "quiz";
  } | null;
  onPendingPromptHandled?: () => void;
};

type GptMode = "explain" | "alternative" | "simplify" | "challenge";
type BrainTab = "claude" | "gpt" | "search";
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};
type SearchType = "concept" | "definition" | "example" | "news" | "paper" | "documentation";
type SearchResult = {
  answer: string;
  sources: string[];
};

const gptQuickActions: { label: string; mode: GptMode }[] = [
  { label: "Explain this differently", mode: "alternative" },
  { label: "Give me an analogy", mode: "alternative" },
  { label: "Simplify to basics", mode: "simplify" },
  { label: "Challenge my understanding", mode: "challenge" },
];

const searchTypeOptions: { label: string; value: SearchType }[] = [
  { label: "Concept", value: "concept" },
  { label: "Definition", value: "definition" },
  { label: "Real Example", value: "example" },
  { label: "Latest News", value: "news" },
  { label: "Academic Paper", value: "paper" },
  { label: "Official Docs", value: "documentation" },
];

const quickSuggestions = [
  "NIST SP 800-145 cloud definition",
  "AWS IAM best practices 2026",
  "Cloud service models comparison",
  "Zero trust architecture",
  "Kubernetes security hardening",
  "Cloud cost optimization strategies",
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ThreeBrainPanel({
  courseCode,
  topicTitle,
  courseName,
  unitContext,
  initialSilentContext,
  pendingPrompt,
  onPendingPromptHandled,
}: ThreeBrainPanelProps) {
  const [activeTab, setActiveTab] = useState<BrainTab>("claude");
  const [gptMessages, setGptMessages] = useState<ChatMessage[]>([]);
  const [gptInput, setGptInput] = useState("");
  const [gptRows, setGptRows] = useState(1);
  const [gptLoading, setGptLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("concept");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedResearch, setSavedResearch] = useState(false);
  const gptScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!gptScrollRef.current) {
      return;
    }

    gptScrollRef.current.scrollTop = gptScrollRef.current.scrollHeight;
  }, [gptLoading, gptMessages]);

  async function streamGptMessage(prompt: string, mode: GptMode) {
    const trimmed = prompt.trim();

    if (!trimmed || gptLoading) {
      return;
    }

    const nextMessages = [...gptMessages, { role: "user" as const, content: trimmed, timestamp: new Date() }];
    setGptMessages([...nextMessages, { role: "assistant", content: "", timestamp: new Date() }]);
    setGptInput("");
    setGptRows(1);
    setGptLoading(true);

    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          courseCode,
          topicTitle,
          mode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("GPT-4o response failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };

            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta" &&
              parsed.delta.text
            ) {
              assistantText += parsed.delta.text;
              setGptMessages((current) => {
                if (current.length === 0) {
                  return current;
                }

                const updated = [...current];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: assistantText,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed SSE lines.
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The GPT-4o request failed. Try again in a moment.";

      setGptMessages((current) => {
        if (current.length === 0) {
          return current;
        }

        const updated = [...current];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `I hit a problem reaching GPT-4o.\n\n${message}`,
          timestamp: new Date(),
        };
        return updated;
      });
    } finally {
      setGptLoading(false);
    }
  }

  async function submitSearch(queryOverride?: string, typeOverride?: SearchType) {
    const nextQuery = (queryOverride ?? searchQuery).trim();
    const nextType = typeOverride ?? searchType;

    if (!nextQuery || searchLoading) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSavedResearch(false);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: nextQuery,
          courseCode,
          searchType: nextType,
        }),
      });

      const data = (await response.json()) as SearchResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setSearchQuery(nextQuery);
      setSearchType(nextType);
      setSearchResult({
        answer: data.answer,
        sources: data.sources,
      });
    } catch (error) {
      setSearchResult(null);
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  }

  function saveResearchResult() {
    if (!searchResult || typeof window === "undefined") {
      return;
    }

    try {
      const nextEntry: LibraryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: searchQuery,
        courseCode,
        topic: topicTitle,
        content: `${searchResult.answer}\n\nSources:\n${searchResult.sources.join("\n")}`,
        tags: ["research", searchType, topicTitle],
        type: "research",
        createdAt: new Date().toISOString(),
      };
      const nextEntries = [nextEntry, ...readLibraryEntries()];
      writeLibraryEntries(nextEntries);
      setSavedResearch(true);
    } catch {
      setSavedResearch(false);
    }
  }

  function handleGptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void streamGptMessage(gptInput, "explain");
  }

  function handleGptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void streamGptMessage(gptInput, "explain");
    }
  }

  return (
    <section className="w-full rounded-card border border-border/70 bg-panel/90 shadow-card">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Three Brain System</div>
        <div className="mt-1 text-sm text-muted">
          Claude for deep reasoning · GPT-4o for alternative explanations · Live Search for real
          data
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["claude", "Prof. Scholar (Claude)"],
            ["gpt", "GPT-4o Second Opinion"],
            ["search", "Live Research Search"],
          ].map(([value, label]) => {
            const isActive = activeTab === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as BrainTab)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border/70 bg-panelAlt/60 text-muted hover:border-accent/35 hover:text-text"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "claude" ? (
        <div className="p-5">
          <TutorPanel
            courseCode={courseCode}
            courseName={courseName ?? courseCode}
            topicTitle={topicTitle}
            unitContext={unitContext}
            initialSilentContext={initialSilentContext}
            pendingPrompt={pendingPrompt}
            onPendingPromptHandled={onPendingPromptHandled}
          />
        </div>
      ) : null}

      {activeTab === "gpt" ? (
        <div>
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {gptQuickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void streamGptMessage(topicTitle, action.mode)}
                  className="rounded-full border border-border/70 bg-panelAlt/50 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pt-3 text-xs text-muted">Session: {gptMessages.length} messages</div>

          <div ref={gptScrollRef} className="max-h-[500px] space-y-4 overflow-y-auto px-5 py-5">
            {gptMessages.map((message, index) => (
              <div
                key={`${message.timestamp.toISOString()}-${index}`}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div className="max-w-3xl">
                  {message.role === "assistant" ? (
                    <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">GPT-4o</div>
                  ) : null}

                  <div
                    className={`rounded-3xl border px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "border-border/70 bg-slate-900/80 text-text"
                        : "border-border/70 bg-panelAlt/80 text-text"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>

                  <div
                    className={`mt-1 text-xs text-muted ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {gptLoading ? (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-border/70 bg-panelAlt/80 px-4 py-3">
                  <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">GPT-4o</div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleGptSubmit} className="border-t border-border/70 px-5 py-4">
            <textarea
              value={gptInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setGptInput(nextValue);
                setGptRows(Math.min(4, Math.max(1, nextValue.split("\n").length)));
              }}
              onKeyDown={handleGptKeyDown}
              rows={gptRows}
              placeholder={`Ask GPT-4o for a second opinion on ${topicTitle}...`}
              className="min-h-[52px] w-full resize-none rounded-3xl border border-border/70 bg-panelAlt/60 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="text-xs text-muted">Shift + Enter for a new line. Enter sends.</div>
              <button
                type="submit"
                disabled={gptLoading || gptInput.trim().length === 0}
                className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {activeTab === "search" ? (
        <div className="p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitSearch();
            }}
            className="rounded-3xl border border-border/70 bg-panelAlt/55 p-4"
          >
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for real data, papers, documentation..."
              className="w-full rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSearchType(option.value)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    searchType === option.value
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border/70 bg-panel/70 text-muted hover:border-accent/35 hover:text-text"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={searchLoading || searchQuery.trim().length === 0}
                className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
              >
                Search
              </button>
            </div>
          </form>

          {!searchResult && !searchLoading && !searchError ? (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Quick Searches</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      void submitSearch(suggestion, "concept");
                    }}
                    className="rounded-full border border-border/70 bg-panelAlt/60 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {searchLoading ? (
            <div className="mt-5 rounded-3xl border border-border/70 bg-panelAlt/55 p-5 text-sm text-muted">
              Searching real sources...
            </div>
          ) : null}

          {searchError ? (
            <div className="mt-5 rounded-3xl border border-rose-400/35 bg-rose-500/10 p-5 text-sm text-rose-200">
              {searchError}
            </div>
          ) : null}

          {searchResult ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
                <div className="whitespace-pre-wrap text-sm leading-7 text-text">{searchResult.answer}</div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Sources</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {searchResult.sources.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border/70 bg-panel/70 px-3 py-1 text-xs text-text transition hover:border-accent/35"
                    >
                      {source}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveResearchResult}
                  className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                >
                  Save to Library
                </button>
                {savedResearch ? <span className="text-sm text-emerald-300">Saved.</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
