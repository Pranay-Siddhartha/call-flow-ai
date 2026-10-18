import { useState, useEffect, useCallback } from 'react';
import { getCall, getStageResults, saveStageResult as apiSaveStageResult, closeCall as apiCloseCall } from '../api/client';

/**
 * Custom hook to manage active call state, stage results, and updates.
 * @param {string} callId UUID of the call
 */
export function useCall(callId) {
  const [call, setCall] = useState(null);
  const [stageResults, setStageResults] = useState([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load call details and previous stage results
  const loadCallData = useCallback(async () => {
    if (!callId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [callRes, stagesRes] = await Promise.allSettled([
        getCall(callId),
        getStageResults(callId),
      ]);

      let callData = null;
      if (callRes.status === 'fulfilled') {
        const val = callRes.value;
        // Normalize response whether it's wrapped in data or direct
        callData = val?.data || val?.call || val;
        setCall(callData);

        if (callData?.current_stage) {
          setCurrentStage(callData.current_stage);
        }
      } else {
        console.error('Failed to load call:', callRes.reason);
        setError(callRes.reason?.message || 'Failed to load call details');
      }

      if (stagesRes.status === 'fulfilled') {
        const val = stagesRes.value;
        const results = Array.isArray(val) ? val : val?.stages || val?.data || [];
        setStageResults(results);

        // If callData didn't explicitly specify current_stage, derive from max completed + 1
        if (!callData?.current_stage && results.length > 0) {
          const maxCompleted = Math.max(...results.map((r) => r.stage_number || 1));
          setCurrentStage(Math.min(8, maxCompleted + 1));
        }
      } else {
        console.warn('Could not load stage results:', stagesRes.reason);
      }
    } catch (err) {
      console.error('Unexpected error loading call:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    loadCallData();
  }, [loadCallData]);

  /**
   * Save result for a given stage with optimistic update
   */
  const saveStage = useCallback(
    async ({ stageNumber, outcome, prospectWords, callerNotes, aiSuggestion }) => {
      if (!callId) return null;

      const stageNum = Number(stageNumber);
      const newStageRecord = {
        call_id: callId,
        stage_number: stageNum,
        outcome: outcome || 'neutral',
        prospect_words: prospectWords || '',
        caller_notes: callerNotes || '',
        ai_suggestion: aiSuggestion || null,
        created_at: new Date().toISOString(),
      };

      // Optimistic update for stageResults
      setStageResults((prev) => {
        const filtered = prev.filter((s) => Number(s.stage_number) !== stageNum);
        return [...filtered, newStageRecord].sort((a, b) => a.stage_number - b.stage_number);
      });

      // Calculate next stage
      const nextStage = stageNum < 8 ? stageNum + 1 : 8;
      setCurrentStage(nextStage);

      // Optimistic update for call current_stage
      setCall((prev) => (prev ? { ...prev, current_stage: nextStage } : null));

      try {
        const res = await apiSaveStageResult(callId, {
          stage_number: stageNum,
          outcome: outcome || 'neutral',
          prospect_words: prospectWords || '',
          caller_notes: callerNotes || '',
          ai_suggestion: aiSuggestion || null,
        });

        const savedRecord = res?.data || res?.stage || res;
        if (savedRecord && savedRecord.id) {
          setStageResults((prev) =>
            prev.map((s) => (Number(s.stage_number) === stageNum ? { ...s, ...savedRecord } : s))
          );
        }
        return savedRecord;
      } catch (err) {
        console.error('Failed to persist stage result to backend:', err);
        // Note: we keep the optimistic update so the caller can still proceed in offline/dev mode
        return newStageRecord;
      }
    },
    [callId]
  );

  /**
   * Close or end the call
   */
  const closeCall = useCallback(
    async ({ finalOutcome, notes, status = 'completed' }) => {
      if (!callId) return null;

      const payload = {
        final_outcome: finalOutcome,
        status: status,
        notes: notes || '',
        ended_at: new Date().toISOString(),
      };

      // Optimistic update
      setCall((prev) => (prev ? { ...prev, ...payload } : null));

      try {
        const res = await apiCloseCall(callId, payload);
        const updated = res?.data || res?.call || res;
        if (updated) {
          setCall((prev) => ({ ...(prev || {}), ...updated }));
        }
        return updated;
      } catch (err) {
        console.error('Failed to close call on backend:', err);
        return payload;
      }
    },
    [callId]
  );

  return {
    call,
    stageResults,
    currentStage,
    setCurrentStage,
    saveStage,
    closeCall,
    isLoading,
    error,
    refreshCall: loadCallData,
  };
}

export default useCall;
