import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CallHistory from './CallHistory';
import CallDetail from './CallDetail';

const mocked = vi.hoisted(() => ({
  getCalls: vi.fn(),
  getCall: vi.fn(),
  getStageResults: vi.fn(),
  getCallSummary: vi.fn(),
}));

vi.mock('../api/client', () => ({
  getCalls: mocked.getCalls,
  getCall: mocked.getCall,
  getStageResults: mocked.getStageResults,
  getCallSummary: mocked.getCallSummary,
}));

function renderWithPath(element, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {element}
    </MemoryRouter>
  );
}

describe('call history page', () => {
  beforeEach(() => {
    mocked.getCalls.mockReset();
  });

  it('renders loading and empty states', async () => {
    let resolveCalls;
    mocked.getCalls.mockReturnValueOnce(new Promise((resolve) => {
      resolveCalls = resolve;
    }));
    renderWithPath(<CallHistory />);
    expect(screen.getByText('Loading call records...')).toBeInTheDocument();

    resolveCalls([]);
    expect(await screen.findByText('No calls yet')).toBeInTheDocument();
  });

  it('shows a retry action after a history request fails', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocked.getCalls.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'call-1', prospect_name: 'Grace Hopper', status: 'completed' }]);
    renderWithPath(<CallHistory />);

    expect(await screen.findByText(/Could not reach backend server/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    warn.mockRestore();
  });
});

describe('call detail page', () => {
  beforeEach(() => {
    mocked.getCall.mockReset();
    mocked.getStageResults.mockReset();
    mocked.getCallSummary.mockReset();
  });

  it('renders call state and safely displays saved quotes as text', async () => {
    mocked.getCall.mockResolvedValue({
      id: 'call-1',
      prospect_name: 'Ada Lovelace',
      prospect_company: 'Engine Works',
      status: 'completed',
      final_outcome: 'meeting_booked',
      current_stage: 6,
      call_summary: 'A meeting was agreed.',
    });
    mocked.getStageResults.mockResolvedValue([{
      stage_number: 5,
      outcome: 'shared_specific_need',
      prospect_words: '<img src=x onerror=alert(1)>',
      caller_notes: 'Follow-up requested',
    }]);

    renderWithPath(
      <Routes>
        <Route path="/history/:id" element={<CallDetail />} />
      </Routes>,
      '/history/call-1'
    );

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText('Engine Works')).toBeInTheDocument();
    expect(screen.getByText('Meeting Booked ✅')).toBeInTheDocument();
    expect(screen.getByText((_content, element) =>
      element.tagName === 'P' && element.textContent.includes('<img src=x onerror=alert(1)>')
    )).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Follow-up requested')).toBeInTheDocument();
    expect(mocked.getCall).toHaveBeenCalledWith('call-1');
  });

  it('surfaces a missing-call error instead of rendering empty details', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocked.getCall.mockRejectedValue(new Error('Call not found'));
    mocked.getStageResults.mockResolvedValue([]);

    renderWithPath(
      <Routes>
        <Route path="/history/:id" element={<CallDetail />} />
      </Routes>,
      '/history/missing'
    );

    expect(await screen.findByText('Call not found')).toBeInTheDocument();
    warn.mockRestore();
  });

  it('does not replace a failed AI summary with fabricated success-shaped content', async () => {
    const user = userEvent.setup();
    mocked.getCall.mockResolvedValue({
      id: 'call-2',
      prospect_name: 'Grace Hopper',
      status: 'completed',
    });
    mocked.getStageResults.mockResolvedValue([]);
    mocked.getCallSummary.mockRejectedValue(new Error('AI service unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithPath(
      <Routes>
        <Route path="/history/:id" element={<CallDetail />} />
      </Routes>,
      '/history/call-2'
    );
    await screen.findByRole('heading', { name: 'Grace Hopper' });
    await user.click(screen.getByRole('button', { name: 'Generate Summary' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('AI service unavailable');
    expect(screen.queryByText(/High interest demonstrated in workflow automation/)).not.toBeInTheDocument();
    warn.mockRestore();
  });
});
