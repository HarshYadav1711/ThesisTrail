import type { ClientError } from "@/lib/research/run-client";

type TestStageProps = {
  running: boolean;
  error: ClientError | null;
  onRetry: () => void;
  onReconsider: () => void;
  onResetSession: () => void;
};

export function TestStage({
  running,
  error,
  onRetry,
  onReconsider,
  onResetSession,
}: TestStageProps) {
  if (error) {
    return (
      <section
        aria-labelledby="test-error-heading"
        className="rounded-sm border border-tt-border bg-tt-surface p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-warning">
          TEST
        </p>
        <h2
          id="test-error-heading"
          tabIndex={-1}
          className="mt-1 text-sm font-semibold text-tt-text sm:text-base"
        >
          Historical test could not complete
        </h2>
        <div
          role="alert"
          className="mt-3 rounded-sm border border-tt-border bg-tt-surface-raised px-3 py-2"
        >
          <p className="text-xs uppercase tracking-wide text-tt-text-secondary">
            {error.category.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-sm text-tt-text">{error.message}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-sm bg-tt-accent px-3 py-2 text-sm font-medium text-tt-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onReconsider}
            className="min-h-11 rounded-sm border border-tt-border bg-tt-bg px-3 py-2 text-sm text-tt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
          >
            Reconsider assumptions
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

  return (
    <section
      aria-labelledby="test-status-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-accent">
        TEST
      </p>
      <h2
        id="test-status-heading"
        tabIndex={-1}
        className="mt-1 text-sm font-semibold text-tt-text sm:text-base"
      >
        Running historical test
      </h2>
      <div
        role="status"
        aria-live="polite"
        aria-busy={running}
        className="mt-4 flex items-start gap-3 rounded-sm border border-tt-border bg-tt-surface-raised px-3 py-3"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full bg-tt-accent motion-safe:animate-pulse"
        />
        <p className="text-sm text-tt-text">
          Testing the confirmed experiment against 4,487 historical sessions…
        </p>
      </div>
      <p className="mt-3 text-xs text-tt-text-secondary">
        No live market data is fetched. Numerical evidence appears only after a
        validated response.
      </p>
    </section>
  );
}
