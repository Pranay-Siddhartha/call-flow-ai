import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRightCircle,
  SkipForward,
  Clock,
  Loader2,
  Play,
  RotateCw,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { getCall, getStageResults, getCallSummary } from '../api/client';
import { STAGES } from '../data/stages';

const OUTCOME_CONFIG = {
  positive: {
    label: 'Went Well',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  neutral: {
    label: 'Neutral',
    icon: ArrowRightCircle,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  negative: {
    label: 'Objection / Pushback',
    icon: AlertCircle,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  skipped: {
    label: 'Skipped',
    icon: SkipForward,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-300',
  },
};

const FINAL_OUTCOME_LABELS = {
  meeting_booked: 'Meeting Booked ✅',
  callback_scheduled: 'Callback Scheduled 📅',
  agreed_to_receive_report: 'Agreed to Receive Doc 📄',
  referral_given: 'Referral Given 👥',
  not_interested: 'Not Interested ❌',
  wrong_person: 'Wrong Person 🔄',
  do_not_call: 'Do Not Call 🚫',
  no_answer: 'No Answer 📵',
  other: 'Other 💬',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function CallDetail() {
  const { id } = useParams();
  const [call, setCall] = useState(null);
  const [stageResults, setStageResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [callDataRes, stagesDataRes] = await Promise.allSettled([
        getCall(id),
        getStageResults(id),
      ]);

      if (callDataRes.status === 'fulfilled') {
        const val = callDataRes.value;
        setCall(val?.data || val?.call || val);
      } else {
        throw new Error(callDataRes.reason?.message || 'Failed to load call');
      }

      if (stagesDataRes.status === 'fulfilled') {
        const val = stagesDataRes.value;
        const list = Array.isArray(val) ? val : val?.stages || val?.data || [];
        setStageResults(list);
      } else {
        throw new Error(stagesDataRes.reason?.message || 'Failed to load call stages');
      }
    } catch (err) {
      console.warn('Error loading call details:', err);
      setError(err.message || 'Unable to load call details from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Request or generate AI Call Summary
  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const res = await getCallSummary({ call_id: id });
      const summaryText = res?.summary || res?.call_summary || res?.data?.summary;
      if (summaryText) {
        setCall((prev) => ({ ...prev, call_summary: summaryText }));
      }
    } catch (err) {
      console.warn('AI summary generation error:', err);
      setSummaryError(err.message || 'Could not generate a call summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
        <Loader2 className="w-8 h-8 text-[#0029FF] animate-spin" />
        <span className="text-sm font-medium">Loading call details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>
        <button
          type="button"
          onClick={fetchDetail}
          className="rounded-xl bg-[#0029FF] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Create lookup for completed stage results
  const stageResultsMap = new Map();
  stageResults.forEach((r) => {
    stageResultsMap.set(Number(r.stage_number), r);
  });

  const prospectName = call?.prospect_name || 'Unknown Prospect';
  const finalOutcome = call?.final_outcome ? FINAL_OUTCOME_LABELS[call.final_outcome] || call.final_outcome : 'Not recorded';

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#0029FF] transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Calls</span>
        </Link>

        {call?.status === 'in_progress' && (
          <Link
            to={`/call/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0029FF] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Resume Call</span>
          </Link>
        )}
      </div>

      {/* Call Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {prospectName}
              </h1>
              {call?.prospect_company && (
                <span className="text-base sm:text-lg font-semibold text-slate-500 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{call.prospect_company}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(call?.started_at || call?.created_at)}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Reached Stage {call?.current_stage || 1} of 8</span>
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                call?.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : call?.status === 'abandoned'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-blue-100 text-[#0029FF] border-blue-200'
              }`}
            >
              {call?.status === 'completed'
                ? 'Completed'
                : call?.status === 'abandoned'
                ? 'Abandoned'
                : 'In Progress'}
            </span>

            {call?.final_outcome && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs">
                {finalOutcome}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white border border-blue-200/80 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0029FF] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">AI Call Summary</h2>
              <p className="text-xs text-slate-500">Post-call intelligence & next actions</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSummarizing}
            onClick={handleGenerateSummary}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0029FF] hover:text-blue-800 hover:underline px-2.5 py-1 rounded-lg disabled:opacity-50"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : call?.call_summary ? (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>

        {summaryError && (
          <p role="alert" className="text-sm font-medium text-rose-700">{summaryError}</p>
        )}

        {call?.call_summary ? (
          <div className="bg-white/80 rounded-2xl p-4 border border-blue-100/80 text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
            {call.call_summary}
          </div>
        ) : (
          <div className="bg-white/60 rounded-2xl p-4 border border-dashed border-blue-200 text-xs text-slate-500 text-center space-y-1">
            <p>No AI summary generated for this call yet.</p>
            <p className="text-slate-400">Click &quot;Generate Summary&quot; to synthesize prospect objections and outcomes.</p>
          </div>
        )}
      </div>

      {/* Timeline of Stages */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <span>Call Stage Breakdown</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {stageResults.length} of 8 recorded
          </span>
        </div>

        <div className="space-y-4">
          {STAGES.map((stage) => {
            const result = stageResultsMap.get(stage.number);
            const isRecorded = !!result;
            const outcomeLabel = result ? (OUTCOME_CONFIG[result.outcome]?.label || result.outcome) : null;
            const outcomeInfo = result ? (OUTCOME_CONFIG[result.outcome] || {
              label: result.outcome,
              icon: CheckCircle2,
              badgeClass: 'bg-blue-100 text-[#0029FF] border-blue-200'
            }) : null;
            const OutcomeIcon = outcomeInfo?.icon || CheckCircle2;

            if (!isRecorded) {
              // Dimmed / Not Reached Stage
              return (
                <div
                  key={stage.number}
                  className="bg-white/60 rounded-2xl border border-dashed border-slate-200 p-4.5 opacity-60 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold">
                        {stage.number}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-600">{stage.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{stage.purpose}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 italic">Not reached</span>
                  </div>
                </div>
              );
            }

            // Recorded Stage Details
            return (
              <div
                key={stage.number}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Stage Header */}
                <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0029FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {stage.number}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{stage.name}</h3>
                      <p className="text-xs text-slate-500">{stage.purpose}</p>
                    </div>
                  </div>

                  {/* Outcome Badge */}
                  {outcomeInfo && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${outcomeInfo.badgeClass}`}
                    >
                      <OutcomeIcon className="w-3.5 h-3.5" />
                      <span>{outcomeInfo.label}</span>
                    </div>
                  )}
                </div>

                {/* Prospect Words Quote */}
                {result.prospect_words && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border-l-4 border-l-slate-400 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Prospect Said:
                    </div>
                    <p className="text-sm text-slate-800 italic leading-relaxed">
                      &quot;{result.prospect_words}&quot;
                    </p>
                  </div>
                )}

                {/* Caller Notes */}
                {result.caller_notes && (
                  <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/60 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Caller Notes:
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {result.caller_notes}
                    </p>
                  </div>
                )}

                {/* AI Coaching Suggestion */}
                {result.ai_suggestion && (
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-200/60 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0029FF] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Coaching Advice Shown:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {result.ai_suggestion}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
