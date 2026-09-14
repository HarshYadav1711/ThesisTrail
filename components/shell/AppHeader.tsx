export function AppHeader() {
  return (
    <header className="border-b border-tt-border bg-tt-bg px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-base font-semibold tracking-tight text-tt-text sm:text-lg">
          ThesisTrail
        </h1>
        <p className="text-xs text-tt-text-secondary sm:text-sm">
          Turn a vague market question into a testable, auditable research
          thesis.
        </p>
      </div>
    </header>
  );
}
