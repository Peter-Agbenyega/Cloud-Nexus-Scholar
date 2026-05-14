"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { TutorPanel } from "@/components/tutor-panel";
import { LibraryEntry, readLibraryEntries, writeLibraryEntries } from "@/lib/app-state";

type ScholarCopilotPanelProps = {
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
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};
type SearchType = "concept" | "definition" | "example" | "news" | "paper" | "documentation";
type SearchResult = {
  query: string;
  answer: string;
  sources: string[];
  searchType: SearchType;
};

const quickActions: { label: string; mode: GptMode; prompt: (topic: string) => string }[] = [
  {
    label: "Explain like I'm 10",
    mode: "simplify",
    prompt: (topic) => `Explain ${topic} like I'm 10 years old. Use simple analogies.`,
  },
  {
    label: "Real-world example",
    mode: "alternative",
    prompt: (topic) => `Give me a real-world production example of ${topic} in cloud/security.`,
  },
  {
    label: "Show cloud/security risk",
    mode: "explain",
    prompt: (topic) => `What are the cloud or security risks related to ${topic}? Give practical examples.`,
  },
  {
    label: "Diagram outline",
    mode: "explain",
    prompt: (topic) => `Outline a diagram for ${topic} — describe the components, connections, and data flow as a structured text diagram.`,
  },
  {
    label: "Challenge me",
    mode: "challenge",
    prompt: (topic) => topic,
  },
];

const searchTypeOptions: { label: string; value: SearchType }[] = [
  { label: "Concept", value: "concept" },
  { label: "Definition", value: "definition" },
  { label: "Real Example", value: "example" },
  { label: "Latest News", value: "news" },
  { label: "Academic Paper", value: "paper" },
  { label: "Official Docs", value: "documentation" },
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ScholarCopilotPanel({
  courseCode,
  topicTitle,
  courseName,
  unitContext,
  initialSilentContext,
  pendingPrompt,
  onPendingPromptHandled,
}: ScholarCopilotPanelProps) {
  // --- Main chat (GPT/OpenAI) state ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatRows, setChatRows] = useState(1);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // --- Source search (Perplexity) state ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("concept");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedResearch, setSavedResearch] = useState(false);

  // --- Deep review (Claude) state ---
  const [deepReviewOpen, setDeepReviewOpen] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatLoading, chatMessages]);

  // Handle pending prompts from parent (assignment coaching etc.)
  // These go to Claude deep review since they use /api/tutor modes
  useEffect(() => {
    if (pendingPrompt) {
      setDeepReviewOpen(true);
    }
  }, [pendingPrompt]);

  // --- Main chat (GPT/OpenAI) ---
  async function streamChatMessage(prompt: string, mode: GptMode) {
    const trimmed = prompt.trim();
    if (!trimmed || chatLoading) return;

    const nextMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: trimmed, timestamp: new Date() },
    ];
    setChatMessages([...nextMessages, { role: "assistant", content: "", timestamp: new Date() }]);
    setChatInput("");
    setChatRows(1);
    setChatLoading(true);

    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          courseCode,
          topicTitle,
          mode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat response failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

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
              setChatMessages((current) => {
                if (current.length === 0) return current;
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
        error instanceof Error ? error.message : "The request failed. Try again in a moment.";
      setChatMessages((current) => {
        if (current.length === 0) return current;
        const updated = [...current];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Something went wrong.\n\n${message}`,
          timestamp: new Date(),
        };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  }

  // --- Source search (Perplexity) ---
  async function submitSearch(queryOverride?: string, typeOverride?: SearchType) {
    const nextQuery = (queryOverride ?? searchQuery).trim();
    const nextType = typeOverride ?? searchType;
    if (!nextQuery || searchLoading) return;

    setSearchLoading(true);
    setSearchError(null);
    setSavedResearch(false);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery, courseCode, searchType: nextType }),
      });

      const data = (await response.json()) as { answer: string; sources: string[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Search failed.");

      setSearchQuery(nextQuery);
      setSearchType(nextType);
      setSearchResult({ query: nextQuery, answer: data.answer, sources: data.sources, searchType: nextType });
    } catch (error) {
      setSearchResult(null);
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  }

  function saveResearchResult() {
    if (!searchResult || typeof window === "undefined") return;

    try {
      const nextEntry: LibraryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: searchResult.query,
        courseCode,
        topic: topicTitle,
        content: `${searchResult.answer}\n\nSources:\n${searchResult.sources.join("\n")}`,
        tags: ["research", searchResult.searchType, courseCode, topicTitle],
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

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void streamChatMessage(chatInput, "explain");
  }

  function handleChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void streamChatMessage(chatInput, "explain");
    }
  }

  return (
    <section className="w-full rounded-card border border-border/70 bg-panel/90 shadow-card">
      {/* Header */}
      <div className="border-b border-border/70 px-5 py-4">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Scholar Copilot</div>
        <div className="mt-1 text-sm text-muted">
          Ask once. Use source support when needed. Send complex answers to deep review.
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-border/70 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => void streamChatMessage(action.prompt(topicTitle), action.mode)}
              disabled={chatLoading}
              className="rounded-full border border-border/70 bg-panelAlt/50 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              searchOpen
                ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                : "border-border/70 bg-panelAlt/50 text-muted hover:border-sky-400/35 hover:text-sky-200"
            }`}
          >
            Find sources
          </button>
          <button
            type="button"
            onClick={() => setDeepReviewOpen((prev) => !prev)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              deepReviewOpen
                ? "border-violet-400/50 bg-violet-400/10 text-violet-200"
                : "border-border/70 bg-panelAlt/50 text-muted hover:border-violet-400/35 hover:text-violet-200"
            }`}
          >
            Deep review with Claude
          </button>
        </div>
      </div>

      {/* Main Chat Area (GPT/OpenAI) */}
      <div>
        <div className="px-5 pt-3 text-xs text-muted">
          Study chat · {chatMessages.length} messages
        </div>

        <div ref={chatScrollRef} className="max-h-[500px] space-y-4 overflow-y-auto px-5 py-5">
          {chatMessages.length === 0 && !chatLoading ? (
            <div className="py-8 text-center text-sm text-muted">
              Ask about {topicTitle}, your assignments, labs, or any cloud/cyber concept.
            </div>
          ) : null}

          {chatMessages.map((message, index) => (
            <div
              key={`${message.timestamp.toISOString()}-${index}`}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div className="max-w-3xl">
                {message.role === "assistant" ? (
                  <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">
                    Scholar Copilot
                  </div>
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

          {chatLoading ? (
            <div className="flex justify-start">
              <div className="rounded-3xl border border-border/70 bg-panelAlt/80 px-4 py-3">
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">
                  Scholar Copilot
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleChatSubmit} className="border-t border-border/70 px-5 py-4">
          <textarea
            value={chatInput}
            onChange={(event) => {
              const nextValue = event.target.value;
              setChatInput(nextValue);
              setChatRows(Math.min(4, Math.max(1, nextValue.split("\n").length)));
            }}
            onKeyDown={handleChatKeyDown}
            rows={chatRows}
            placeholder={`Ask about this topic, assignment, lab, or cloud/cyber concept…`}
            className="min-h-[52px] w-full resize-none rounded-3xl border border-border/70 bg-panelAlt/60 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="text-xs text-muted">Shift + Enter for a new line. Enter sends.</div>
            <button
              type="submit"
              disabled={chatLoading || chatInput.trim().length === 0}
              className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Source Support Card (Perplexity) — only visible when toggled */}
      {searchOpen ? (
        <div className="border-t border-sky-400/20">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-sky-300">
                  Source Support
                </div>
                <div className="mt-1 text-xs text-muted">
                  Find cited research and official sources. Research requests may use external search API credits.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted transition hover:text-text"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitSearch();
              }}
              className="mt-4 rounded-3xl border border-border/70 bg-panelAlt/55 p-4"
            >
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search for real data, papers, documentation..."
                className="w-full rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-sky-400/50"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {searchTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSearchType(option.value)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      searchType === option.value
                        ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                        : "border-border/70 bg-panel/70 text-muted hover:border-sky-400/35 hover:text-text"
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
                  className="rounded-full border border-sky-400 bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
                >
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            {searchError ? (
              <div className="mt-4 rounded-3xl border border-rose-400/35 bg-rose-500/10 p-5 text-sm text-rose-200">
                {searchError}
              </div>
            ) : null}

            {searchResult ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-text">
                    {searchResult.answer}
                  </div>
                </div>

                {searchResult.sources.length > 0 ? (
                  <div className="rounded-3xl border border-border/70 bg-panelAlt/55 p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">Sources</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {searchResult.sources.map((source) => (
                        <a
                          key={source}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border/70 bg-panel/70 px-3 py-1 text-xs text-text transition hover:border-sky-400/35"
                        >
                          {source}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveResearchResult}
                    className="rounded-full border border-sky-400 bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400/90"
                  >
                    Save to Library
                  </button>
                  {savedResearch ? (
                    <span className="text-sm text-emerald-300">Saved.</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Deep Review with Claude — only visible when toggled */}
      {deepReviewOpen ? (
        <div className="border-t border-violet-400/20">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-violet-300">
                  Claude Deep Review
                </div>
                <div className="mt-1 text-xs text-muted">
                  Use after your first answer for deeper reasoning, academic critique, or professor-style feedback.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeepReviewOpen(false)}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted transition hover:text-text"
              >
                Close
              </button>
            </div>
          </div>
          <div className="px-5 pb-5">
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
        </div>
      ) : null}
    </section>
  );
}
