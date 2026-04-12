import { ReactNode } from "react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-shell-grid">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-shell border border-border/70 bg-panel/80 shadow-glow backdrop-blur">
          <Header />
          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
