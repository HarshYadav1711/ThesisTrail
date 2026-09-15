import {
  deriveStageStatuses,
  type StageProgressStatus,
} from "@/lib/research/research-session";
import { WORKFLOW_STAGES, type WorkflowStage } from "@/lib/workflow/stages";

type WorkflowProgressProps = {
  activeStage?: WorkflowStage;
};

function statusLabel(status: StageProgressStatus): string {
  if (status === "current") return "Current";
  if (status === "completed") return "Completed";
  return "Pending";
}

export function WorkflowProgress({
  activeStage = "ASK",
}: WorkflowProgressProps) {
  const statuses = deriveStageStatuses(activeStage);

  return (
    <nav
      aria-label="Research workflow progress"
      className="border-b border-tt-border bg-tt-bg px-3 py-2 sm:px-4"
    >
      <ol className="flex flex-wrap items-center gap-1 sm:gap-0">
        {WORKFLOW_STAGES.map((stage, index) => {
          const status = statuses[stage];
          const isCurrent = status === "current";
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
                  isCurrent
                    ? "bg-tt-surface-raised text-tt-accent ring-1 ring-tt-accent"
                    : status === "completed"
                      ? "text-tt-text"
                      : "text-tt-text-secondary",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {stage}
                <span className="sr-only"> ({statusLabel(status)})</span>
                <span
                  aria-hidden="true"
                  className="ml-1 text-[10px] font-normal uppercase tracking-wide opacity-80"
                >
                  {statusLabel(status)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
