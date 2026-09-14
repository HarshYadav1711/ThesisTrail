/** Workflow stages for shell chrome. Interaction logic arrives in later phases. */
export const WORKFLOW_STAGES = [
  "ASK",
  "CLARIFY",
  "DEFINE",
  "TEST",
  "LEARN",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export function isWorkflowStage(value: string): value is WorkflowStage {
  return (WORKFLOW_STAGES as readonly string[]).includes(value);
}
