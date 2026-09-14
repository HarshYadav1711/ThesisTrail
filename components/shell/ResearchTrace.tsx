import type { TraceSection } from "@/lib/research/trace-model";

type ResearchTraceProps = {
  sections: TraceSection[];
};

function provenanceClass(provenance: string): string {
  if (
    provenance === "proposed_assumption" ||
    provenance === "needs_clarification"
  ) {
    return "text-tt-warning";
  }
  if (provenance === "user_stated") {
    return "text-tt-accent";
  }
  return "text-tt-text-secondary";
}

export function ResearchTrace({ sections }: ResearchTraceProps) {
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
        {sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`trace-${section.id}`}
            className="rounded-sm border border-tt-border bg-tt-surface-raised p-2"
          >
            <h3
              id={`trace-${section.id}`}
              className="text-[10px] font-semibold uppercase tracking-wide text-tt-warning"
            >
              {section.label}
            </h3>
            <p className="mt-1 text-xs text-tt-text-secondary">
              {section.description}
            </p>
            {section.items.length === 0 ? (
              <p className="mt-2 font-mono text-xs tabular-nums text-tt-text-secondary">
                {section.emptyMessage ?? "None yet."}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <li key={item.id} className="border-t border-tt-border pt-2">
                    <div className="text-xs font-medium text-tt-text">
                      {item.label}
                    </div>
                    <div className="mt-1 font-mono text-xs tabular-nums text-tt-text">
                      {item.value}
                    </div>
                    <div
                      className={`mt-1 text-[10px] uppercase tracking-wide ${provenanceClass(item.provenance)}`}
                    >
                      {item.provenance}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}
