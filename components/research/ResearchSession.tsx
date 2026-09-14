"use client";

import { useEffect, useMemo, useState } from "react";
import { AskStage } from "@/components/research/AskStage";
import { ClarifyStage } from "@/components/research/ClarifyStage";
import { DefinePreview } from "@/components/research/DefinePreview";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import type { ClarificationId } from "@/lib/research/clarification-options";
import {
  advanceFromAsk,
  canAdvanceFromAsk,
  canConfirmAssumptions,
  confirmSelectedAssumptions,
  createInitialSession,
  editQuestion,
  reconsiderGroup,
  resetSession,
  restoreRecommended,
  selectOption,
  setQuestion,
  setRoundTripBpsInput,
  type ResearchSessionState,
} from "@/lib/research/research-session";
import { buildTraceModel } from "@/lib/research/trace-model";

export function ResearchSession() {
  const [state, setState] = useState<ResearchSessionState>(() =>
    createInitialSession(),
  );
  const [askError, setAskError] = useState<string | null>(null);
  const [costInput, setCostInput] = useState(String(state.roundTripBps));

  const traceSections = useMemo(() => buildTraceModel(state), [state]);
  const canConfirm = canConfirmAssumptions(state);

  useEffect(() => {
    if (!state.focusGroupId) {
      return;
    }
    const node = document.getElementById(`group-${state.focusGroupId}`);
    node?.focus();
  }, [state.focusGroupId, state.stage]);

  function handleContinueFromAsk() {
    if (!canAdvanceFromAsk(state)) {
      setAskError("A research question is required before clarification.");
      return;
    }
    setAskError(null);
    setState((current) => {
      const next = advanceFromAsk(current);
      setCostInput(String(next.roundTripBps));
      return next;
    });
  }

  function handleCostInputChange(value: string) {
    setCostInput(value);
    setState((current) => setRoundTripBpsInput(current, value));
  }

  function handleReset() {
    const next = resetSession();
    setAskError(null);
    setCostInput(String(next.roundTripBps));
    setState(next);
  }

  return (
    <WorkspaceShell activeStage={state.stage} traceSections={traceSections}>
      {state.stage === "ASK" ? (
        <AskStage
          question={state.question}
          error={askError}
          onQuestionChange={(value) => {
            setAskError(null);
            setState((current) => setQuestion(current, value));
          }}
          onContinue={handleContinueFromAsk}
          onResetSession={handleReset}
        />
      ) : null}

      {state.stage === "CLARIFY" ? (
        <ClarifyStage
          state={state}
          costInput={costInput}
          canConfirm={canConfirm}
          onSelect={(id, optionId) =>
            setState((current) => selectOption(current, id, optionId))
          }
          onRestoreRecommended={(id) =>
            setState((current) => restoreRecommended(current, id))
          }
          onCostInputChange={handleCostInputChange}
          onConfirmAssumptions={() =>
            setState((current) => confirmSelectedAssumptions(current))
          }
          onEditQuestion={() => setState((current) => editQuestion(current))}
          onResetSession={handleReset}
        />
      ) : null}

      {state.stage === "DEFINE" ? (
        <DefinePreview
          state={state}
          onReconsider={(id: ClarificationId) =>
            setState((current) => reconsiderGroup(current, id))
          }
          onEditQuestion={() => setState((current) => editQuestion(current))}
          onResetSession={handleReset}
        />
      ) : null}
    </WorkspaceShell>
  );
}
