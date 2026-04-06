"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { resolveBreadcrumbs } from "@/lib/breadcrumb-resolver";

export function Breadcrumbs() {
  const pathname = usePathname();
  const items = resolveBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-text">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition hover:text-accent">
                  {item.label}
                </Link>
              )}
              {!isLast ? <span className="text-muted/60">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
