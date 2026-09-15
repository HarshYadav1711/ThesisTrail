import type { ReactNode } from "react";
import { AppHeader } from "@/components/shell/AppHeader";
import { ResearchTrace } from "@/components/shell/ResearchTrace";
import { WorkflowProgress } from "@/components/shell/WorkflowProgress";
import type { TraceSection } from "@/lib/research/trace-model";
import type { WorkflowStage } from "@/lib/workflow/stages";

type WorkspaceShellProps = {
  children: ReactNode;
  activeStage?: WorkflowStage;
  traceSections: TraceSection[];
};

/**
 * Presentational shell. Used by the client ResearchSession so Trace and
 * progress stay driven by session state without a second client boundary.
 */
export function WorkspaceShell({
  children,
  activeStage = "ASK",
  traceSections,
}: WorkspaceShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-tt-bg text-tt-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-tt-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-tt-bg focus:shadow-[var(--tt-focus-ring)]"
      >
        Skip to main content
      </a>
      <AppHeader />
      <WorkflowProgress activeStage={activeStage} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-3 sm:p-4 focus-visible:outline-none"
        >
          {children}
        </main>
        <ResearchTrace sections={traceSections} />
      </div>
    </div>
  );
}
