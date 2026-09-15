import {
  BASELINE_OVERLAP_POLICY,
  CLARIFICATION_DEFINITIONS,
  EVENT_OVERLAP_POLICY,
  LOCKED_HYPOTHESIS,
  TEST_PERIOD_ISO,
  TEST_PERIOD_LABEL,
  TRADABILITY_NOTE,
  type ClarificationId,
} from "@/lib/research/clarification-options";
import { formatBasisPoints } from "@/lib/research/format";
import {
  selectedOptionLabel,
  type ResearchSessionState,
} from "@/lib/research/research-session";

type DefinePreviewProps = {
  state: ResearchSessionState;
  runDisabled: boolean;
  onRun: () => void;
  onReconsider: (id: ClarificationId) => void;
  onEditQuestion: () => void;
  onResetSession: () => void;
};

export function DefinePreview({
  state,
  runDisabled,
  onRun,
  onReconsider,
  onEditQuestion,
  onResetSession,
}: DefinePreviewProps) {
  return (
    <section
      aria-labelledby="define-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-accent">
        DEFINE
      </p>
      <h2
        id="define-heading"
        tabIndex={-1}
        className="mt-1 text-sm font-semibold text-tt-text sm:text-base"
      >
        Confirmed experiment ready to test
      </h2>
      <p className="mt-2 max-w-prose text-sm text-tt-text-secondary">
        Review the locked assumptions below. The test uses a bundled fixed
        snapshot of 4,487 sessions — no live data is fetched. Results are
        descriptive historical evidence. The index itself is not directly
        tradable.
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
        <div>
          <dt className="text-xs text-tt-text-secondary">Research series</dt>
          <dd className="mt-1 text-tt-text">NIFTY 50 index (research series)</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Sharp fall</dt>
          <dd className="mt-1 text-tt-text">
            ≤ −2.0% close-to-close (signal observed at close)
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Entry</dt>
          <dd className="mt-1 text-tt-text">Next trading session open</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Exit</dt>
          <dd className="mt-1 text-tt-text">
            Close of the fifth trading session, counting the entry session as
            session 1 (five sessions including entry)
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Direction</dt>
          <dd className="mt-1 text-tt-text">Long</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Event overlap</dt>
          <dd className="mt-1 text-xs text-tt-text">{EVENT_OVERLAP_POLICY}</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Baseline windows</dt>
          <dd className="mt-1 text-xs text-tt-text">{BASELINE_OVERLAP_POLICY}</dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Effective period</dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-tt-text">
            {TEST_PERIOD_LABEL}
          </dd>
          <dd className="mt-1 font-mono text-[11px] tabular-nums text-tt-text-secondary">
            {TEST_PERIOD_ISO.start} through {TEST_PERIOD_ISO.end}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">
            Confirmed round-trip cost
          </dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-tt-text">
            {formatBasisPoints(state.roundTripBps)} (illustrative)
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Primary outcome</dt>
          <dd className="mt-1 text-xs text-tt-text">
            Median event net return − median baseline net return
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tt-text-secondary">Tradability caveat</dt>
          <dd className="mt-1 text-xs text-tt-warning">{TRADABILITY_NOTE}</dd>
        </div>

        {CLARIFICATION_DEFINITIONS.map((definition) => (
          <div
            key={definition.id}
            className="rounded-sm border border-tt-border bg-tt-surface-raised p-2"
          >
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
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={runDisabled}
          aria-disabled={runDisabled}
          className="min-h-11 rounded-sm bg-tt-accent px-3 py-2 text-sm font-medium text-tt-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Run historical test
        </button>
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
      </div>
    </section>
  );
}
