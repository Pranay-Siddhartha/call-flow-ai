import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AiSuggestion from './AiSuggestion';
import CallEndModal from './CallEndModal';
import StageCard from './StageCard';
import StageProgress from './StageProgress';
import StartCallModal from './StartCallModal';
import { STAGES } from '../data/stages';

const mocked = vi.hoisted(() => ({
  createCall: vi.fn(),
}));

vi.mock('../api/client', () => ({
  createCall: mocked.createCall,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

describe('stage components', () => {
  it('marks progress and supports keyboard stage navigation', async () => {
    const user = userEvent.setup();
    const onSelectStage = vi.fn();
    render(
      <StageProgress
        currentStage={3}
        stageResults={[{ stage_number: 1, outcome: 'Reached' }]}
        onSelectStage={onSelectStage}
      />
    );

    expect(screen.getByRole('button', { name: 'Stage 3: Permission' })).toHaveAttribute('aria-current', 'step');
    await user.tab();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onSelectStage).toHaveBeenCalledWith(3);
    expect(screen.getByText('Stage 3 of 8:')).toBeInTheDocument();
  });

  it('preserves quote punctuation and newlines and appends examples without rewriting them', async () => {
    const user = userEvent.setup();
    const onProspectWordsChange = vi.fn();
    const stage = {
      ...STAGES[4],
      prospectExamples: ['"We need a clearer plan, don’t we?"'],
    };
    render(
      <StageCard
        stage={stage}
        prospectWords={'  First line.\nSecond line!'}
        onProspectWordsChange={onProspectWordsChange}
        onCallerNotesChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Prospect's Words/)).toHaveValue('  First line.\nSecond line!');
    await user.click(screen.getByRole('button', { name: /We need a clearer plan/ }));
    expect(onProspectWordsChange).toHaveBeenCalledWith(
      'First line.\nSecond line! We need a clearer plan, don’t we?'
    );
  });

  it('renders AI loading, retry, and suggestion states', async () => {
    const onRequest = vi.fn();
    const { rerender } = render(<AiSuggestion loading onRequest={onRequest} />);
    expect(screen.getByText(/Analyzing prospect response/)).toBeInTheDocument();

    rerender(<AiSuggestion error="Service unavailable" onRequest={onRequest} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRequest).toHaveBeenCalledOnce();

    rerender(<AiSuggestion suggestion={'Advice\nwith details'} onRequest={onRequest} />);
    expect(screen.getByText(/Advice\s+with details/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
  });

  it('submits a selected final outcome and trimmed notes; Escape cancels', async () => {
    const user = userEvent.setup();
    const onEnd = vi.fn();
    const onClose = vi.fn();
    render(<CallEndModal isOpen onEnd={onEnd} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Not Interested/ }));
    await user.type(screen.getByLabelText(/Call Summary & Notes/), '  No follow-up  ');
    await user.click(screen.getByRole('button', { name: 'End Call & Save' }));
    expect(onEnd).toHaveBeenCalledWith({
      final_outcome: 'not_interested',
      notes: 'No follow-up',
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('call-start modal', () => {
  it('trims optional prospect details and navigates to the created call', async () => {
    const user = userEvent.setup();
    mocked.createCall.mockResolvedValueOnce({ id: 'new-call' });
    const onClose = vi.fn();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <StartCallModal isOpen onClose={onClose} />
        <LocationDisplay />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/Prospect Name/), '  Ada Lovelace  ');
    await user.type(screen.getByLabelText(/Prospect Company/), '  Engine Works  ');
    await user.click(screen.getByRole('button', { name: /Launch Call/ }));

    expect(mocked.createCall).toHaveBeenCalledWith({
      prospect_name: 'Ada Lovelace',
      prospect_company: 'Engine Works',
      status: 'in_progress',
      current_stage: 1,
    });
    expect(await screen.findByLabelText('Current route')).toHaveTextContent('/call/new-call');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
