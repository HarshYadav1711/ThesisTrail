import {
  CLARIFICATION_DEFINITIONS,
  CLARIFICATION_IDS,
  DEFAULT_EXAMPLE_QUESTION,
  DEFAULT_ROUND_TRIP_BPS,
  getClarificationDefinition,
  getOption,
  isSupportedSelection,
  type ClarificationId,
} from "@/lib/research/clarification-options";
import type { WorkflowStage } from "@/lib/workflow/stages";

export type ResearchSessionState = {
  /** Interactive stages only in Phase 2. TEST/LEARN remain unreachable. */
  stage: Extract<WorkflowStage, "ASK" | "CLARIFY" | "DEFINE">;
  question: string;
  /** True after overall “Confirm selected assumptions”. */
  assumptionsConfirmed: boolean;
  selections: Record<ClarificationId, string>;
  roundTripBps: number;
  costError: string | null;
  /** Group to focus when returning from DEFINE reconsider. */
  focusGroupId: ClarificationId | null;
};

export type StageProgressStatus = "current" | "completed" | "pending";

export function createInitialSession(
  question = DEFAULT_EXAMPLE_QUESTION,
): ResearchSessionState {
  const selections = {} as Record<ClarificationId, string>;
  for (const id of CLARIFICATION_IDS) {
    selections[id] = getClarificationDefinition(id).defaultOptionId;
  }
  return {
    stage: "ASK",
    question,
    assumptionsConfirmed: false,
    selections,
    roundTripBps: DEFAULT_ROUND_TRIP_BPS,
    costError: null,
    focusGroupId: null,
  };
}

export function resetSession(): ResearchSessionState {
  return createInitialSession(DEFAULT_EXAMPLE_QUESTION);
}

export function validateRoundTripBps(raw: string):
  | { ok: true; value: number }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, error: "Enter a round-trip cost in basis points." };
  }
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return {
      ok: false,
      error: "Cost must be a finite number (basis points).",
    };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: "Cost must be a finite number." };
  }
  if (value < 0) {
    return { ok: false, error: "Cost cannot be negative." };
  }
  return { ok: true, value };
}

export function setQuestion(
  state: ResearchSessionState,
  question: string,
): ResearchSessionState {
  return { ...state, question };
}

export function canAdvanceFromAsk(state: ResearchSessionState): boolean {
  return state.question.trim().length > 0;
}

export function advanceFromAsk(
  state: ResearchSessionState,
): ResearchSessionState {
  if (!canAdvanceFromAsk(state)) {
    return state;
  }
  const selections = {} as Record<ClarificationId, string>;
  for (const id of CLARIFICATION_IDS) {
    selections[id] = getClarificationDefinition(id).defaultOptionId;
  }
  return {
    ...state,
    stage: "CLARIFY",
    question: state.question.trim(),
    assumptionsConfirmed: false,
    selections,
    roundTripBps: DEFAULT_ROUND_TRIP_BPS,
    costError: null,
    focusGroupId: null,
  };
}

export function selectOption(
  state: ResearchSessionState,
  groupId: ClarificationId,
  optionId: string,
): ResearchSessionState {
  const option = getOption(groupId, optionId);
  if (!option) {
    return state;
  }
  return {
    ...state,
    assumptionsConfirmed: false,
    stage: state.stage === "DEFINE" ? "CLARIFY" : state.stage,
    selections: {
      ...state.selections,
      [groupId]: optionId,
    },
  };
}

export function restoreRecommended(
  state: ResearchSessionState,
  groupId: ClarificationId,
): ResearchSessionState {
  const definition = getClarificationDefinition(groupId);
  return selectOption(state, groupId, definition.defaultOptionId);
}

export function setRoundTripBpsInput(
  state: ResearchSessionState,
  raw: string,
): ResearchSessionState {
  const result = validateRoundTripBps(raw);
  if (!result.ok) {
    return {
      ...state,
      assumptionsConfirmed: false,
      stage: state.stage === "DEFINE" ? "CLARIFY" : state.stage,
      costError: result.error,
    };
  }
  return {
    ...state,
    assumptionsConfirmed: false,
    stage: state.stage === "DEFINE" ? "CLARIFY" : state.stage,
    roundTripBps: result.value,
    costError: null,
  };
}

export function unsupportedSelections(
  state: ResearchSessionState,
): ClarificationId[] {
  return CLARIFICATION_IDS.filter(
    (id) => !isSupportedSelection(id, state.selections[id]),
  );
}

export function hasValidCost(state: ResearchSessionState): boolean {
  return state.costError === null && Number.isFinite(state.roundTripBps);
}

export function canConfirmAssumptions(state: ResearchSessionState): boolean {
  if (state.stage !== "CLARIFY") {
    return false;
  }
  if (!hasValidCost(state)) {
    return false;
  }
  return unsupportedSelections(state).length === 0;
}

export function confirmSelectedAssumptions(
  state: ResearchSessionState,
): ResearchSessionState {
  if (!canConfirmAssumptions(state)) {
    return state;
  }
  return {
    ...state,
    stage: "DEFINE",
    assumptionsConfirmed: true,
    focusGroupId: null,
  };
}

export function reconsiderGroup(
  state: ResearchSessionState,
  groupId: ClarificationId,
): ResearchSessionState {
  return {
    ...state,
    stage: "CLARIFY",
    assumptionsConfirmed: false,
    focusGroupId: groupId,
  };
}

export function editQuestion(state: ResearchSessionState): ResearchSessionState {
  return {
    ...state,
    stage: "ASK",
    assumptionsConfirmed: false,
    focusGroupId: null,
  };
}

export function returnToClarify(
  state: ResearchSessionState,
): ResearchSessionState {
  return {
    ...state,
    stage: "CLARIFY",
    assumptionsConfirmed: false,
    focusGroupId: null,
  };
}

export function selectedOptionLabel(
  id: ClarificationId,
  optionId: string,
): string {
  return getOption(id, optionId)?.label ?? optionId;
}

export function deriveStageStatuses(
  currentStage: ResearchSessionState["stage"],
): Record<WorkflowStage, StageProgressStatus> {
  const order: WorkflowStage[] = [
    "ASK",
    "CLARIFY",
    "DEFINE",
    "TEST",
    "LEARN",
  ];
  const currentIndex = order.indexOf(currentStage);
  const statuses = {} as Record<WorkflowStage, StageProgressStatus>;
  for (let index = 0; index < order.length; index += 1) {
    const stage = order[index];
    if (index < currentIndex) {
      statuses[stage] = "completed";
    } else if (index === currentIndex) {
      statuses[stage] = "current";
    } else {
      statuses[stage] = "pending";
    }
  }
  return statuses;
}

export function clarificationConfigSummary() {
  return {
    groupCount: CLARIFICATION_DEFINITIONS.length,
    ids: CLARIFICATION_IDS.slice(),
    groups: CLARIFICATION_DEFINITIONS.map((definition) => ({
      id: definition.id,
      recommendedId: definition.defaultOptionId,
      recommendedSupported:
        getOption(definition.id, definition.defaultOptionId)?.isSupported ===
        true,
      optionIds: definition.options.map((option) => option.id),
    })),
  };
}
