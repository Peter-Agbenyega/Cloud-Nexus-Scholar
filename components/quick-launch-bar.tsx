"use client";

const quickLaunchItems = [
  { label: "CLCS 605 on LEO", icon: "📚", href: "https://learn.umgc.edu" },
  { label: "CLCS 615 on LEO", icon: "📚", href: "https://learn.umgc.edu" },
  { label: "Microsoft Word Online", icon: "📝", href: "https://office.live.com/start/Word.aspx" },
  { label: "OneDrive", icon: "☁️", href: "https://onedrive.live.com" },
  { label: "UMGC Library", icon: "🔬", href: "https://libguides.umgc.edu/home" },
  {
    label: "APA Citation Generator",
    icon: "📖",
    href: "https://www.mybib.com/tools/apa-citation-generator",
  },
  {
    label: "NIST SP 800-145",
    icon: "📋",
    href: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf",
  },
  { label: "AWS Documentation", icon: "⚡", href: "https://docs.aws.amazon.com" },
  { label: "MyUMGC Portal", icon: "🎓", href: "https://students.umgc.edu" },
];

export function QuickLaunchBar() {
  return (
    <section className="rounded-card border border-border/70 bg-panel/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted">Quick Launch</div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {quickLaunchItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-border/70 bg-panelAlt/60 px-4 py-2 text-sm text-muted transition hover:border-accent/35 hover:text-text"
          >
            <span className="mr-2" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}
