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
      <AppHeader />
      <WorkflowProgress activeStage={activeStage} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1 p-3 sm:p-4">{children}</main>
        <ResearchTrace sections={traceSections} />
      </div>
    </div>
  );
}
