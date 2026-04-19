"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { WritingScanner } from "@/components/writing-scanner";
import {
  appendActivityEvent,
  getAllCourseOptions,
  LibraryEntry,
  LibraryEntryType,
  readLibraryEntries,
  writeLibraryEntries,
} from "@/lib/app-state";

const libraryFilters: { label: string; value: "all" | LibraryEntryType }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Professor Sessions", value: "professor-session" },
  { label: "Quiz Reviews", value: "quiz-review" },
  { label: "Saved Drafts", value: "saved-draft" },
];

const typeLabels: Record<LibraryEntryType, string> = {
  note: "Notes",
  "professor-session": "Professor Session",
  "quiz-review": "Quiz Review",
  "saved-draft": "Saved Draft",
};

export default function LibraryPage() {
  const courseOptions = useMemo(() => getAllCourseOptions(), []);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | LibraryEntryType>("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    courseCode: courseOptions[0]?.code ?? "CLCS 605",
    topic: "",
    content: "",
    tags: "",
    type: "note" as LibraryEntryType,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setEntries(readLibraryEntries());
    } catch {
      setEntries([]);
    }
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter = activeFilter === "all" ? true : entry.type === activeFilter;
      const haystack = [
        entry.title,
        entry.courseCode,
        entry.topic,
        entry.content,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (query.length === 0 || haystack.includes(query));
    });
  }, [activeFilter, entries, searchTerm]);

  function handleSaveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = formState.title.trim();
    const trimmedTopic = formState.topic.trim();
    const trimmedContent = formState.content.trim();

    if (!trimmedTitle || !trimmedTopic || !trimmedContent) {
      return;
    }

    const nextEntry: LibraryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmedTitle,
      courseCode: formState.courseCode,
      topic: trimmedTopic,
      content: trimmedContent,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      type: formState.type,
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...entries];
    setEntries(nextEntries);
    writeLibraryEntries(nextEntries);
    appendActivityEvent(`Saved library entry: ${trimmedTitle}`, formState.courseCode);
    setFormState({
      title: "",
      courseCode: formState.courseCode,
      topic: "",
      content: "",
      tags: "",
      type: "note",
    });
    setShowForm(false);
  }

  function handleDeleteEntry(id: string, courseCode: string) {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    setEntries(nextEntries);
    writeLibraryEntries(nextEntries);
    appendActivityEvent("Deleted library entry", courseCode);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Library</div>
            <h1 className="mt-3 text-4xl font-semibold text-text">Your Knowledge Library</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
              Store working notes, professor-mode reflections, quiz reviews, and strong draft
              fragments in one private retrieval layer built around Peter&apos;s actual coursework.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((currentValue) => !currentValue)}
            className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
          >
            Add Note
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search your notes, topics, tags, and saved drafts"
            className="w-full rounded-3xl border border-border/70 bg-panelAlt/60 px-4 py-3 text-sm text-text outline-none transition focus:border-accent lg:max-w-xl"
          />

          <div className="flex flex-wrap gap-2">
            {libraryFilters.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border/70 bg-panelAlt/50 text-muted hover:border-accent/35 hover:text-text"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {showForm ? (
          <form
            onSubmit={handleSaveEntry}
            className="mt-6 grid gap-4 rounded-card border border-border/70 bg-panelAlt/60 p-5"
          >
            <input
              value={formState.title}
              onChange={(event) =>
                setFormState((currentState) => ({ ...currentState, title: event.target.value }))
              }
              placeholder="Title"
              className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={formState.courseCode}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    courseCode: event.target.value,
                  }))
                }
                className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
              >
                {courseOptions.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} — {course.title}
                  </option>
                ))}
              </select>

              <select
                value={formState.type}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    type: event.target.value as LibraryEntryType,
                  }))
                }
                className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
              >
                {libraryFilters
                  .filter((filter) => filter.value !== "all")
                  .map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
              </select>
            </div>

            <input
              value={formState.topic}
              onChange={(event) =>
                setFormState((currentState) => ({ ...currentState, topic: event.target.value }))
              }
              placeholder="Topic"
              className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />

            <textarea
              value={formState.content}
              onChange={(event) =>
                setFormState((currentState) => ({ ...currentState, content: event.target.value }))
              }
              placeholder="Content"
              rows={8}
              className="rounded-3xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />

            <input
              value={formState.tags}
              onChange={(event) =>
                setFormState((currentState) => ({ ...currentState, tags: event.target.value }))
              }
              placeholder="Tags, comma-separated"
              className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
              >
                Save
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
            const expanded = expandedId === entry.id;

            return (
              <article
                key={entry.id}
                className="rounded-card border border-border/70 bg-panelAlt/70 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
                        {entry.courseCode}
                      </span>
                      <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted">
                        {typeLabels[entry.type]}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-text">{entry.title}</h2>
                    <div className="mt-2 text-sm text-muted">{entry.topic}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(entry.id, entry.courseCode)}
                    className="rounded-full border border-border/70 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted transition hover:border-rose-400/40 hover:text-rose-200"
                  >
                    Delete
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="mt-4 w-full rounded-2xl border border-border/70 bg-panel/60 px-4 py-4 text-left"
                >
                  <div className="text-sm leading-7 text-muted">
                    {expanded ? entry.content : `${entry.content.slice(0, 100)}${entry.content.length > 100 ? "..." : ""}`}
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted">
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                      new Date(entry.createdAt),
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-card border border-border/70 bg-panelAlt/70 p-6 text-sm text-muted">
            No library entries match the current search and filter.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/70" />
          <div className="text-xs uppercase tracking-[0.24em] text-muted">
            Academic Integrity Scanner
          </div>
          <div className="h-px flex-1 bg-border/70" />
        </div>

        <WritingScanner />
      </section>
    </div>
  );
}
