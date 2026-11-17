import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PhoneOff, ArrowLeft, Building2, User, Clock, AlertTriangle, CheckCircle2, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STAGES, getStageByNumber } from '../data/stages';
import StageProgress from '../components/StageProgress';
import StageCard from '../components/StageCard';
import OutcomeButtons from '../components/OutcomeButtons';
import AiSuggestion from '../components/AiSuggestion';
import CallEndModal from '../components/CallEndModal';
import { useCall } from '../hooks/useCall';
import { getAiSuggestion } from '../api/client';

export default function CallerScreen() {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    call,
    stageResults,
    currentStage,
    setCurrentStage,
    saveStage,
    closeCall,
    isLoading: isCallLoading,
    error: callError,
  } = useCall(callId);

  // Per-stage local edits: { [stageNum]: { prospectWords, callerNotes, aiSuggestion, outcome } }
  const [stagesState, setStagesState] = useState({});

  // AI Suggestion specific states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Modal and action states
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Live Call Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync loaded stage results into local stagesState
  useEffect(() => {
    if (stageResults && stageResults.length > 0) {
      setStagesState((prev) => {
        const nextState = { ...prev };
        stageResults.forEach((res) => {
          const num = Number(res.stage_number);
          nextState[num] = {
            prospectWords: res.prospect_words || nextState[num]?.prospectWords || '',
            callerNotes: res.caller_notes || nextState[num]?.callerNotes || '',
            aiSuggestion: res.ai_suggestion || nextState[num]?.aiSuggestion || '',
            outcome: res.outcome || nextState[num]?.outcome || null,
          };
        });
        return nextState;
      });
    }
  }, [stageResults]);

  // Current stage object & data
  const activeStageObject = getStageByNumber(currentStage);
  const currentStageData = stagesState[currentStage] || {
    prospectWords: '',
    callerNotes: '',
    aiSuggestion: '',
    outcome: null,
  };

  // Handlers to update current stage's fields
  const handleProspectWordsChange = (val) => {
    setStagesState((prev) => ({
      ...prev,
      [currentStage]: {
        ...(prev[currentStage] || {}),
        prospectWords: val,
      },
    }));
  };

  const handleCallerNotesChange = (val) => {
    setStagesState((prev) => ({
      ...prev,
      [currentStage]: {
        ...(prev[currentStage] || {}),
        callerNotes: val,
      },
    }));
  };

  // Request AI Suggestion
  const handleRequestAiSuggestion = async () => {
    setIsAiLoading(true);
    setAiError(null);

    const payload = {
      call_id: callId,
      stage_number: currentStage,
      stage_name: activeStageObject.name,
      stage_purpose: activeStageObject.purpose,
      prospect_words: currentStageData.prospectWords || '',
      caller_notes: currentStageData.callerNotes || '',
      prospect_name: call?.prospect_name,
      prospect_company: call?.prospect_company,
    };

    try {
      const response = await getAiSuggestion(payload);
      const suggestionText =
        response?.suggestion ||
        response?.data?.suggestion ||
        (typeof response === 'string' ? response : 'Acknowledge their concern directly and propose a quick 15-minute sync next week.');

      setStagesState((prev) => ({
        ...prev,
        [currentStage]: {
          ...(prev[currentStage] || {}),
          aiSuggestion: suggestionText,
        },
      }));
    } catch (err) {
      console.warn('AI Suggestion error:', err);
      // Fallback helpful contextual suggestion if API offline
      const fallbackTips = {
        1: `Reach the person: "Hi ${call?.prospect_name || 'there'}, this is calling regarding your manufacturing operations. Did I catch you at a workable moment?"`,
        2: `State purpose in one repeatable line: "We help manufacturing leaders unlock capacity and eliminate production bottlenecks through a practical AI-enabled workflow."`,
        3: `Secure permission: "I know you weren't expecting my call. Do you have two minutes to see if this is relevant, or would later today after 2 PM be better?"`,
        4: `Ask about their company first: "Before I say anything about our platform, could you tell me a little about your plant operations and what products you focus on?"`,
        5: `Crucial — Listen and record: Ask what their biggest bottleneck or growth target is right now. Write down their exact words without interpreting.`,
        6: `Address the objection empathetically: "I completely understand you already have an existing system. We don't replace your ERP; we provide the ontology layer to make that data actionable."`,
        7: `Agree on one concrete next step: "Why don't we do a 15-minute working session next Tuesday after 2 PM with our technical founder? Would that work for you?"`,
        8: `Clear confirmation & close: "I have you down for next Tuesday at 2 PM. I'll send the calendar invite and one-pager on WhatsApp right away. Thank you!"`,
      };

      const fallbackText =
        fallbackTips[currentStage] ||
        `Focus on acknowledging their response warmly and asking one open-ended question to regain conversational control.`;

      setStagesState((prev) => ({
        ...prev,
        [currentStage]: {
          ...(prev[currentStage] || {}),
          aiSuggestion: fallbackText,
        },
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle stage outcome tap (records what happened)
  const handleSelectOutcome = async (outcomeLabel) => {
    setIsSavingOutcome(true);
    setActionError(null);

    try {
      await saveStage({
        stageNumber: currentStage,
        outcome: outcomeLabel,
        prospectWords: currentStageData.prospectWords,
        callerNotes: currentStageData.callerNotes,
        aiSuggestion: currentStageData.aiSuggestion,
      });

      // Update local state with chosen outcome
      setStagesState((prev) => ({
        ...prev,
        [currentStage]: {
          ...(prev[currentStage] || {}),
          outcome: outcomeLabel,
        },
      }));
    } catch (err) {
      console.error('Error saving stage outcome:', err);
      setActionError(err.message || 'Could not save this stage. Please try again.');
    } finally {
      setIsSavingOutcome(false);
    }
  };

  // Advance to next stage (or trigger close at stage 8)
  const handleNextStage = async () => {
    setActionError(null);

    // If words or notes were typed but no outcome tapped yet, auto-save as recorded
    if (currentStageData.prospectWords || currentStageData.callerNotes || currentStageData.outcome) {
      try {
        await saveStage({
          stageNumber: currentStage,
          outcome: currentStageData.outcome || 'Progressed',
          prospectWords: currentStageData.prospectWords,
          callerNotes: currentStageData.callerNotes,
          aiSuggestion: currentStageData.aiSuggestion,
        });
      } catch (err) {
        console.error('Auto-save before next stage error:', err);
        setActionError(err.message || 'Could not save this stage. Please try again.');
        return;
      }
    }

    if (currentStage >= 8) {
      setShowEndModal(true);
    } else {
      setCurrentStage((prev) => Math.min(8, prev + 1));
    }
  };

  // End Call confirmed from modal
  const handleEndCallSubmit = async ({ final_outcome, notes }) => {
    setIsEndingCall(true);
    setActionError(null);
    try {
      await closeCall({
        finalOutcome: final_outcome,
        notes: notes,
        status: 'completed',
      });
      setShowEndModal(false);
      navigate(`/history/${callId}`);
    } catch (err) {
      console.error('Error ending call:', err);
      setActionError(err.message || 'Could not end the call. Please try again.');
    } finally {
      setIsEndingCall(false);
    }
  };

  // Prospect display names
  const prospectName =
    call?.prospect_name || location.state?.initialCall?.prospect_name || 'Prospect';
  const prospectCompany =
    call?.prospect_company || location.state?.initialCall?.prospect_company || null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
      {/* Top Call Info & Control Banner */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Prospect Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to="/"
              aria-label="Call Flow AI home"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0029FF] text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Headphones className="h-5 w-5" />
            </Link>
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white truncate">
                  {prospectName}
                </span>
                {prospectCompany && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 truncate">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{prospectCompany}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Call Active</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimer(secondsElapsed)}
                </span>
              </div>
            </div>
          </div>

          {/* End Call Action */}
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition-all active:scale-95 shrink-0"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Stage Progress Bar (Sticky below banner) */}
      <StageProgress
        currentStage={currentStage}
        stageResults={stageResults}
        onSelectStage={(stageNum) => setCurrentStage(stageNum)}
      />

      {/* Main Stage Content (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Back to previous stage navigation bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            {currentStage > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStage((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0029FF] py-1 px-2.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Review Stage {currentStage - 1}</span>
              </button>
            ) : (
              <span className="text-slate-400 italic">Call Starting Point</span>
            )}

            {currentStage < 8 && (
              <button
                type="button"
                onClick={() => setCurrentStage((s) => Math.min(8, s + 1))}
                className="hover:text-[#0029FF] transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-200/60"
              >
                Jump to Stage {currentStage + 1} &rarr;
              </button>
            )}
          </div>

          {/* Active Stage Card */}
          <StageCard
            stage={activeStageObject}
            prospectWords={currentStageData.prospectWords}
            onProspectWordsChange={handleProspectWordsChange}
            callerNotes={currentStageData.callerNotes}
            onCallerNotesChange={handleCallerNotesChange}
          />

          {/* AI Suggestion Panel */}
          <AiSuggestion
            suggestion={currentStageData.aiSuggestion}
            loading={isAiLoading}
            error={aiError}
            onRequest={handleRequestAiSuggestion}
          />
        </div>
      </div>

      {/* Bottom Sticky Outcome Actions */}
      <div className="sticky bottom-0 z-30 shrink-0 shadow-2xl">
        {actionError && (
          <p role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-800">
            {actionError}
          </p>
        )}
        <OutcomeButtons
          stage={activeStageObject}
          selectedOutcome={currentStageData.outcome}
          onSelectOutcome={handleSelectOutcome}
          onNextStage={handleNextStage}
          nextStageName={currentStage < 8 ? getStageByNumber(currentStage + 1).name : 'Wrap-Up & End Call'}
          disabled={isSavingOutcome}
        />
      </div>

      {/* End Call Modal */}
      <CallEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onEnd={handleEndCallSubmit}
        isSubmitting={isEndingCall}
        error={actionError}
      />
    </div>
  );
}
