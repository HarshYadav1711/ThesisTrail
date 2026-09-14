import {
  CLARIFICATION_DEFINITIONS,
  EVENT_OVERLAP_POLICY,
  ROUND_TRIP_COST_RATIONALE,
  TEST_PERIOD_ISO,
  TEST_PERIOD_LABEL,
  TRADABILITY_NOTE,
  getOption,
} from "@/lib/research/clarification-options";
import {
  selectedOptionLabel,
  type ResearchSessionState,
} from "@/lib/research/research-session";

export type TraceProvenance =
  | "user_stated"
  | "needs_clarification"
  | "proposed_assumption"
  | "confirmed_assumption"
  | "derived";

export type TraceItem = {
  id: string;
  label: string;
  value: string;
  provenance: TraceProvenance;
  note?: string;
};

export type TraceSection = {
  id: TraceProvenance;
  label: string;
  description: string;
  items: TraceItem[];
  emptyMessage?: string;
};

const SECTION_META: Record<
  TraceProvenance,
  { label: string; description: string; emptyMessage?: string }
> = {
  user_stated: {
    label: "USER STATED",
    description: "Values explicitly asserted by the user.",
  },
  needs_clarification: {
    label: "NEEDS CLARIFICATION",
    description: "Ambiguities still awaiting overall confirmation.",
  },
  proposed_assumption: {
    label: "PROPOSED ASSUMPTIONS",
    description: "Supported selections ready to confirm (ASSUMED).",
  },
  confirmed_assumption: {
    label: "CONFIRMED",
    description: "Assumptions accepted via overall confirmation.",
  },
  derived: {
    label: "DERIVED",
    description: "Values mechanically computed from data or the spec.",
    emptyMessage: "Nothing derived yet",
  },
};

function selectionProvenance(
  state: ResearchSessionState,
  optionId: string,
  groupId: keyof ResearchSessionState["selections"],
): TraceProvenance {
  const option = getOption(groupId, optionId);
  if (state.assumptionsConfirmed && option?.isSupported) {
    return "confirmed_assumption";
  }
  if (!option?.isSupported) {
    return "needs_clarification";
  }
  if (state.stage === "ASK") {
    return "needs_clarification";
  }
  return "proposed_assumption";
}

export function buildTraceModel(state: ResearchSessionState): TraceSection[] {
  const items: TraceItem[] = [];

  const trimmedQuestion = state.question.trim();
  if (trimmedQuestion.length > 0) {
    items.push({
      id: "question",
      label: "Research question",
      value: trimmedQuestion,
      provenance: "user_stated",
    });
  }

  if (state.stage === "CLARIFY" || state.stage === "DEFINE") {
    for (const definition of CLARIFICATION_DEFINITIONS) {
      const optionId = state.selections[definition.id];
      const option = getOption(definition.id, optionId);
      items.push({
        id: definition.id,
        label: definition.groupName,
        value: selectedOptionLabel(definition.id, optionId),
        provenance: selectionProvenance(state, optionId, definition.id),
        note: option?.scopeLabel ?? definition.rationale,
      });
    }

    const costProvenance: TraceProvenance = state.assumptionsConfirmed
      ? "confirmed_assumption"
      : state.costError
        ? "needs_clarification"
        : "proposed_assumption";

    items.push({
      id: "round_trip_bps",
      label: "Round-trip cost (bps)",
      value: state.costError
        ? `Invalid: ${state.costError}`
        : `${state.roundTripBps} bps (illustrative)`,
      provenance: costProvenance,
      note: ROUND_TRIP_COST_RATIONALE,
    });

    items.push({
      id: "test_period",
      label: "Test period",
      value: `${TEST_PERIOD_LABEL} (${TEST_PERIOD_ISO.start} through ${TEST_PERIOD_ISO.end})`,
      provenance: state.assumptionsConfirmed
        ? "confirmed_assumption"
        : "proposed_assumption",
    });

    items.push({
      id: "event_overlap",
      label: "Event overlap policy",
      value: EVENT_OVERLAP_POLICY,
      provenance: state.assumptionsConfirmed
        ? "confirmed_assumption"
        : "proposed_assumption",
    });

    items.push({
      id: "tradability",
      label: "Tradability caveat",
      value: TRADABILITY_NOTE,
      provenance: state.assumptionsConfirmed
        ? "confirmed_assumption"
        : "proposed_assumption",
    });
  } else if (trimmedQuestion.length > 0) {
    for (const definition of CLARIFICATION_DEFINITIONS) {
      items.push({
        id: `pending-${definition.id}`,
        label: definition.groupName,
        value: "Awaiting clarification",
        provenance: "needs_clarification",
      });
    }
  }

  const order: TraceProvenance[] = [
    "user_stated",
    "needs_clarification",
    "proposed_assumption",
    "confirmed_assumption",
    "derived",
  ];

  return order.map((id) => {
    const meta = SECTION_META[id];
    const sectionItems = items.filter((item) => item.provenance === id);
    return {
      id,
      label: meta.label,
      description: meta.description,
      items: sectionItems,
      emptyMessage:
        id === "derived"
          ? meta.emptyMessage
          : sectionItems.length === 0
            ? "None yet."
            : undefined,
    };
  });
}
