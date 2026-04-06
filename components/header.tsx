"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";

export function Header() {
  const pathname = usePathname();
  const isCourses = pathname.startsWith("/courses");

  return (
    <header className="border-b border-border/70 bg-panelAlt/65 px-5 py-5 sm:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Cloud Nexus Scholar</div>
          <h2 className="mt-2 text-2xl font-semibold text-text">
            {isCourses ? "Course Navigator" : "Platform Overview"}
          </h2>
        </div>

        <div className="rounded-card border border-accent/25 bg-accent/10 px-4 py-2 text-sm text-accent">
          Mock foundation active
        </div>
      </div>

      <div className="mt-5">
        <Breadcrumbs />
      </div>
    </header>
  );
}
