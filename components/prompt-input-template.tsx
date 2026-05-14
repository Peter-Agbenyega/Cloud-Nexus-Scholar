"use client";

import { ParsedPromptTemplate } from "@/lib/types";

const FIELD_CONFIG: Array<{
  key: keyof ParsedPromptTemplate;
  label: string;
  multiline?: boolean;
  placeholder: string;
}> = [
  { key: "course", label: "Course", placeholder: "CLCS 605" },
  { key: "unit", label: "Unit", placeholder: "Unit 4" },
  { key: "professor", label: "Professor", placeholder: "Professor name" },
  { key: "due", label: "Due", placeholder: "Sunday 11:59 PM ET" },
  { key: "type", label: "Type", placeholder: "Discussion, assignment, lab..." },
  { key: "wordCount", label: "Word Count", placeholder: "700-900 words" },
  {
    key: "assignmentInstructions",
    label: "Assignment Instructions",
    multiline: true,
    placeholder: "Paste the full assignment instructions here.",
  },
  {
    key: "rubric",
    label: "Rubric",
    multiline: true,
    placeholder: "Paste the rubric text, point values, and exceeds-expectations language.",
  },
  {
    key: "specialRequirements",
    label: "Special Requirements",
    multiline: true,
    placeholder: "Peer replies, screenshots, documentation rules, AI disclosure, or anything else.",
  },
];

type PromptInputTemplateProps = {
  value: ParsedPromptTemplate;
  onChange: (value: ParsedPromptTemplate) => void;
};

function isFilled(value: string) {
  return value.trim().length > 0;
}

export function PromptInputTemplate({ value, onChange }: PromptInputTemplateProps) {
  const completedCount = FIELD_CONFIG.filter((field) => isFilled(value[field.key])).length;

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Required template</div>
            <p className="mt-2 text-sm leading-7 text-muted">
              Generation stays locked until all nine fields are complete.
            </p>
          </div>
          <div className="rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-text">
            {completedCount}/{FIELD_CONFIG.length} complete
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {FIELD_CONFIG.map((field) => {
          const complete = isFilled(value[field.key]);
          const commonClassName =
            "mt-3 w-full rounded-3xl border border-border/70 bg-panel/70 px-4 py-3 text-sm leading-7 text-text outline-none transition focus:border-accent";

          return (
            <div key={field.key} className={field.multiline ? "xl:col-span-2" : ""}>
              <div className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-text">{field.label}</div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      complete
                        ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                        : "border-amber-400/35 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {complete ? "Complete" : "Required"}
                  </span>
                </div>
                {field.multiline ? (
                  <textarea
                    value={value[field.key]}
                    onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
                    className={`${commonClassName} min-h-[140px]`}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    value={value[field.key]}
                    onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
                    className={commonClassName}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
