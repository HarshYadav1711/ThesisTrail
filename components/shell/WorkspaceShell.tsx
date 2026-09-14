import type { ReactNode } from "react";
import { AppHeader } from "@/components/shell/AppHeader";
import { ResearchTrace } from "@/components/shell/ResearchTrace";
import { WorkflowProgress } from "@/components/shell/WorkflowProgress";

type WorkspaceShellProps = {
  children: ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-tt-bg text-tt-text">
      <AppHeader />
      <WorkflowProgress activeStage="ASK" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1 p-3 sm:p-4">{children}</main>
        <ResearchTrace />
      </div>
    </div>
  );
}
