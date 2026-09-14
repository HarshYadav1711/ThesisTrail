const PROVENANCE_CATEGORIES = [
  {
    id: "user_stated",
    label: "USER STATED",
    description: "Values explicitly asserted by the user.",
    placeholder: "No user-stated values yet.",
  },
  {
    id: "proposed_assumption",
    label: "ASSUMED",
    description: "System-proposed assumptions awaiting confirmation.",
    placeholder: "Locked defaults will appear here as proposals in later phases.",
  },
  {
    id: "confirmed_assumption",
    label: "CONFIRMED",
    description: "Assumptions the user has accepted.",
    placeholder: "Nothing confirmed yet.",
  },
  {
    id: "derived",
    label: "DERIVED",
    description: "Values mechanically computed from data or the spec.",
    placeholder: "No derived metrics until an experiment runs.",
  },
] as const;

export function ResearchTrace() {
  return (
    <aside
      aria-label="Research Trace"
      className="w-full shrink-0 border-t border-tt-border bg-tt-surface lg:w-[280px] lg:border-t-0 lg:border-l"
    >
      <div className="border-b border-tt-border px-3 py-2">
        <h2 className="text-sm font-semibold text-tt-text">Research Trace</h2>
        <p className="mt-0.5 text-xs text-tt-text-secondary">
          Audit surface for material values and provenance.
        </p>
      </div>
      <div className="space-y-3 p-3">
        {PROVENANCE_CATEGORIES.map((category) => (
          <section
            key={category.id}
            aria-labelledby={`trace-${category.id}`}
            className="rounded-sm border border-tt-border bg-tt-surface-raised p-2"
          >
            <h3
              id={`trace-${category.id}`}
              className="text-[10px] font-semibold uppercase tracking-wide text-tt-warning"
            >
              {category.label}
            </h3>
            <p className="mt-1 text-xs text-tt-text-secondary">
              {category.description}
            </p>
            <p className="mt-2 font-mono text-xs tabular-nums text-tt-text">
              {category.placeholder}
            </p>
          </section>
        ))}
      </div>
    </aside>
  );
}
