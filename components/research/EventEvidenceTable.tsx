import {
  formatIsoDateDisplay,
  formatPercent,
  signedClassName,
} from "@/lib/research/format";
import type { EventResult } from "@/lib/schemas/experiment-result";

const INITIAL_ROWS = 8;

type EventEvidenceTableProps = {
  events: readonly EventResult[];
};

function EventRows({ events }: { events: readonly EventResult[] }) {
  return (
    <>
      {events.map((event) => (
        <tr key={`${event.signalDate}-${event.entryDate}-${event.exitDate}`}>
          <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums">
            {formatIsoDateDisplay(event.signalDate)}
          </td>
          <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums">
            {formatIsoDateDisplay(event.entryDate)}
          </td>
          <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums">
            {formatIsoDateDisplay(event.exitDate)}
          </td>
          <td
            className={`whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums ${signedClassName(event.signalReturn)}`}
          >
            {formatPercent(event.signalReturn)}
          </td>
          <td
            className={`whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums ${signedClassName(event.grossReturn)}`}
          >
            {formatPercent(event.grossReturn)}
          </td>
          <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums text-tt-text">
            {formatPercent(event.costRate)}
          </td>
          <td
            className={`whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums ${signedClassName(event.netReturn)}`}
          >
            {formatPercent(event.netReturn)}
          </td>
        </tr>
      ))}
    </>
  );
}

export function EventEvidenceTable({ events }: EventEvidenceTableProps) {
  const initial = events.slice(0, INITIAL_ROWS);
  const remaining = events.length - initial.length;

  return (
    <div className="mt-4 min-w-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-tt-text">
        Event evidence table
      </h3>
      <div
        className="mt-2 max-w-full overflow-x-auto rounded-sm border border-tt-border"
        role="region"
        aria-label="Event evidence table. Scroll horizontally when columns overflow."
        tabIndex={0}
      >
        <table className="min-w-full border-collapse text-left text-tt-text">
          <caption className="border-b border-tt-border bg-tt-surface-raised px-2 py-1.5 text-left text-xs text-tt-text-secondary">
            Chronological executed events (first {Math.min(INITIAL_ROWS, events.length)} shown
            {remaining > 0 ? `; ${events.length} total` : ""})
          </caption>
          <thead className="bg-tt-surface-raised text-[11px] uppercase tracking-wide text-tt-text-secondary">
            <tr>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Signal
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Entry
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Exit
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Signal decline
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Gross
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Cost
              </th>
              <th scope="col" className="px-2 py-1.5 font-medium">
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            <EventRows events={initial} />
          </tbody>
        </table>
      </div>

      {remaining > 0 ? (
        <details className="mt-2 rounded-sm border border-tt-border bg-tt-surface-raised p-2">
          <summary className="cursor-pointer text-sm text-tt-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-accent">
            View all {events.length} events
          </summary>
          <div
            className="mt-2 max-w-full overflow-x-auto"
            role="region"
            aria-label="All executed events table. Scroll horizontally when columns overflow."
            tabIndex={0}
          >
            <table className="min-w-full border-collapse text-left text-tt-text">
              <caption className="sr-only">
                All {events.length} executed events in chronological order
              </caption>
              <thead className="bg-tt-surface text-[11px] uppercase tracking-wide text-tt-text-secondary">
                <tr>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Signal
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Entry
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Exit
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Signal decline
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Gross
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Cost
                  </th>
                  <th scope="col" className="px-2 py-1.5 font-medium">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                <EventRows events={events} />
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}

export const EVENT_TABLE_INITIAL_ROWS = INITIAL_ROWS;
