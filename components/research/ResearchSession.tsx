"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AskStage } from "@/components/research/AskStage";
import { ClarifyStage } from "@/components/research/ClarifyStage";
import { DefinePreview } from "@/components/research/DefinePreview";
import { LearnStage } from "@/components/research/LearnStage";
import { TestStage } from "@/components/research/TestStage";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import {
  localInterpretFallback,
  parseInterpretResponse,
} from "@/lib/interpret/interpret-client";
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
import type { ResearchInterpretSuccess } from "@/lib/schemas/interpretation";

export function ResearchSession() {
  const [state, setState] = useState<ResearchSessionState>(() =>
    createInitialSession(),
  );
  const [askError, setAskError] = useState<string | null>(null);
  const [costInput, setCostInput] = useState(String(state.roundTripBps));
  const [interpretation, setInterpretation] =
    useState<ResearchInterpretSuccess | null>(null);
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [interpretationRequestId, setInterpretationRequestId] = useState(0);
  const runAbortRef = useRef<AbortController | null>(null);
  const interpretAbortRef = useRef<AbortController | null>(null);

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
      runAbortRef.current?.abort();
      interpretAbortRef.current?.abort();
    };
  }, []);

  function clearInterpretationState() {
    interpretAbortRef.current?.abort();
    interpretAbortRef.current = null;
    setInterpretation(null);
    setInterpretationLoading(false);
    setInterpretationRequestId((current) => current + 1);
  }

  async function requestInterpretation(question: string, requestId: number) {
    setInterpretation(null);
    setInterpretationLoading(true);

    interpretAbortRef.current?.abort();
    const controller = new AbortController();
    interpretAbortRef.current = controller;

    try {
      const response = await fetch("/api/research/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      const rawText = await response.text();
      const parsed = parseInterpretResponse(response.status, rawText);
      const payload = parsed.ok
        ? parsed.data
        : localInterpretFallback(question);

      setInterpretationRequestId((current) => {
        if (current !== requestId) {
          return current;
        }
        setInterpretation(payload);
        setInterpretationLoading(false);
        return current;
      });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      setInterpretationRequestId((current) => {
        if (current !== requestId) {
          return current;
        }
        setInterpretation(localInterpretFallback(question));
        setInterpretationLoading(false);
        return current;
      });
    }
  }

  function handleContinueFromAsk() {
    if (!canAdvanceFromAsk(state)) {
      setAskError("A research question is required before clarification.");
      return;
    }
    setAskError(null);
    const next = advanceFromAsk(state);
    setCostInput(String(next.roundTripBps));
    setState(next);

    const requestId = interpretationRequestId + 1;
    setInterpretationRequestId(requestId);
    void requestInterpretation(next.question, requestId);
  }

  function handleCostInputChange(value: string) {
    setCostInput(value);
    setState((current) => setRoundTripBpsInput(current, value));
  }

  function handleReset() {
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    clearInterpretationState();
    const next = resetSession();
    setAskError(null);
    setCostInput(String(next.roundTripBps));
    setState(next);
  }

  function handleReconsider(id?: ClarificationId) {
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    setState((current) =>
      id ? reconsiderGroup(current, id) : returnToClarify(current),
    );
  }

  function handleEditQuestion() {
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    clearInterpretationState();
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

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

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
          interpretationLoading={interpretationLoading}
          interpretation={interpretation}
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
