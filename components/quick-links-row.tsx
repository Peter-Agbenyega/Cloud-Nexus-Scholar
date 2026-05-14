"use client";

const quickLinks = [
  { label: "📚 CLCS 605 on LEO", href: "https://learn.umgc.edu" },
  { label: "📚 CLCS 615 on LEO", href: "https://learn.umgc.edu" },
  { label: "📝 Microsoft Word", href: "https://office.live.com" },
  { label: "☁️ OneDrive", href: "https://onedrive.live.com" },
  { label: "🔬 UMGC Library", href: "https://libguides.umgc.edu" },
  { label: "📖 APA Generator", href: "https://www.mybib.com" },
];

export function QuickLinksRow() {
  return (
    <section className="space-y-3">
      <div className="text-xs uppercase tracking-[0.24em] text-accent">Quick Links</div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {quickLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap rounded-full border border-border/70 bg-panelAlt/70 px-5 py-3 text-sm font-medium text-text transition hover:border-accent/35 hover:bg-panel"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
