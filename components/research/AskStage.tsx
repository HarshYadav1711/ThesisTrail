type AskStageProps = {
  question: string;
  error: string | null;
  onQuestionChange: (value: string) => void;
  onContinue: () => void;
  onResetSession: () => void;
};

export function AskStage({
  question,
  error,
  onQuestionChange,
  onContinue,
  onResetSession,
}: AskStageProps) {
  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-sm border border-tt-border bg-tt-surface p-4"
    >
      <h2
        id="ask-heading"
        className="text-sm font-semibold text-tt-text sm:text-base"
      >
        ASK
      </h2>
      <p className="mt-2 max-w-prose text-sm text-tt-text-secondary">
        Enter the market question. Ambiguous phrases are clarified next—no
        research parameters are treated as facts on this step.
      </p>

      <label
        htmlFor="research-question"
        className="mt-4 block text-xs font-medium text-tt-text"
      >
        Research question
      </label>
      <textarea
        id="research-question"
        name="research-question"
        rows={3}
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-tt-border bg-tt-surface-raised px-3 py-2 text-sm text-tt-text placeholder:text-tt-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        placeholder="Does buying NIFTY after a sharp fall work?"
      />
      <div aria-live="polite" className="mt-2 text-xs">
        {error ? (
          <p role="alert" className="text-tt-negative">
            {error}
          </p>
        ) : (
          <p className="text-tt-text-secondary">
            Default example: “Does buying NIFTY after a sharp fall work?”
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-11 rounded-sm bg-tt-accent px-3 py-2 text-sm font-medium text-tt-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
        >
          Continue to CLARIFY
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
