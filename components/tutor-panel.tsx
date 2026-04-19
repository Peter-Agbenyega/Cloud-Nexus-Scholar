"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  appendActivityEvent,
  getProfessorStorageKeys,
  PROFESSOR_SESSION_EVENT,
  QUIZ_COMPLETE_EVENT,
  TutorMessage,
  TutorMode,
  writeTutorMessages,
  readTutorMessages,
} from "@/lib/app-state";

type TutorPanelProps = {
  courseCode: string;
  courseName: string;
  topicTitle: string;
  initialMode?: TutorMode;
};

type MessageWithDate = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const modeTabs: { label: string; value: TutorMode }[] = [
  { label: "Tutor", value: "tutor" },
  { label: "Professor Mode", value: "professor" },
  { label: "Quiz", value: "quiz" },
  { label: "Assignment Help", value: "assignment" },
];

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function serializeMessages(messages: MessageWithDate[]): TutorMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
  }));
}

function hydrateMessages(messages: TutorMessage[]): MessageWithDate[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp),
  }));
}

function extractConfidenceScore(input: string) {
  const matches = input.match(/\b([1-9]|10)\b/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  const lastValue = Number(matches[matches.length - 1]);
  return Number.isFinite(lastValue) ? lastValue : null;
}

function extractQuizScore(output: string) {
  const matches = output.match(/(\d+(?:\.\d+)?)\s*\/\s*10/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  const score = Number(matches[matches.length - 1].split("/")[0].trim());
  return Number.isFinite(score) ? score : null;
}

export function TutorPanel({
  courseCode,
  courseName,
  topicTitle,
  initialMode = "tutor",
}: TutorPanelProps) {
  const [messages, setMessages] = useState<MessageWithDate[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<TutorMode>(initialMode);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [draftRows, setDraftRows] = useState(1);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const existingMessages = hydrateMessages(readTutorMessages(courseCode, topicTitle));

      if (existingMessages.length > 0) {
        setMessages(existingMessages);
      }
    } catch {}

    setHasLoadedHistory(true);
  }, [courseCode, topicTitle]);

  useEffect(() => {
    if (!hasLoadedHistory || typeof window === "undefined") {
      return;
    }

    try {
      if (messages.length > 0) {
        writeTutorMessages(courseCode, topicTitle, serializeMessages(messages));
      }
    } catch {}
  }, [courseCode, hasLoadedHistory, messages, topicTitle]);

  useEffect(() => {
    if (!hasLoadedHistory || messages.length > 0 || isLoading) {
      return;
    }

    const opener = `Peter has just opened the topic '${topicTitle}' in ${courseCode} — ${courseName}.
Greet him briefly by name, acknowledge the topic, and ask what aspect he wants
to tackle first. Keep the greeting to 2-3 sentences maximum.`;

    void sendMessage(opener, {
      silentUserMessage: true,
      modeOverride: initialMode,
      activityLabel: `Opened tutor for ${topicTitle}`,
    });
  }, [courseCode, courseName, hasLoadedHistory, initialMode, isLoading, messages.length, topicTitle]);

  useEffect(() => {
    if (!scrollAreaRef.current) {
      return;
    }

    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages, isLoading]);

  async function sendMessage(
    content: string,
    options?: {
      silentUserMessage?: boolean;
      modeOverride?: TutorMode;
      activityLabel?: string;
    },
  ) {
    const trimmed = content.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const modeToUse = options?.modeOverride ?? activeMode;
    const now = new Date();
    const nextMessages = options?.silentUserMessage
      ? [...messages]
      : [...messages, { role: "user" as const, content: trimmed, timestamp: now }];

    if (!options?.silentUserMessage) {
      setMessages(nextMessages);
      appendActivityEvent(options?.activityLabel ?? `Asked Prof. Scholar about ${topicTitle}`, courseCode);
    } else if (options?.activityLabel) {
      appendActivityEvent(options.activityLabel, courseCode);
    }

    setInput("");
    setDraftRows(1);
    setIsLoading(true);

    const assistantMessage = {
      role: "assistant" as const,
      content: "",
      timestamp: new Date(),
    };

    setMessages([...nextMessages, assistantMessage]);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            ...(options?.silentUserMessage ? [{ role: "user" as const, content: trimmed }] : []),
          ],
          courseCode,
          courseName,
          topicTitle,
          mode: modeToUse,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Tutor response failed.");
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

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
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
              setMessages((currentMessages) => {
                if (currentMessages.length === 0) {
                  return currentMessages;
                }

                const updatedMessages = [...currentMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];

                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  content: assistantText,
                };

                return updatedMessages;
              });
            }
          } catch {
            // Skip unparseable SSE lines.
          }
        }
      }

      const remainder = buffer.trim();

      if (remainder.startsWith("data: ")) {
        const data = remainder.slice(6).trim();

        if (data !== "[DONE]") {
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
              setMessages((currentMessages) => {
                if (currentMessages.length === 0) {
                  return currentMessages;
                }

                const updatedMessages = [...currentMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];

                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  content: assistantText,
                };

                return updatedMessages;
              });
            }
          } catch {
            // Skip unparseable SSE lines.
          }
        }
      }

      if (modeToUse === "professor" && !options?.silentUserMessage) {
        const confidence = extractConfidenceScore(trimmed);

        if (confidence !== null && typeof window !== "undefined") {
          const keys = getProfessorStorageKeys(courseCode, topicTitle);

          try {
            window.dispatchEvent(
              new CustomEvent(PROFESSOR_SESSION_EVENT, {
                detail: { confidence },
              }),
            );
            window.localStorage.setItem(keys.confidence, String(confidence));
          } catch {}
        }
      }

      if (modeToUse === "quiz" && typeof window !== "undefined") {
        const score = extractQuizScore(assistantText);

        if (score !== null) {
          window.dispatchEvent(
            new CustomEvent(QUIZ_COMPLETE_EVENT, {
              detail: { score },
            }),
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "The tutor session failed. Try again in a moment.";

      setMessages((currentMessages) => {
        if (currentMessages.length === 0) {
          return currentMessages;
        }

        const updatedMessages = [...currentMessages];
        updatedMessages[updatedMessages.length - 1] = {
          role: "assistant",
          content: `I hit a problem reaching the tutor service.\n\n${errorMessage}`,
          timestamp: new Date(),
        };

        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleQuickAction(mode: TutorMode, prompt: string) {
    setActiveMode(mode);
    void sendMessage(prompt, {
      modeOverride: mode,
      activityLabel: `${mode === "quiz" ? "Started quiz" : "Used quick action"} for ${topicTitle}`,
    });
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <section className="w-full rounded-card border border-border/70 bg-panel/90 shadow-card">
      <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent">Prof. Scholar</div>
          <div className="mt-1 text-sm text-muted">
            Private tutor for {courseCode} and this topic thread.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {modeTabs.map((tab) => {
            const isActive = tab.value === activeMode;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveMode(tab.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border/70 bg-panelAlt/60 text-muted hover:border-accent/35 hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeMode === "assignment" ? (
        <div className="mx-5 mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <p className="text-xs text-amber-300">
            When your draft is ready,{" "}
            <a href="/library" className="underline underline-offset-2">
              run the full integrity scan in your Library
            </a>
            {" "}before submitting to UMGC. AI detection + patchwriting check + citation gaps +
            voice consistency — all in one scan.
          </p>
        </div>
      ) : null}

      <div className="px-5 pt-3 text-xs text-muted">Session: {messages.length} messages</div>

      <div ref={scrollAreaRef} className="max-h-[500px] space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp.toISOString()}-${index}`}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div className="max-w-3xl">
              {message.role === "assistant" ? (
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">
                  Prof. Scholar
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

        {isLoading ? (
          <div className="flex justify-start">
            <div className="rounded-3xl border border-border/70 bg-panelAlt/80 px-4 py-3">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">
                Prof. Scholar
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

      <form onSubmit={handleSubmit} className="border-t border-border/70 px-5 py-4">
        <textarea
          value={input}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInput(nextValue);
            const estimatedRows = Math.min(4, Math.max(1, nextValue.split("\n").length));
            setDraftRows(estimatedRows);
          }}
          onKeyDown={handleTextareaKeyDown}
          rows={draftRows}
          placeholder={`Ask Prof. Scholar about ${topicTitle}...`}
          className="min-h-[52px] w-full resize-none rounded-3xl border border-border/70 bg-panelAlt/60 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-xs text-muted">
            Shift + Enter for a new line. Enter sends.
          </div>
          <button
            type="submit"
            disabled={isLoading || input.trim().length === 0}
            className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:border-border disabled:bg-panelAlt disabled:text-muted"
          >
            Send
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleQuickAction("tutor", `Explain ${topicTitle} to me as my tutor`)
            }
            className="rounded-full border border-border/70 bg-panelAlt/50 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
          >
            Explain this topic
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                "professor",
                `Professor mode: help me prepare to lecture on ${topicTitle}`,
              )
            }
            className="rounded-full border border-border/70 bg-panelAlt/50 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
          >
            Professor Mode
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("quiz", `Generate my quiz for ${topicTitle}`)}
            className="rounded-full border border-border/70 bg-panelAlt/50 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
          >
            Quiz me
          </button>
        </div>
      </form>
    </section>
  );
}
