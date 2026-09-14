import type {
  ClarificationDefinition,
  ClarificationId,
} from "@/lib/research/clarification-options";
import { getOption } from "@/lib/research/clarification-options";

type ClarificationCardProps = {
  definition: ClarificationDefinition;
  selectedOptionId: string;
  focusTarget?: boolean;
  onSelect: (optionId: string) => void;
  onRestoreRecommended: () => void;
};

export function ClarificationCard({
  definition,
  selectedOptionId,
  focusTarget = false,
  onSelect,
  onRestoreRecommended,
}: ClarificationCardProps) {
  const selected = getOption(definition.id, selectedOptionId);
  const unsupportedSelected = selected ? !selected.isSupported : false;
  const groupName = `clarify-${definition.id}`;

  return (
    <fieldset
      id={`group-${definition.id}`}
      tabIndex={focusTarget ? -1 : undefined}
      aria-describedby={
        unsupportedSelected ? `${definition.id}-scope` : undefined
      }
      className="rounded-sm border border-tt-border bg-tt-surface-raised p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
    >
      <legend className="px-1 text-sm font-semibold text-tt-text">
        {definition.groupName}
      </legend>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-tt-warning">
        Ambiguous phrase: “{definition.ambiguousPhrase}”
      </p>
      <p className="mt-2 text-xs text-tt-text-secondary">{definition.prompt}</p>
      <p className="mt-2 text-xs text-tt-text-secondary">{definition.rationale}</p>

      <div className="mt-3 space-y-2" role="radiogroup" aria-label={definition.prompt}>
        {definition.options.map((option) => {
          const inputId = `${definition.id}-${option.id}`;
          const checked = option.id === selectedOptionId;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={[
                "flex min-h-11 cursor-pointer gap-2 rounded-sm border px-2 py-2 text-xs",
                checked
                  ? "border-tt-accent bg-tt-bg text-tt-text"
                  : "border-tt-border bg-tt-bg/60 text-tt-text-secondary",
              ].join(" ")}
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="mt-1 size-4 shrink-0 accent-[var(--tt-accent)]"
              />
              <span className="min-w-0">
                <span className="block font-medium text-tt-text">
                  {option.label}
                  {option.isRecommended ? (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-tt-accent">
                      Recommended
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-tt-text-secondary">
                  {option.summary}
                </span>
                {option.scopeLabel ? (
                  <span className="mt-1 block text-tt-warning">
                    {option.scopeLabel}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {unsupportedSelected ? (
        <div
          id={`${definition.id}-scope`}
          role="status"
          className="mt-3 rounded-sm border border-tt-border bg-tt-bg px-2 py-2 text-xs text-tt-warning"
        >
          <p>
            This selection is retained, but overall confirmation is blocked
            because it is outside this prototype’s supported scope
            {definition.id === "evaluation_settings"
              ? " (or is not the pre-registered primary outcome)"
              : ""}
            . Restore the recommended assumption to continue.
          </p>
          <button
            type="button"
            onClick={onRestoreRecommended}
            className="mt-2 min-h-11 rounded-sm border border-tt-border bg-tt-surface-raised px-3 py-2 text-xs font-medium text-tt-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent"
          >
            Restore recommended assumption
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}

export type { ClarificationId };
