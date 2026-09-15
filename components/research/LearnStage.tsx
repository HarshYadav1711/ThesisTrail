import { EventEvidenceTable } from "@/components/research/EventEvidenceTable";
import { EventOutcomesChart } from "@/components/research/EventOutcomesChart";
import {
  NIFTY50_DATASET_ID,
  NIFTY50_EFFECTIVE_PERIOD_DISPLAY,
  NIFTY50_LICENSE,
  NIFTY50_PROCESSED_ROW_COUNT,
  NIFTY50_PROCESSED_SHA256,
  NIFTY50_SOURCE_URL,
} from "@/lib/data/nifty50-constants";
import {
  formatCount,
  formatPercent,
  formatPercentagePoints,
  formatPercentagePointsAria,
  signedClassName,
} from "@/lib/research/format";
import {
  CANNOT_CLAIM_ITEMS,
  LEARN_QUALIFIER,
  NEXT_TEST_ITEMS,
  NEXT_TESTS_LABEL,
  interpretationParagraphs,
  learnConclusion,
  learnStatusLabel,
} from "@/lib/research/learn-copy";
import type { ExperimentResult } from "@/lib/schemas/experiment-result";

type LearnStageProps = {
  question: string;
  result: ExperimentResult;
  onReconsider: () => void;
  onEditQuestion: () => void;
  onResetSession: () => void;
};

export function LearnStage({
  question,
  result,
  onReconsider,
  onEditQuestion,
  onResetSession,
}: LearnStageProps) {
  const key = result.primaryOutcome.interpretationKey;
  const delta = result.primaryOutcome.delta;
  const eventMedian = result.primaryOutcome.eventMedianNetReturn;
  const baselineMedian = result.primaryOutcome.baselineMedianNetReturn;

  return (
    <section
      aria-labelledby="learn-heading"
      className="space-y-4"
    >
      <header className="rounded-sm border border-tt-border bg-tt-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-accent">
          LEARN
        </p>
        <h2
          id="learn-heading"
          tabIndex={-1}
          className="mt-1 text-sm font-semibold text-tt-text sm:text-base"
        >
          {question}
        </h2>
        <p
          className={`mt-2 text-sm font-medium ${signedClassName(delta)}`}
          role="status"
        >
          {learnStatusLabel(key)}
        </p>
        <p className="mt-2 max-w-prose text-sm text-tt-text">
          {learnConclusion(key)}
        </p>
        <p className="mt-2 max-w-prose text-xs text-tt-text-secondary">
          {LEARN_QUALIFIER}
        </p>
      </header>

      <section
        aria-labelledby="what-data-shows"
        className="rounded-sm border border-tt-border bg-tt-surface p-4"
      >
        <h3
          id="what-data-shows"
          className="text-xs font-semibold uppercase tracking-wide text-tt-text"
        >
          1. WHAT THE DATA SHOWS
        </h3>

        <div className="mt-4 rounded-sm border border-tt-border bg-tt-surface-raised p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-text-secondary">
            Primary comparison
          </p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-tt-text-secondary">
                Median event net return
              </dt>
              <dd
                className={`mt-1 font-mono text-sm tabular-nums ${signedClassName(eventMedian)}`}
              >
                {formatPercent(eventMedian)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-tt-text-secondary">
                Median baseline net return
              </dt>
              <dd
                className={`mt-1 font-mono text-sm tabular-nums ${signedClassName(baselineMedian)}`}
              >
                {formatPercent(baselineMedian)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-tt-text-secondary">
                Primary delta
              </dt>
              <dd
                className={`mt-1 font-mono text-base font-semibold tabular-nums ${signedClassName(delta)}`}
              >
                <span aria-hidden="true">{formatPercentagePoints(delta)}</span>
                <span className="sr-only">
                  {formatPercentagePointsAria(delta)}
                </span>
              </dd>
              <p className="mt-1 text-[11px] text-tt-text-secondary">
                Difference between two return medians (percentage points), not a
                strategy P&amp;L figure.
              </p>
            </div>
          </dl>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-medium text-tt-text">
              Sample construction
            </h4>
            <ul className="mt-2 space-y-1 font-mono text-xs tabular-nums text-tt-text">
              <li>
                {formatCount(result.qualifyingSignalCount)} qualifying sharp-fall
                signals
              </li>
              <li>
                {formatCount(result.eventCount)} executed non-overlapping events
              </li>
              <li>
                {formatCount(result.exclusionsByReason.overlap_policy_exclusion)}{" "}
                overlap-policy exclusions
              </li>
              <li>
                {formatCount(result.baselineWindowCount)} unconditional baseline
                windows
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium text-tt-text">Event evidence</h4>
            <ul className="mt-2 space-y-1 font-mono text-xs tabular-nums text-tt-text">
              <li>
                Mean net:{" "}
                <span className={signedClassName(result.avgNetReturn)}>
                  {formatPercent(result.avgNetReturn)}
                </span>
              </li>
              <li>
                Median net:{" "}
                <span className={signedClassName(result.medianNetReturn)}>
                  {formatPercent(result.medianNetReturn)}
                </span>
              </li>
              <li>
                Positive-net-return rate:{" "}
                {formatPercent(result.positiveReturnRate)}
              </li>
              <li>
                Worst event net:{" "}
                <span
                  className={signedClassName(result.worstEvent?.netReturn ?? null)}
                >
                  {formatPercent(result.worstEvent?.netReturn ?? null)}
                </span>
              </li>
              <li>
                Best event net:{" "}
                <span
                  className={signedClassName(result.bestEvent?.netReturn ?? null)}
                >
                  {formatPercent(result.bestEvent?.netReturn ?? null)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-medium text-tt-text">Baseline evidence</h4>
          <ul className="mt-2 space-y-1 font-mono text-xs tabular-nums text-tt-text">
            <li>
              Mean net:{" "}
              <span className={signedClassName(result.baseline.avgNetReturn)}>
                {formatPercent(result.baseline.avgNetReturn)}
              </span>
            </li>
            <li>
              Median net:{" "}
              <span className={signedClassName(result.baseline.medianNetReturn)}>
                {formatPercent(result.baseline.medianNetReturn)}
              </span>
            </li>
          </ul>
        </div>

        <EventOutcomesChart
          events={result.events}
          baselineMedianNet={baselineMedian}
        />
        <EventEvidenceTable events={result.events} />
      </section>

      <section
        aria-labelledby="interpretation"
        className="rounded-sm border border-tt-border bg-tt-surface p-4"
      >
        <h3
          id="interpretation"
          className="text-xs font-semibold uppercase tracking-wide text-tt-text"
        >
          2. INTERPRETATION
        </h3>
        <ul className="mt-3 max-w-prose list-disc space-y-2 pl-5 text-sm text-tt-text">
          {interpretationParagraphs(key).map((paragraph) => (
            <li key={paragraph}>{paragraph}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="cannot-claim"
        className="rounded-sm border border-tt-border bg-tt-surface p-4"
      >
        <h3
          id="cannot-claim"
          className="text-xs font-semibold uppercase tracking-wide text-tt-text"
        >
          3. WHAT WE CANNOT CLAIM
        </h3>
        <ul className="mt-3 max-w-prose list-disc space-y-2 pl-5 text-sm text-tt-text">
          {CANNOT_CLAIM_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="test-next"
        className="rounded-sm border border-tt-border bg-tt-surface p-4"
      >
        <h3
          id="test-next"
          className="text-xs font-semibold uppercase tracking-wide text-tt-text"
        >
          4. WHAT TO TEST NEXT
        </h3>
        <p className="mt-2 text-xs font-medium text-tt-warning">
          {NEXT_TESTS_LABEL}
        </p>
        <ul className="mt-3 max-w-prose list-disc space-y-2 pl-5 text-sm text-tt-text">
          {NEXT_TEST_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <details className="rounded-sm border border-tt-border bg-tt-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-tt-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent">
          Dataset and reproducibility disclosure
        </summary>
        <dl className="mt-3 space-y-2 text-xs text-tt-text">
          <div>
            <dt className="text-tt-text-secondary">Dataset</dt>
            <dd>NIFTY 50 Historical Data (1999–2026) — id {NIFTY50_DATASET_ID}</dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">Kaggle uploader</dt>
            <dd>APARNA MP</dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">License</dt>
            <dd>{NIFTY50_LICENSE}</dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">Snapshot</dt>
            <dd>
              Fixed repository snapshot · {formatCount(NIFTY50_PROCESSED_ROW_COUNT)}{" "}
              validated sessions · effective period {NIFTY50_EFFECTIVE_PERIOD_DISPLAY}
            </dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">Processed checksum (SHA-256)</dt>
            <dd className="break-all font-mono text-[11px] tabular-nums">
              {NIFTY50_PROCESSED_SHA256}
            </dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">Source</dt>
            <dd className="break-all">{NIFTY50_SOURCE_URL}</dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">Runtime fetch</dt>
            <dd>None — no live market data is fetched.</dd>
          </div>
          <div>
            <dt className="text-tt-text-secondary">NSE claim</dt>
            <dd>
              This repository does not distribute official NSE data and does not
              claim independently verified official NSE status.
            </dd>
          </div>
        </dl>
      </details>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReconsider}
          className="min-h-11 rounded-sm border border-tt-border bg-tt-bg px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Reconsider assumptions
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
          Start over
        </button>
      </div>
    </section>
  );
}
