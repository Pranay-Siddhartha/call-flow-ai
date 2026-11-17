import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCall } from './useCall';

const mocked = vi.hoisted(() => ({
  getCall: vi.fn(),
  getStageResults: vi.fn(),
  saveStageResult: vi.fn(),
  closeCall: vi.fn(),
}));

vi.mock('../api/client', () => ({
  getCall: mocked.getCall,
  getStageResults: mocked.getStageResults,
  saveStageResult: mocked.saveStageResult,
  closeCall: mocked.closeCall,
}));

describe('useCall persistence', () => {
  beforeEach(() => {
    mocked.getCall.mockResolvedValue({ id: 'call-1', current_stage: 2, status: 'in_progress' });
    mocked.getStageResults.mockResolvedValue([]);
    mocked.saveStageResult.mockReset();
    mocked.closeCall.mockReset();
  });

  it('loads the persisted call and starts on its stored stage', async () => {
    const { result } = renderHook(() => useCall('call-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.call.id).toBe('call-1');
    expect(result.current.currentStage).toBe(2);
    expect(mocked.getStageResults).toHaveBeenCalledWith('call-1');
  });

  it('records a stage after server confirmation without advancing the visible stage', async () => {
    mocked.saveStageResult.mockResolvedValue({
      id: 'saved-stage',
      call_id: 'call-1',
      stage_number: 2,
      outcome: 'Asked what we do',
      prospect_words: '“What does the platform do?”',
    });
    const { result } = renderHook(() => useCall('call-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveStage({
        stageNumber: 2,
        outcome: 'Asked what we do',
        prospectWords: '“What does the platform do?”',
      });
    });

    expect(result.current.currentStage).toBe(2);
    expect(result.current.stageResults).toEqual([
      expect.objectContaining({ id: 'saved-stage', prospect_words: '“What does the platform do?”' }),
    ]);
    expect(mocked.saveStageResult).toHaveBeenCalledWith('call-1', {
      stage_number: 2,
      outcome: 'Asked what we do',
      prospect_words: '“What does the platform do?”',
      caller_notes: '',
      ai_suggestion: null,
    });
  });

  it('does not mark a failed stage save as complete and propagates the error', async () => {
    const failure = new Error('Database unavailable');
    mocked.saveStageResult.mockRejectedValue(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useCall('call-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.saveStage({
        stageNumber: 2,
        outcome: 'Reached',
      })).rejects.toBe(failure);
    });

    expect(result.current.currentStage).toBe(2);
    expect(result.current.stageResults).toEqual([]);
    log.mockRestore();
  });

  it('does not report a failed close as a completed call', async () => {
    const failure = new Error('Close failed');
    mocked.closeCall.mockRejectedValue(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useCall('call-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.closeCall({
        finalOutcome: 'meeting_booked',
        status: 'completed',
      })).rejects.toBe(failure);
    });

    expect(result.current.call.status).toBe('in_progress');
    expect(result.current.call.final_outcome).toBeUndefined();
    log.mockRestore();
  });
});
