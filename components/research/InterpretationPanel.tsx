import type { ResearchInterpretSuccess } from "@/lib/schemas/interpretation";

type InterpretationPanelProps = {
  loading: boolean;
  payload: ResearchInterpretSuccess | null;
};

export function InterpretationPanel({
  loading,
  payload,
}: InterpretationPanelProps) {
  return (
    <section
      aria-labelledby="interpretation-panel-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <h3
        id="interpretation-panel-heading"
        className="text-sm font-semibold text-tt-text"
      >
        How ThesisTrail read the question
      </h3>

      {loading && !payload ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="mt-3 flex items-start gap-3 text-sm text-tt-text-secondary"
        >
          <span
            aria-hidden="true"
            className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-tt-accent motion-safe:animate-pulse"
          />
          <p>Preparing the ambiguity review…</p>
        </div>
      ) : null}

      {payload ? (
        <div className="mt-3 space-y-3" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-wide text-tt-text-secondary">
            {payload.source === "ai_assisted"
              ? "AI-assisted interpretation"
              : "Rules-based interpretation"}
          </p>
          <p className="max-w-prose text-xs text-tt-text-secondary">
            {payload.source === "ai_assisted"
              ? "AI helped phrase the ambiguity review. The experiment defaults and numerical rules remain fixed and require your confirmation."
              : "No AI provider was used. The ambiguity review follows the prototype’s fixed research rules."}
          </p>

          <div>
            <h4 className="text-xs font-medium text-tt-text">Restatement</h4>
            <p className="mt-1 max-w-prose text-sm text-tt-text">
              {payload.interpretation.restatement}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-tt-text">
              What you explicitly stated
            </h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-tt-text">
              {payload.interpretation.statedFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-tt-text">
              Ambiguities to clarify
            </h4>
            <ul className="mt-2 space-y-2">
              {payload.interpretation.ambiguities.map((item) => (
                <li
                  key={item.category}
                  className="rounded-sm border border-tt-border bg-tt-surface-raised px-2 py-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-tt-warning">
                    {item.category.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-tt-text">{item.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
