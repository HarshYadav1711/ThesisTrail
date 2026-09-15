"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AskStage } from "@/components/research/AskStage";
import { ClarifyStage } from "@/components/research/ClarifyStage";
import { DefinePreview } from "@/components/research/DefinePreview";
import { LearnStage } from "@/components/research/LearnStage";
import { TestStage } from "@/components/research/TestStage";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { buildExperimentSpec, canRunExperiment } from "@/lib/research/build-experiment-spec";
import type { ClarificationId } from "@/lib/research/clarification-options";
import {
  advanceFromAsk,
  applyResearchFailure,
  applyResearchSuccess,
  beginResearchRun,
  canAdvanceFromAsk,
  canConfirmAssumptions,
  confirmSelectedAssumptions,
  createInitialSession,
  editQuestion,
  isResearchRunning,
  reconsiderGroup,
  resetSession,
  restoreRecommended,
  returnToClarify,
  selectOption,
  setQuestion,
  setRoundTripBpsInput,
  type ResearchSessionState,
} from "@/lib/research/research-session";
import {
  isAbortError,
  networkFailureError,
  parseResearchRunResponse,
} from "@/lib/research/run-client";
import { buildTraceModel } from "@/lib/research/trace-model";

export function ResearchSession() {
  const [state, setState] = useState<ResearchSessionState>(() =>
    createInitialSession(),
  );
  const [askError, setAskError] = useState<string | null>(null);
  const [costInput, setCostInput] = useState(String(state.roundTripBps));
  const abortRef = useRef<AbortController | null>(null);

  const traceSections = useMemo(() => buildTraceModel(state), [state]);
  const canConfirm = canConfirmAssumptions(state);
  const runDisabled = !canRunExperiment(state) || isResearchRunning(state);

  useEffect(() => {
    if (!state.focusGroupId) {
      return;
    }
    const node = document.getElementById(`group-${state.focusGroupId}`);
    node?.focus();
  }, [state.focusGroupId, state.stage]);

  useEffect(() => {
    if (state.stage === "TEST" && state.testError) {
      document.getElementById("test-error-heading")?.focus();
      return;
    }
    if (state.stage === "TEST" && state.activeRequestId !== null) {
      document.getElementById("test-status-heading")?.focus();
      return;
    }
    if (state.stage === "LEARN") {
      document.getElementById("learn-heading")?.focus();
    }
  }, [state.stage, state.testError, state.activeRequestId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
    abortRef.current?.abort();
    abortRef.current = null;
    const next = resetSession();
    setAskError(null);
    setCostInput(String(next.roundTripBps));
    setState(next);
  }

  function handleReconsider(id?: ClarificationId) {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((current) =>
      id ? reconsiderGroup(current, id) : returnToClarify(current),
    );
  }

  function handleEditQuestion() {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((current) => editQuestion(current));
  }

  async function executeRun(fromState: ResearchSessionState) {
    const started = beginResearchRun(fromState);
    if (!started) {
      return;
    }
    setState(started);

    const requestId = started.activeRequestId;
    if (requestId === null) {
      return;
    }

    let experiment;
    try {
      experiment = buildExperimentSpec(started);
    } catch {
      setState((current) =>
        applyResearchFailure(current, requestId, {
          category: "invalid_experiment",
          message:
            "The confirmed experiment specification could not be constructed.",
        }),
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experiment }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      const parsed = parseResearchRunResponse(
        response.status,
        rawText,
        experiment,
      );

      setState((current) => {
        if (current.activeRequestId !== requestId) {
          return current;
        }
        if (parsed.ok) {
          return applyResearchSuccess(current, requestId, parsed.result);
        }
        return applyResearchFailure(current, requestId, parsed.error);
      });
    } catch (error) {
      if (isAbortError(error)) {
        setState((current) => {
          if (current.activeRequestId !== requestId) {
            return current;
          }
          return applyResearchFailure(current, requestId, {
            category: "aborted",
            message: "",
          });
        });
        return;
      }
      setState((current) => {
        if (current.activeRequestId !== requestId) {
          return current;
        }
        return applyResearchFailure(current, requestId, networkFailureError());
      });
    }
  }

  function handleRun() {
    if (runDisabled) {
      return;
    }
    void executeRun(state);
  }

  function handleRetry() {
    if (isResearchRunning(state)) {
      return;
    }
    void executeRun(state);
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
          onEditQuestion={handleEditQuestion}
          onResetSession={handleReset}
        />
      ) : null}

      {state.stage === "DEFINE" ? (
        <DefinePreview
          state={state}
          runDisabled={runDisabled}
          onRun={handleRun}
          onReconsider={(id: ClarificationId) => handleReconsider(id)}
          onEditQuestion={handleEditQuestion}
          onResetSession={handleReset}
        />
      ) : null}

      {state.stage === "TEST" ? (
        <TestStage
          running={isResearchRunning(state)}
          error={state.testError}
          onRetry={handleRetry}
          onReconsider={() => handleReconsider()}
          onResetSession={handleReset}
        />
      ) : null}

      {state.stage === "LEARN" && state.result ? (
        <LearnStage
          question={state.question}
          result={state.result}
          onReconsider={() => handleReconsider()}
          onEditQuestion={handleEditQuestion}
          onResetSession={handleReset}
        />
      ) : null}
    </WorkspaceShell>
  );
}
