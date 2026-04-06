import type { ReactNode } from "react";

export default function CoursesLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <section className="space-y-8">
      <div className="grid gap-4 rounded-shell border border-border/70 bg-panelAlt/50 p-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Courses</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold text-text">
            Navigate cloud learning paths with a stable course, topic, and lesson structure.
          </h1>
        </div>
        <div className="rounded-card border border-border/70 bg-panel/80 p-4">
          <div className="text-sm text-muted">Foundation scope</div>
          <div className="mt-2 text-lg font-semibold text-text">
            Shell, routes, mock data, and typed navigation
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
