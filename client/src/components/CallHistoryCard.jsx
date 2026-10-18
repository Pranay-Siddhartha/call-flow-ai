import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, User, Building, PhoneForwarded } from 'lucide-react';

const STATUS_CONFIG = {
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-[#0029FF] border-blue-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  abandoned: {
    label: 'Abandoned',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

const OUTCOME_LABELS = {
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

/**
 * Format timestamp into readable date and time
 */
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

/**
 * CallHistoryCard Component
 * @param {Object} call Call row from database
 */
export default function CallHistoryCard({ call }) {
  const navigate = useNavigate();

  if (!call) return null;

  const prospectName = call.prospect_name || 'Unknown Prospect';
  const company = call.prospect_company;
  const statusInfo = STATUS_CONFIG[call.status] || {
    label: call.status || 'Unknown',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const stageReached = call.current_stage || 1;
  const outcomeLabel = call.final_outcome ? OUTCOME_LABELS[call.final_outcome] || call.final_outcome : null;

  return (
    <div
      onClick={() => navigate(`/history/${call.id}`)}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#0029FF] hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Prospect & Date info */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0029FF] transition-colors truncate">
              {prospectName}
            </h3>
            {company && (
              <span className="text-sm font-semibold text-slate-500 flex items-center gap-1 truncate">
                <span>at</span>
                <span className="text-slate-700">{company}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(call.started_at || call.created_at)}</span>
            </span>

            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <PhoneForwarded className="w-3.5 h-3.5 text-blue-500" />
              <span>Reached stage {stageReached} of 8</span>
            </span>
          </div>
        </div>

        {/* Right: Badges & Navigation Arrow */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {/* Status Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>

          {/* Outcome Badge if available */}
          {outcomeLabel && (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {outcomeLabel}
            </span>
          )}

          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-[#0029FF] transition-colors">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Outcome visible on mobile */}
      {outcomeLabel && (
        <div className="sm:hidden mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Outcome:</span>
          <span className="font-semibold text-slate-800">{outcomeLabel}</span>
        </div>
      )}
    </div>
  );
}
