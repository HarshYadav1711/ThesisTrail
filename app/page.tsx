export default function HomePage() {
  return (
    <section
      aria-labelledby="workspace-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <h2
        id="workspace-heading"
        className="text-sm font-semibold text-tt-text sm:text-base"
      >
        Research workspace
      </h2>
      <p className="mt-2 max-w-prose text-sm text-tt-text-secondary">
        Phase 1 foundation is ready. The ASK → CLARIFY → DEFINE → TEST → LEARN
        workflow, experiment engine, and results views land in later phases.
        No research run has been executed in this shell.
      </p>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-sm border border-tt-border bg-tt-surface-raised p-2">
          <dt className="text-tt-text-secondary">Active stage</dt>
          <dd className="mt-1 font-medium text-tt-accent">ASK (placeholder)</dd>
        </div>
        <div className="rounded-sm border border-tt-border bg-tt-surface-raised p-2">
          <dt className="text-tt-text-secondary">Evidence status</dt>
          <dd className="mt-1 font-mono tabular-nums text-tt-text">
            No fabricated metrics
          </dd>
        </div>
      </dl>
    </section>
  );
}
