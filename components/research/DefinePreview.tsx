import {
  BASELINE_OVERLAP_POLICY,
  EVENT_OVERLAP_POLICY,
  LOCKED_HYPOTHESIS,
  TEST_PERIOD_LABEL,
  TRADABILITY_NOTE,
  CLARIFICATION_DEFINITIONS,
  type ClarificationId,
} from "@/lib/research/clarification-options";
import {
  selectedOptionLabel,
  type ResearchSessionState,
} from "@/lib/research/research-session";

type DefinePreviewProps = {
  state: ResearchSessionState;
  onReconsider: (id: ClarificationId) => void;
  onEditQuestion: () => void;
  onResetSession: () => void;
};

export function DefinePreview({
  state,
  onReconsider,
  onEditQuestion,
  onResetSession,
}: DefinePreviewProps) {
  return (
    <section
      aria-labelledby="define-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <h2
        id="define-heading"
        className="text-sm font-semibold text-tt-text sm:text-base"
      >
        DEFINE preview
      </h2>
      <p className="mt-2 max-w-prose text-sm text-tt-text-secondary">
        Non-executing review of confirmed assumptions. Experiment not built yet.
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-tt-text-secondary">Original question</dt>
          <dd className="mt-1 text-tt-text">{state.question}</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Locked hypothesis</dt>
          <dd className="mt-1 text-tt-text">{LOCKED_HYPOTHESIS}</dd>
        </div>
        {CLARIFICATION_DEFINITIONS.map((definition) => (
          <div key={definition.id} className="rounded-sm border border-tt-border bg-tt-surface-raised p-2">
            <dt className="text-xs text-tt-text-secondary">
              {definition.groupName}
            </dt>
            <dd className="mt-1 font-mono text-xs tabular-nums text-tt-text">
              {selectedOptionLabel(
                definition.id,
                state.selections[definition.id],
              )}
            </dd>
            <button
              type="button"
              onClick={() => onReconsider(definition.id)}
              className="mt-2 min-h-11 rounded-sm border border-tt-border bg-tt-bg px-3 py-2 text-xs font-medium text-tt-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
            >
              Reconsider
            </button>
          </div>
        ))}
        <div>
          <dt className="text-xs text-tt-text-secondary">
            Confirmed illustrative cost
          </dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-tt-text">
            {state.roundTripBps} bps round-trip
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Fixed test period</dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-tt-text">
            {TEST_PERIOD_LABEL}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Event overlap policy</dt>
          <dd className="mt-1 text-xs text-tt-text">{EVENT_OVERLAP_POLICY}</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">
            Baseline overlap policy
          </dt>
          <dd className="mt-1 text-xs text-tt-text">{BASELINE_OVERLAP_POLICY}</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Tradability caveat</dt>
          <dd className="mt-1 text-xs text-tt-warning">{TRADABILITY_NOTE}</dd>
        </div>
      </dl>

      <p
        role="status"
        className="mt-4 rounded-sm border border-tt-border bg-tt-surface-raised px-3 py-2 text-xs text-tt-text-secondary"
      >
        Experiment not built yet. Execution arrives in Phase 3/4. No numerical
        evidence is shown here.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEditQuestion}
          className="min-h-11 rounded-sm border border-tt-border bg-tt-bg px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Edit question
        </button>
        <button
          type="button"
          onClick={onResetSession}
          className="min-h-11 rounded-sm border border-tt-border bg-tt-bg px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Reset session
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="min-h-11 cursor-not-allowed rounded-sm bg-tt-accent/40 px-3 py-2 text-sm font-medium text-tt-bg opacity-60"
          title="Available after Phase 3/4 engine work"
        >
          Run experiment (Phase 3/4)
        </button>
      </div>
    </section>
  );
}
