type ModuleStubProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextSlice: string;
};

export function ModuleStub({ eyebrow, title, description, nextSlice }: ModuleStubProps) {
  return (
    <section className="space-y-8">
      <div className="grid gap-4 rounded-shell border border-border/70 bg-panelAlt/50 p-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold text-text">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{description}</p>
        </div>
        <div className="rounded-card border border-border/70 bg-panel/80 p-4">
          <div className="text-sm text-muted">Next slice</div>
          <div className="mt-2 text-lg font-semibold text-text">{nextSlice}</div>
        </div>
      </div>

      <div className="rounded-card border border-dashed border-border/70 bg-panel/70 p-8">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Status</div>
        <h2 className="mt-3 text-2xl font-semibold text-text">Coming soon</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          This module already exists as part of the private workspace shell, but the active logic for it has not been implemented in this slice yet.
        </p>
      </div>
    </section>
  );
}
