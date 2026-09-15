import { describe, expect, it } from "vitest";
import {
  CLARIFICATION_DEFINITIONS,
  DEFAULT_EXAMPLE_QUESTION,
  DEFAULT_ROUND_TRIP_BPS,
  getOption,
} from "@/lib/research/clarification-options";
import {
  advanceFromAsk,
  canAdvanceFromAsk,
  canConfirmAssumptions,
  clarificationConfigSummary,
  confirmSelectedAssumptions,
  createInitialSession,
  deriveStageStatuses,
  editQuestion,
  reconsiderGroup,
  resetSession,
  restoreRecommended,
  selectOption,
  setQuestion,
  setRoundTripBpsInput,
  unsupportedSelections,
  validateRoundTripBps,
} from "@/lib/research/research-session";
import { buildTraceModel } from "@/lib/research/trace-model";

describe("clarification configuration", () => {
  it("has exactly four uniquely identified groups", () => {
    const summary = clarificationConfigSummary();
    expect(summary.groupCount).toBe(4);
    expect(new Set(summary.ids).size).toBe(4);
    expect(summary.ids).toEqual([
      "instrument",
      "sharp_fall",
      "execution_window",
      "evaluation_settings",
    ]);
  });

  it("gives each group exactly one recommended supported choice", () => {
    for (const group of clarificationConfigSummary().groups) {
      const recommended = CLARIFICATION_DEFINITIONS.find(
        (item) => item.id === group.id,
      )?.options.filter((option) => option.isRecommended);
      expect(recommended).toHaveLength(1);
      expect(group.recommendedSupported).toBe(true);
      expect(group.recommendedId).toBe(recommended?.[0]?.id);
    }
  });

  it("exposes instrument ETF and futures alternatives", () => {
    const instrument = CLARIFICATION_DEFINITIONS.find(
      (item) => item.id === "instrument",
    );
    expect(instrument?.options.some((option) => option.id === "nifty_etf")).toBe(
      true,
    );
    expect(
      instrument?.options.some((option) => option.id === "nifty_futures"),
    ).toBe(true);
    expect(getOption("instrument", "nifty_etf")?.isSupported).toBe(false);
  });
});

describe("ASK gating", () => {
  it("rejects whitespace-only questions", () => {
    const state = setQuestion(createInitialSession(), "   ");
    expect(canAdvanceFromAsk(state)).toBe(false);
    expect(advanceFromAsk(state).stage).toBe("ASK");
  });

  it("trims an accepted question when entering CLARIFY", () => {
    const state = setQuestion(
      createInitialSession(),
      `  ${DEFAULT_EXAMPLE_QUESTION}  `,
    );
    const next = advanceFromAsk(state);
    expect(next.stage).toBe("CLARIFY");
    expect(next.question).toBe(DEFAULT_EXAMPLE_QUESTION);
  });

  it("enters CLARIFY after a valid ASK submission", () => {
    const next = advanceFromAsk(createInitialSession());
    expect(next.stage).toBe("CLARIFY");
    expect(next.assumptionsConfirmed).toBe(false);
    expect(next.roundTripBps).toBe(DEFAULT_ROUND_TRIP_BPS);
  });
});

describe("unsupported selections block confirmation", () => {
  function clarifyState() {
    return advanceFromAsk(createInitialSession());
  }

  it("blocks confirmation when ETF is selected", () => {
    const state = selectOption(clarifyState(), "instrument", "nifty_etf");
    expect(unsupportedSelections(state)).toContain("instrument");
    expect(canConfirmAssumptions(state)).toBe(false);
    expect(confirmSelectedAssumptions(state).stage).toBe("CLARIFY");
    expect(state.selections.instrument).toBe("nifty_etf");
  });

  it("blocks confirmation for unsupported sharp-fall choices", () => {
    const state = selectOption(
      clarifyState(),
      "sharp_fall",
      "worst_5pct_daily",
    );
    expect(canConfirmAssumptions(state)).toBe(false);
  });

  it("blocks confirmation for same-session-close execution", () => {
    const state = selectOption(
      clarifyState(),
      "execution_window",
      "same_session_close",
    );
    expect(canConfirmAssumptions(state)).toBe(false);
  });

  it("restores a group to its recommended choice", () => {
    let state = selectOption(clarifyState(), "instrument", "nifty_futures");
    state = restoreRecommended(state, "instrument");
    expect(state.selections.instrument).toBe("nifty50_index");
    expect(canConfirmAssumptions(state)).toBe(true);
  });
});

describe("cost and overall confirmation", () => {
  it("rejects invalid cost and blocks confirmation", () => {
    expect(validateRoundTripBps("-1").ok).toBe(false);
    let state = advanceFromAsk(createInitialSession());
    state = setRoundTripBpsInput(state, "abc");
    expect(state.costError).not.toBeNull();
    expect(canConfirmAssumptions(state)).toBe(false);
  });

  it("allows a valid edited cost to be confirmed overall", () => {
    let state = advanceFromAsk(createInitialSession());
    state = setRoundTripBpsInput(state, "12");
    expect(state.roundTripBps).toBe(12);
    expect(canConfirmAssumptions(state)).toBe(true);
    state = confirmSelectedAssumptions(state);
    expect(state.stage).toBe("DEFINE");
    expect(state.assumptionsConfirmed).toBe(true);
    expect(state.roundTripBps).toBe(12);
  });

  it("moves proposals to confirmed without duplication on success", () => {
    const state = confirmSelectedAssumptions(
      advanceFromAsk(createInitialSession()),
    );
    const sections = buildTraceModel(state);
    const proposed = sections.find(
      (section) => section.id === "proposed_assumption",
    );
    const confirmed = sections.find(
      (section) => section.id === "confirmed_assumption",
    );
    const needs = sections.find(
      (section) => section.id === "needs_clarification",
    );
    expect(state.stage).toBe("DEFINE");
    expect(proposed?.items).toHaveLength(0);
    expect(needs?.items).toHaveLength(0);
    expect(confirmed?.items.length).toBeGreaterThan(0);
    const ids = confirmed?.items.map((item) => item.id) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps derived empty through DEFINE preview", () => {
    const state = confirmSelectedAssumptions(
      advanceFromAsk(createInitialSession()),
    );
    const derived = buildTraceModel(state).find(
      (section) => section.id === "derived",
    );
    expect(derived?.items).toHaveLength(0);
    expect(derived?.emptyMessage).toBe("Nothing derived yet");
  });
});

describe("reconsider, edit question, and reset", () => {
  it("reconsider returns to CLARIFY and clears confirmation", () => {
    let state = confirmSelectedAssumptions(
      advanceFromAsk(createInitialSession()),
    );
    state = reconsiderGroup(state, "sharp_fall");
    expect(state.stage).toBe("CLARIFY");
    expect(state.assumptionsConfirmed).toBe(false);
    expect(state.focusGroupId).toBe("sharp_fall");
    const proposed = buildTraceModel(state).find(
      (section) => section.id === "proposed_assumption",
    );
    const confirmed = buildTraceModel(state).find(
      (section) => section.id === "confirmed_assumption",
    );
    expect(confirmed?.items).toHaveLength(0);
    expect(proposed?.items.length).toBeGreaterThan(0);
  });

  it("edit-question returns to ASK and clears confirmation", () => {
    let state = confirmSelectedAssumptions(
      advanceFromAsk(createInitialSession()),
    );
    const question = state.question;
    state = editQuestion(state);
    expect(state.stage).toBe("ASK");
    expect(state.question).toBe(question);
    expect(state.assumptionsConfirmed).toBe(false);
  });

  it("reset restores the exact initial state including effective period", () => {
    let state = advanceFromAsk(createInitialSession());
    state = selectOption(state, "instrument", "nifty_etf");
    state = setRoundTripBpsInput(state, "25");
    state = resetSession();
    const initial = createInitialSession();
    expect(state).toEqual(initial);
    expect(state.question).toBe(DEFAULT_EXAMPLE_QUESTION);
    expect(state.roundTripBps).toBe(10);
    expect(state.stage).toBe("ASK");
    const period = buildTraceModel(advanceFromAsk(state))
      .flatMap((section) => section.items)
      .find((item) => item.id === "test_period");
    expect(period?.value).toContain("17 Sep 2007 – 31 Dec 2025");
    expect(period?.value).toContain("2007-09-17");
    expect(period?.value).not.toContain("2007-01-01");
  });
});

describe("stage-status derivation", () => {
  it("is correct for all workflow states", () => {
    expect(deriveStageStatuses("ASK")).toEqual({
      ASK: "current",
      CLARIFY: "pending",
      DEFINE: "pending",
      TEST: "pending",
      LEARN: "pending",
    });
    expect(deriveStageStatuses("CLARIFY")).toEqual({
      ASK: "completed",
      CLARIFY: "current",
      DEFINE: "pending",
      TEST: "pending",
      LEARN: "pending",
    });
    expect(deriveStageStatuses("DEFINE")).toEqual({
      ASK: "completed",
      CLARIFY: "completed",
      DEFINE: "current",
      TEST: "pending",
      LEARN: "pending",
    });
    expect(deriveStageStatuses("TEST")).toEqual({
      ASK: "completed",
      CLARIFY: "completed",
      DEFINE: "completed",
      TEST: "current",
      LEARN: "pending",
    });
    expect(deriveStageStatuses("LEARN")).toEqual({
      ASK: "completed",
      CLARIFY: "completed",
      DEFINE: "completed",
      TEST: "completed",
      LEARN: "current",
    });
  });
});
