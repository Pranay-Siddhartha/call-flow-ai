import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, CalendarClock, Ban, UserX, PhoneMissed, HelpCircle, Loader2 } from 'lucide-react';

const OUTCOMES = [
  {
    id: 'meeting_booked',
    label: 'Meeting Booked',
    icon: CalendarCheck,
    color: 'emerald',
    badge: '✅',
    desc: 'Demo or technical session locked in'
  },
  {
    id: 'callback_scheduled',
    label: 'Callback Scheduled',
    icon: CalendarClock,
    color: 'blue',
    badge: '📅',
    desc: 'Prospect agreed to a specific callback time'
  },
  {
    id: 'agreed_to_receive_report',
    label: 'Agreed to Receive Doc',
    icon: CalendarCheck,
    color: 'indigo',
    badge: '📄',
    desc: 'Agreed to review one-pager / report on WhatsApp or email'
  },
  {
    id: 'referral_given',
    label: 'Referral Given',
    icon: UserX,
    color: 'teal',
    badge: '👥',
    desc: 'Referred to plant director or line manager'
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    icon: Ban,
    color: 'rose',
    badge: '❌',
    desc: 'Has vendor, no budget, or timing mismatch'
  },
  {
    id: 'wrong_person',
    label: 'Wrong Person',
    icon: UserX,
    color: 'amber',
    badge: '🔄',
    desc: 'Retired, left company, or wrong department'
  },
  {
    id: 'do_not_call',
    label: 'Do Not Call',
    icon: Ban,
    color: 'red',
    badge: '🚫',
    desc: 'Explicitly asked to be removed from list'
  },
  {
    id: 'no_answer',
    label: 'No Answer',
    icon: PhoneMissed,
    color: 'slate',
    badge: '📵',
    desc: 'Voicemail, unanswered, or line dropped immediately'
  },
  {
    id: 'other',
    label: 'Other',
    icon: HelpCircle,
    color: 'purple',
    badge: '💬',
    desc: 'Custom outcome or wrap-up'
  },
];

/**
 * CallEndModal Component
 * @param {boolean} isOpen Modal visibility
 * @param {Function} onClose Callback when modal is dismissed
 * @param {Function} onEnd Callback when user confirms ending call ({ final_outcome, notes })
 * @param {boolean} isSubmitting Loading state while saving
 */
export default function CallEndModal({ isOpen, onClose, onEnd, isSubmitting = false }) {
  const [selectedOutcome, setSelectedOutcome] = useState('meeting_booked');
  const [notes, setNotes] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOutcome('meeting_booked');
      setNotes('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOutcome) return;
    onEnd({
      final_outcome: selectedOutcome,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">End This Call</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the final outcome and record any wrap-up notes.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Outcome Radio / Card Group */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Final Outcome <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {OUTCOMES.map((item) => {
                const isSelected = selectedOutcome === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOutcome(item.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#0029FF] bg-blue-50/60 ring-2 ring-[#0029FF]/20 text-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base leading-none select-none mt-0.5">{item.badge}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional wrap-up notes */}
          <div>
            <label
              htmlFor="end-call-notes"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Call Summary & Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="end-call-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Agreed on 15 min demo next Tuesday 2pm. Mentioned budget opens in Q2..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all resize-none shadow-inner"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedOutcome}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0029FF] text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Closing Call...</span>
                </>
              ) : (
                <span>End Call & Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
