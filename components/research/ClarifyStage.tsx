import { ClarificationCard } from "@/components/research/ClarificationCard";
import {
  BASELINE_OVERLAP_POLICY,
  CLARIFICATION_DEFINITIONS,
  EVENT_OVERLAP_POLICY,
  ROUND_TRIP_COST_RATIONALE,
  TEST_PERIOD_ISO,
  TEST_PERIOD_LABEL,
  type ClarificationId,
} from "@/lib/research/clarification-options";
import type { ResearchSessionState } from "@/lib/research/research-session";

type ClarifyStageProps = {
  state: ResearchSessionState;
  costInput: string;
  canConfirm: boolean;
  onSelect: (id: ClarificationId, optionId: string) => void;
  onRestoreRecommended: (id: ClarificationId) => void;
  onCostInputChange: (value: string) => void;
  onConfirmAssumptions: () => void;
  onEditQuestion: () => void;
  onResetSession: () => void;
};

export function ClarifyStage({
  state,
  costInput,
  canConfirm,
  onSelect,
  onRestoreRecommended,
  onCostInputChange,
  onConfirmAssumptions,
  onEditQuestion,
  onResetSession,
}: ClarifyStageProps) {
  return (
    <section aria-labelledby="clarify-heading" className="space-y-3">
      <div className="rounded-sm border border-tt-border bg-tt-surface p-4">
        <h2
          id="clarify-heading"
          className="text-sm font-semibold text-tt-text sm:text-base"
        >
          CLARIFY
        </h2>
        <p className="mt-2 max-w-prose text-sm text-tt-text-secondary">
          Four clarification groups map the question’s ambiguities to explicit
          assumptions. Choose a supported option in each group, then confirm
          once. Unsupported alternatives stay visible when selected but block
          confirmation.
        </p>
        <p className="mt-2 font-mono text-xs tabular-nums text-tt-text">
          Question: {state.question}
        </p>
      </div>

      {CLARIFICATION_DEFINITIONS.map((definition) => (
        <ClarificationCard
          key={definition.id}
          definition={definition}
          selectedOptionId={state.selections[definition.id]}
          focusTarget={state.focusGroupId === definition.id}
          onSelect={(optionId) => onSelect(definition.id, optionId)}
          onRestoreRecommended={() => onRestoreRecommended(definition.id)}
        />
      ))}

      <fieldset className="rounded-sm border border-tt-border bg-tt-surface-raised p-3">
        <legend className="px-1 text-sm font-semibold text-tt-text">
          Evaluation settings details
        </legend>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-tt-text-secondary">
          <li>
            Test period: {TEST_PERIOD_LABEL} ({TEST_PERIOD_ISO.start} through{" "}
            {TEST_PERIOD_ISO.end})
          </li>
          <li>{ROUND_TRIP_COST_RATIONALE}</li>
          <li>{BASELINE_OVERLAP_POLICY}</li>
          <li>{EVENT_OVERLAP_POLICY}</li>
        </ul>

        <label
          htmlFor="round-trip-bps"
          className="mt-3 block text-xs font-medium text-tt-text"
        >
          Illustrative round-trip cost (basis points)
        </label>
        <input
          id="round-trip-bps"
          name="round-trip-bps"
          inputMode="decimal"
          value={costInput}
          onChange={(event) => onCostInputChange(event.target.value)}
          className="mt-1 min-h-11 w-full max-w-xs rounded-sm border border-tt-border bg-tt-bg px-3 py-2 font-mono text-sm tabular-nums text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        />
        <div aria-live="polite" className="mt-2 text-xs">
          {state.costError ? (
            <p role="alert" className="text-tt-negative">
              {state.costError}
            </p>
          ) : (
            <p className="text-tt-text-secondary">
              A valid edited cost remains a proposed assumption until overall
              confirmation.
            </p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onEditQuestion}
          className="min-h-11 rounded-sm border border-tt-border bg-tt-surface px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Edit question
        </button>
        <button
          type="button"
          onClick={onResetSession}
          className="min-h-11 rounded-sm border border-tt-border bg-tt-surface px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Reset session
        </button>
        <button
          type="button"
          onClick={onConfirmAssumptions}
          disabled={!canConfirm}
          className="min-h-11 rounded-sm bg-tt-accent px-3 py-2 text-sm font-medium text-tt-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Confirm selected assumptions
        </button>
        {!canConfirm ? (
          <p role="status" className="self-center text-xs text-tt-text-secondary">
            Enabled only when every group has a supported selection and cost is
            valid.
          </p>
        ) : null}
      </div>
    </section>
  );
}
