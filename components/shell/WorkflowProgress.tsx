import { WORKFLOW_STAGES, type WorkflowStage } from "@/lib/workflow/stages";

type WorkflowProgressProps = {
  activeStage?: WorkflowStage;
};

export function WorkflowProgress({
  activeStage = "ASK",
}: WorkflowProgressProps) {
  return (
    <nav
      aria-label="Research workflow progress"
      className="border-b border-tt-border bg-tt-bg px-3 py-2 sm:px-4"
    >
      <ol className="flex flex-wrap items-center gap-1 sm:gap-0">
        {WORKFLOW_STAGES.map((stage, index) => {
          const isActive = stage === activeStage;
          return (
            <li key={stage} className="flex items-center">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="mx-1 hidden text-tt-text-secondary sm:inline"
                >
                  →
                </span>
              ) : null}
              <span
                className={[
                  "rounded-sm px-2 py-1 text-xs font-medium tracking-wide sm:text-sm",
                  isActive
                    ? "bg-tt-surface-raised text-tt-accent ring-1 ring-tt-accent"
                    : "text-tt-text-secondary",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
