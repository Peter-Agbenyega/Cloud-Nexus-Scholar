"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  icon: string;
  label: string;
  description: string;
  href: string;
  badge?: string;
};

const navItems: NavItem[] = [
  {
    icon: "🏠",
    label: "Home",
    description: "Your command center",
    href: "/",
  },
  {
    icon: "🧩",
    label: "Workspace",
    description: "Paste → get answer → submit",
    href: "/workspace",
  },
  {
    icon: "🧠",
    label: "Study",
    description: "Practice · Flash Cards · Quiz Mode",
    href: "/study",
    badge: "New",
  },
  {
    icon: "📖",
    label: "Library",
    description: "Notes and integrity scanner",
    href: "/library",
  },
  {
    icon: "📚",
    label: "CLCS 605",
    description: "Completed · Summer 2026",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/1",
    badge: "Done",
  },
  {
    icon: "📗",
    label: "CLCS 615",
    description: "Completed · Summer 2026",
    href: "/courses/clcs-615-cloud-services-and-technologies/unit/1",
    badge: "Done",
  },
  {
    icon: "📅",
    label: "Planner",
    description: "Weekly tasks",
    href: "/planner",
  },
  {
    icon: "🛡️",
    label: "Sandbox",
    description: "Cyber scenarios",
    href: "/sandbox",
  },
  {
    icon: "🔍",
    label: "Resources",
    description: "Course materials",
    href: "/resources",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 rounded-shell border border-border/70 bg-panelAlt/85 p-5 shadow-card backdrop-blur lg:flex lg:flex-col">
      <div className="rounded-card border border-accent/20 bg-accent/10 p-4">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Cloud Nexus Scholar</div>
        <div className="mt-3 text-2xl font-semibold text-text">Simple navigation</div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Open the week, ask one question, get the answer, and submit.
        </p>
      </div>

      <nav className="mt-6 space-y-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-card border p-4 transition ${
                isActive
                  ? "border-accent/40 bg-accent/10 shadow-card ring-1 ring-accent/20"
                  : "border-border/70 bg-panel/70 hover:border-accent/35 hover:bg-panel"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-base font-semibold text-text">{item.label}</div>
                    <div className={`mt-1 text-sm ${isActive ? "text-text" : "text-muted"}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
                {item.badge ? (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
