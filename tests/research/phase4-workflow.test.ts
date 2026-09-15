import { describe, expect, it } from "vitest";
import { EVENT_TABLE_INITIAL_ROWS } from "@/components/research/EventEvidenceTable";
import {
  buildExperimentSpec,
  canPrepareExperimentSpec,
  canRunExperiment,
} from "@/lib/research/build-experiment-spec";
import { buildEventChartPoints } from "@/lib/research/chart-data";
import {
  formatBasisPoints,
  formatCount,
  formatIsoDateDisplay,
  formatPercent,
  formatPercentagePoints,
  formatPercentagePointsAria,
  normalizeSignedZero,
} from "@/lib/research/format";
import {
  learnConclusion,
  learnStatusLabel,
} from "@/lib/research/learn-copy";
import {
  advanceFromAsk,
  applyResearchFailure,
  applyResearchSuccess,
  beginResearchRun,
  confirmSelectedAssumptions,
  createInitialSession,
  deriveStageStatuses,
  editQuestion,
  isResearchRunning,
  reconsiderGroup,
  resetSession,
  returnToClarify,
  selectOption,
  setRoundTripBpsInput,
} from "@/lib/research/research-session";
import {
  experimentSpecsMatch,
  mapApiErrorCode,
  parseResearchRunResponse,
  userMessageForCategory,
} from "@/lib/research/run-client";
import { buildTraceModel } from "@/lib/research/trace-model";
import { LOCKED_EXPERIMENT_SPEC_FIXTURE } from "@/lib/schemas/experiment-spec";
import type { ExperimentResult } from "@/lib/schemas/experiment-result";
import { ExperimentResultSchema } from "@/lib/schemas/experiment-result";

function definedState() {
  return confirmSelectedAssumptions(advanceFromAsk(createInitialSession()));
}

function sampleEvent(
  overrides: Partial<ExperimentResult["events"][number]> = {},
): ExperimentResult["events"][number] {
  return {
    signalDate: "2007-10-18",
    entryDate: "2007-10-19",
    exitDate: "2007-10-25",
    signalIndex: 1,
    entryIndex: 2,
    exitIndex: 6,
    signalReturn: -0.03,
    entryPrice: 100,
    exitPrice: 101,
    grossReturn: 0.01,
    costRate: 0.001,
    netReturn: 0.009,
    ...overrides,
  };
}

function sampleResult(
  overrides: Partial<ExperimentResult> = {},
): ExperimentResult {
  const base: ExperimentResult = {
    calculationContractVersion: "experiment-contract-v1",
    experiment: LOCKED_EXPERIMENT_SPEC_FIXTURE,
    dataset: {
      id: "nifty50-ohlc-2007-2025",
      interval: { start: "2007-09-17", end: "2025-12-31" },
      sourceChecksumSha256:
        "f9a949eac286548aaae64d7ea62376a08471e5629e1e0ff1c810f379ac7e5f1a",
      processedChecksumSha256:
        "59da480d49e5628dc1d67aa5c200c41b49cfb3ad4bc2365bc5fb7ae2992736a4",
      rowCount: 4487,
    },
    qualifyingSignalCount: 194,
    eventCount: 2,
    baselineWindowCount: 4483,
    exclusionsByReason: {
      no_next_session_entry_row: 0,
      insufficient_exit_horizon: 0,
      invalid_entry_price: 0,
      invalid_exit_price: 0,
      overlap_policy_exclusion: 66,
    },
    primaryOutcome: {
      eventMedianNetReturn: -0.0006313155503738779,
      baselineMedianNetReturn: 0.0014686655804537771,
      delta: -0.002099981130827655,
      interpretationKey: "not_supported",
    },
    avgGrossReturn: 0.001,
    avgNetReturn: -0.000807126863400032,
    medianGrossReturn: 0.001,
    medianNetReturn: -0.0006313155503738779,
    positiveReturnRate: 0.5,
    bestEvent: sampleEvent({ netReturn: 0.12, entryDate: "2010-01-04" }),
    worstEvent: sampleEvent({ netReturn: -0.19, entryDate: "2008-01-02" }),
    baseline: {
      avgGrossReturn: 0.001,
      avgNetReturn: 0.0003877024946393497,
      medianGrossReturn: 0.002,
      medianNetReturn: 0.0014686655804537771,
      windowCount: 4483,
    },
    costs: { roundTripBps: 10, costRate: 0.001 },
    events: [
      sampleEvent({
        signalDate: "2007-10-18",
        entryDate: "2007-10-19",
        exitDate: "2007-10-25",
        netReturn: -0.01,
      }),
      sampleEvent({
        signalDate: "2008-01-21",
        entryDate: "2008-01-22",
        exitDate: "2008-01-29",
        signalIndex: 10,
        entryIndex: 11,
        exitIndex: 15,
        netReturn: 0.02,
      }),
    ],
  };
  return ExperimentResultSchema.parse({ ...base, ...overrides });
}

describe("ExperimentSpec construction", () => {
  it("builds the exact locked ExperimentSpec from confirmed state", () => {
    const state = definedState();
    const spec = buildExperimentSpec(state);
    expect(spec).toEqual({
      ...LOCKED_EXPERIMENT_SPEC_FIXTURE,
      researchQuestion: {
        value: state.question,
        provenance: "user_stated",
      },
    });
  });

  it("preserves confirmed edited cost", () => {
    let state = advanceFromAsk(createInitialSession());
    state = setRoundTripBpsInput(state, "15");
    state = confirmSelectedAssumptions(state);
    const spec = buildExperimentSpec(state);
    expect(spec.costs.roundTripBps.value).toBe(15);
    expect(canPrepareExperimentSpec(state)).toBe(true);
  });

  it("blocks unsupported state from running", () => {
    let state = advanceFromAsk(createInitialSession());
    state = selectOption(state, "instrument", "nifty_etf");
    state = { ...state, assumptionsConfirmed: true, stage: "DEFINE" };
    expect(canPrepareExperimentSpec(state)).toBe(false);
    expect(canRunExperiment(state)).toBe(false);
    expect(() => buildExperimentSpec(state)).toThrow();
  });
});

describe("DEFINE → TEST → LEARN transitions", () => {
  it("transitions DEFINE to TEST on beginResearchRun", () => {
    const state = definedState();
    const next = beginResearchRun(state);
    expect(next?.stage).toBe("TEST");
    expect(next?.activeRequestId).toBe(state.requestGeneration + 1);
    expect(isResearchRunning(next!)).toBe(true);
    expect(deriveStageStatuses("TEST")).toEqual({
      ASK: "completed",
      CLARIFY: "completed",
      DEFINE: "completed",
      TEST: "current",
      LEARN: "pending",
    });
  });

  it("blocks duplicate Run while a request is active", () => {
    const running = beginResearchRun(definedState())!;
    expect(beginResearchRun(running)).toBeNull();
    expect(canRunExperiment(running)).toBe(false);
  });

  it("moves to LEARN on validated success", () => {
    const running = beginResearchRun(definedState())!;
    const result = sampleResult();
    const learned = applyResearchSuccess(
      running,
      running.activeRequestId!,
      result,
    );
    expect(learned.stage).toBe("LEARN");
    expect(learned.result).toEqual(result);
    expect(deriveStageStatuses("LEARN").LEARN).toBe("current");
    expect(deriveStageStatuses("LEARN").TEST).toBe("completed");
  });

  it("ignores stale success for an older request id", () => {
    const first = beginResearchRun(definedState())!;
    const staleId = first.activeRequestId!;
    // Simulate generation bump via reconsider then re-run path by applying to reset-like state
    const afterClear = returnToClarify(first);
    const redefined = confirmSelectedAssumptions(afterClear);
    const second = beginResearchRun(redefined)!;
    const next = applyResearchSuccess(second, staleId, sampleResult());
    expect(next.stage).toBe("TEST");
    expect(next.result).toBeNull();
    expect(next.activeRequestId).toBe(second.activeRequestId);
  });

  it("does not surface aborted requests as failures", () => {
    const running = beginResearchRun(definedState())!;
    const next = applyResearchFailure(running, running.activeRequestId!, {
      category: "aborted",
      message: "",
    });
    expect(next.testError).toBeNull();
    expect(next.activeRequestId).toBeNull();
    expect(next.result).toBeNull();
  });

  it("maps failures to TEST error without LEARN", () => {
    const running = beginResearchRun(definedState())!;
    const next = applyResearchFailure(running, running.activeRequestId!, {
      category: "network",
      message: userMessageForCategory("network"),
    });
    expect(next.stage).toBe("TEST");
    expect(next.testError?.category).toBe("network");
    expect(next.result).toBeNull();
  });

  it("Retry path reuses confirmed assumptions (same stage gate)", () => {
    let state = beginResearchRun(definedState())!;
    state = applyResearchFailure(state, state.activeRequestId!, {
      category: "network",
      message: userMessageForCategory("network"),
    });
    expect(canRunExperiment(state)).toBe(true);
    const retry = beginResearchRun(state)!;
    expect(retry.stage).toBe("TEST");
    expect(buildExperimentSpec(retry).costs.roundTripBps.value).toBe(10);
  });
});

describe("response validation", () => {
  it("accepts a valid success envelope", () => {
    const result = sampleResult();
    const parsed = parseResearchRunResponse(
      200,
      JSON.stringify({ result }),
      LOCKED_EXPERIMENT_SPEC_FIXTURE,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.result.primaryOutcome.delta).toBe(
        -0.002099981130827655,
      );
    }
  });

  it("rejects an invalid success envelope", () => {
    const parsed = parseResearchRunResponse(
      200,
      JSON.stringify({ ok: true }),
      LOCKED_EXPERIMENT_SPEC_FIXTURE,
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.category).toBe("invalid_response");
    }
  });

  it("rejects invalid ExperimentResult payload", () => {
    const parsed = parseResearchRunResponse(
      200,
      JSON.stringify({ result: { eventCount: 1 } }),
      LOCKED_EXPERIMENT_SPEC_FIXTURE,
    );
    expect(parsed.ok).toBe(false);
  });

  it("rejects non-JSON bodies", () => {
    const parsed = parseResearchRunResponse(
      200,
      "not-json",
      LOCKED_EXPERIMENT_SPEC_FIXTURE,
    );
    expect(parsed.ok).toBe(false);
  });

  it("maps API error codes to useful messages", () => {
    expect(mapApiErrorCode("dataset_integrity_failure")).toBe(
      "dataset_integrity",
    );
    expect(userMessageForCategory("dataset_integrity")).toContain(
      "integrity check",
    );
    expect(userMessageForCategory("network")).toContain(
      "could not reach",
    );
    for (const [status, code] of [
      [400, "invalid_json"],
      [415, "unsupported_media_type"],
      [422, "invalid_experiment"],
      [500, "research_execution_failure"],
    ] as const) {
      const parsed = parseResearchRunResponse(
        status,
        JSON.stringify({
          error: { code, message: "x" },
        }),
        LOCKED_EXPERIMENT_SPEC_FIXTURE,
      );
      expect(parsed.ok).toBe(false);
    }
  });

  it("detects mismatched returned experiment", () => {
    const result = sampleResult();
    const altered = {
      ...result,
      experiment: {
        ...result.experiment,
        costs: {
          roundTripBps: {
            ...result.experiment.costs.roundTripBps,
            value: 99,
          },
        },
      },
    };
    const parsed = parseResearchRunResponse(
      200,
      JSON.stringify({ result: altered }),
      LOCKED_EXPERIMENT_SPEC_FIXTURE,
    );
    expect(parsed.ok).toBe(false);
    expect(experimentSpecsMatch(LOCKED_EXPERIMENT_SPEC_FIXTURE, altered.experiment)).toBe(
      false,
    );
  });
});

describe("reconsider / edit / reset clear results", () => {
  it("reconsider clears results and derived evidence", () => {
    let state = beginResearchRun(definedState())!;
    state = applyResearchSuccess(
      state,
      state.activeRequestId!,
      sampleResult(),
    );
    state = reconsiderGroup(state, "sharp_fall");
    expect(state.stage).toBe("CLARIFY");
    expect(state.result).toBeNull();
    expect(state.testError).toBeNull();
    const derived = buildTraceModel(state).find((s) => s.id === "derived");
    expect(derived?.items).toHaveLength(0);
  });

  it("edit question clears results", () => {
    let state = beginResearchRun(definedState())!;
    state = applyResearchSuccess(
      state,
      state.activeRequestId!,
      sampleResult(),
    );
    const question = state.question;
    state = editQuestion(state);
    expect(state.stage).toBe("ASK");
    expect(state.question).toBe(question);
    expect(state.result).toBeNull();
  });

  it("reset clears results/errors/request state", () => {
    let state = beginResearchRun(definedState())!;
    state = applyResearchFailure(state, state.activeRequestId!, {
      category: "network",
      message: "x",
    });
    state = resetSession();
    expect(state).toEqual(createInitialSession());
    expect(state.result).toBeNull();
    expect(state.testError).toBeNull();
    expect(state.activeRequestId).toBeNull();
  });
});

describe("Trace TEST / LEARN", () => {
  it("TEST Trace contains no premature metrics", () => {
    const running = beginResearchRun(definedState())!;
    const derived = buildTraceModel(running).find((s) => s.id === "derived");
    expect(derived?.items.some((i) => i.id === "primary_delta")).toBe(false);
    expect(derived?.items[0]?.value).toMatch(/pending|in progress/i);
  });

  it("LEARN Trace separates evidence and interpretation", () => {
    let state = beginResearchRun(definedState())!;
    state = applyResearchSuccess(
      state,
      state.activeRequestId!,
      sampleResult(),
    );
    const sections = buildTraceModel(state);
    const derived = sections.find((s) => s.id === "derived");
    const interpretation = sections.find((s) => s.id === "interpretation");
    expect(derived?.items.map((i) => i.id)).toEqual(
      expect.arrayContaining([
        "qualifying_signals",
        "executed_events",
        "event_median_net",
        "baseline_median_net",
        "primary_delta",
      ]),
    );
    expect(interpretation?.items[0]?.value).toBe(
      learnStatusLabel("not_supported"),
    );
    expect(
      sections
        .find((s) => s.id === "user_stated")
        ?.items.some((i) => i.id === "interpretation_key"),
    ).toBe(false);
  });
});

describe("display formatters", () => {
  it("formats percent, percentage points, and basis points", () => {
    expect(formatPercent(-0.0006313155503738779)).toBe("-0.06%");
    expect(formatPercentagePoints(-0.002099981130827655)).toBe("-0.21 pp");
    expect(formatPercentagePointsAria(-0.002099981130827655)).toContain(
      "percentage points",
    );
    expect(formatBasisPoints(10)).toBe("10 bps");
    expect(formatCount(4483)).toBe("4,483");
  });

  it("normalizes negative zero and nulls", () => {
    expect(normalizeSignedZero(-0)).toBe(0);
    expect(formatPercent(-0)).toBe("0.00%");
    expect(formatPercent(null)).toBe("Not available");
    expect(formatPercentagePoints(null)).toBe("Not available");
  });

  it("formats ISO dates without timezone shift", () => {
    expect(formatIsoDateDisplay("2007-10-18")).toBe("18 Oct 2007");
    expect(formatIsoDateDisplay("2025-04-16")).toBe("16 Apr 2025");
  });
});

describe("chart and table presentation data", () => {
  it("builds chronological chart points from event nets", () => {
    const result = sampleResult();
    const points = buildEventChartPoints(result.events);
    expect(points).toHaveLength(result.events.length);
    expect(points.map((p) => p.sequence)).toEqual([1, 2]);
    expect(points.map((p) => p.netReturn)).toEqual(
      result.events.map((e) => e.netReturn),
    );
    expect(points[0]!.signalDate).toBe(result.events[0]!.signalDate);
  });

  it("uses a chronological visible subset size", () => {
    expect(EVENT_TABLE_INITIAL_ROWS).toBe(8);
    const events = sampleResult().events;
    expect(events.slice(0, EVENT_TABLE_INITIAL_ROWS)[0]?.signalDate).toBe(
      events[0]?.signalDate,
    );
  });

  it("locks negative primary metrics for display expectations", () => {
    const result = sampleResult();
    expect(formatPercent(result.primaryOutcome.eventMedianNetReturn)).toBe(
      "-0.06%",
    );
    expect(
      formatPercent(result.primaryOutcome.baselineMedianNetReturn),
    ).toBe("+0.15%");
    expect(formatPercentagePoints(result.primaryOutcome.delta)).toBe("-0.21 pp");
    expect(learnConclusion("not_supported")).toContain("does not support");
  });

  it("does not mutate result data when building chart points", () => {
    const result = sampleResult();
    const before = structuredClone(result.events);
    buildEventChartPoints(result.events);
    expect(result.events).toEqual(before);
  });
});
