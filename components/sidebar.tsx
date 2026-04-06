import Link from "next/link";

const navItems = [
  { label: "Courses", href: "/courses", description: "Learning paths" },
  { label: "Library", href: "/courses", description: "Mock content" },
  { label: "Progress", href: "/courses", description: "Static summary" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 rounded-shell border border-border/70 bg-panelAlt/85 p-5 shadow-card backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-card border border-accent/20 bg-accent/10 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-accent">Cloud Nexus Scholar</p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Learning cockpit</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          A focused shell for navigating courses, topic lessons, and platform literacy.
        </p>
      </div>

      <nav className="mt-6 space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-card border border-border/70 bg-panel/70 px-4 py-3 transition hover:border-accent/40 hover:bg-panel"
          >
            <div className="text-sm font-semibold text-text">{item.label}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
              {item.description}
            </div>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-card border border-border/70 bg-panel/80 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Current Slice</div>
        <div className="mt-2 text-lg font-semibold text-text">Slice 1 + Slice 2</div>
        <p className="mt-2 text-sm leading-6 text-muted">
          App shell, route structure, breadcrumb logic, and typed mock learning data.
        </p>
      </div>
    </aside>
  );
}
