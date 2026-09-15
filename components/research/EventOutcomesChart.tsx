import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildEventChartPoints,
  chartPointFill,
  type EventChartPoint,
} from "@/lib/research/chart-data";
import { formatIsoDateDisplay, formatPercent } from "@/lib/research/format";
import type { EventResult } from "@/lib/schemas/experiment-result";

type EventOutcomesChartProps = {
  events: readonly EventResult[];
  baselineMedianNet: number | null;
};

type TooltipPayload = {
  payload?: EventChartPoint;
};

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.[0]?.payload) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-sm border border-tt-border bg-tt-surface px-2 py-1.5 text-xs text-tt-text shadow-none">
      <div>Event {point.sequence}</div>
      <div>Signal: {formatIsoDateDisplay(point.signalDate)}</div>
      <div>Entry: {formatIsoDateDisplay(point.entryDate)}</div>
      <div>Exit: {formatIsoDateDisplay(point.exitDate)}</div>
      <div>Net: {formatPercent(point.netReturn)}</div>
    </div>
  );
}

export function EventOutcomesChart({
  events,
  baselineMedianNet,
}: EventOutcomesChartProps) {
  const points = buildEventChartPoints(events);

  return (
    <figure
      className="mt-4 min-w-0"
      aria-label="Event outcomes over time scatter chart"
    >
      <figcaption className="text-xs font-medium text-tt-text">
        Event outcomes over time
      </figcaption>
      <p className="mt-1 text-xs text-tt-text-secondary">
        Chronological event sequence (not proportionally spaced calendar time).
        Each point is one executed event’s net return. Horizontal lines mark
        zero and the baseline median net return.
      </p>
      <div className="mt-3 h-[260px] min-h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ScatterChart
            margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="var(--tt-border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="sequence"
              name="Event"
              tick={{ fill: "var(--tt-text-secondary)", fontSize: 11 }}
              stroke="var(--tt-border)"
              allowDecimals={false}
              label={{
                value: "Chronological event sequence",
                position: "insideBottom",
                offset: -2,
                fill: "var(--tt-text-secondary)",
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="netReturn"
              name="Net return"
              tickFormatter={(value: number) => formatPercent(value, 1)}
              tick={{ fill: "var(--tt-text-secondary)", fontSize: 11 }}
              stroke="var(--tt-border)"
              width={64}
            />
            <Tooltip
              cursor={{ stroke: "var(--tt-accent)", strokeDasharray: "4 4" }}
              content={<ChartTooltip />}
            />
            <ReferenceLine
              y={0}
              stroke="var(--tt-text-secondary)"
              strokeWidth={1}
            />
            {baselineMedianNet !== null ? (
              <ReferenceLine
                y={baselineMedianNet}
                stroke="var(--tt-warning)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ) : null}
            <Scatter
              name="Event net return"
              data={points}
              fill="var(--tt-accent)"
              isAnimationActive={false}
              shape={(props: {
                cx?: number;
                cy?: number;
                payload?: EventChartPoint;
              }) => {
                const { cx = 0, cy = 0, payload } = props;
                const fill = chartPointFill(payload?.polarity ?? "zero");
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={fill}
                    stroke="var(--tt-bg)"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
