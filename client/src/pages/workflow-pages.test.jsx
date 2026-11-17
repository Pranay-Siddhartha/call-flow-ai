import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import CallerScreen from './CallerScreen';

const mocked = vi.hoisted(() => ({
  createCall: vi.fn(),
  getAiSuggestion: vi.fn(),
  useCall: vi.fn(),
  saveStage: vi.fn(),
  closeCall: vi.fn(),
  setCurrentStage: vi.fn(),
}));

vi.mock('../api/client', () => ({
  createCall: mocked.createCall,
  getAiSuggestion: mocked.getAiSuggestion,
}));

vi.mock('../hooks/useCall', () => ({
  useCall: mocked.useCall,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

function renderCaller() {
  return render(
    <MemoryRouter initialEntries={['/call/call-1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/call/:id" element={<CallerScreen />} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );
}

describe('homepage workflow', () => {
  it('renders branding and opens the guest call workflow without login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Make every cold call/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call Flow AI home' })).toHaveAttribute('href', '/');
    await user.click(screen.getByRole('button', { name: 'Launch Cold Call Companion' }));
    expect(screen.getByRole('heading', { name: 'Start New Call' })).toBeInTheDocument();
    expect(screen.getByText('No login required')).toBeInTheDocument();
  });
});

describe('live call workflow page', () => {
  beforeEach(() => {
    mocked.getAiSuggestion.mockReset();
    mocked.saveStage.mockReset();
    mocked.closeCall.mockReset();
    mocked.setCurrentStage.mockReset();
    mocked.useCall.mockReturnValue({
      call: {
        id: 'call-1',
        prospect_name: 'Grace Hopper',
        prospect_company: 'Compiler Co.',
      },
      stageResults: [],
      currentStage: 1,
      setCurrentStage: mocked.setCurrentStage,
      saveStage: mocked.saveStage,
      closeCall: mocked.closeCall,
      isLoading: false,
      error: null,
    });
  });

  it('requests a stage-specific AI suggestion and displays the response', async () => {
    const user = userEvent.setup();
    mocked.getAiSuggestion.mockResolvedValue({ suggestion: 'Ask about the compiler workflow.' });
    renderCaller();

    await user.type(screen.getByLabelText(/Prospect's Words/), 'We are modernizing our tooling.');
    await user.click(screen.getByRole('button', { name: 'Get AI Suggestion' }));

    expect(mocked.getAiSuggestion).toHaveBeenCalledWith(expect.objectContaining({
      call_id: 'call-1',
      stage_number: 1,
      stage_name: 'Opening',
      prospect_words: 'We are modernizing our tooling.',
    }));
    expect(await screen.findByText('Ask about the compiler workflow.')).toBeInTheDocument();
  });

  it('keeps the call open and shows an error when closing fails', async () => {
    const user = userEvent.setup();
    mocked.closeCall.mockRejectedValue(new Error('Could not persist call closure'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCaller();

    await user.click(screen.getByRole('button', { name: 'End Call' }));
    await user.click(screen.getByRole('button', { name: /Meeting Booked/ }));
    await user.click(screen.getByRole('button', { name: 'End Call & Save' }));

    expect(await screen.findAllByText('Could not persist call closure')).toHaveLength(2);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/call/call-1');
    expect(screen.getByRole('heading', { name: 'End This Call' })).toBeInTheDocument();
    log.mockRestore();
  });
});
