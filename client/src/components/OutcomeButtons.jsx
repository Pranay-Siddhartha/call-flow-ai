import React from 'react';
import { CheckCircle2, ChevronRight, SkipForward } from 'lucide-react';

/**
 * OutcomeButtons Component
 * Renders the stage-specific one-tap controls as demonstrated in the reference screen.
 * 
 * @param {Object} stage Current stage object containing oneTapOutcomes
 * @param {string} selectedOutcome Currently selected outcome ID or label
 * @param {Function} onSelectOutcome Callback when an outcome is tapped
 * @param {Function} onNextStage Callback to advance to the next stage
 * @param {string} nextStageName Name of the upcoming stage
 * @param {boolean} disabled Whether actions are disabled
 */
export default function OutcomeButtons({
  stage,
  selectedOutcome,
  onSelectOutcome,
  onNextStage,
  nextStageName = 'Next Stage',
  disabled = false
}) {
  const outcomes = stage?.oneTapOutcomes || [
    { id: 'positive', label: 'Went Well', sentiment: 'positive' },
    { id: 'neutral', label: 'Neutral', sentiment: 'neutral' },
    { id: 'negative', label: 'Pushback', sentiment: 'negative' },
    { id: 'skipped', label: 'Skipped', sentiment: 'neutral' }
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur border-t border-slate-200 p-4 sm:p-5 shadow-xl">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header / Question */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            What happened at Stage {stage?.number || ''}? (One-tap record)
          </p>
          {selectedOutcome && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recorded: <span className="font-bold">{selectedOutcome}</span>
            </span>
          )}
        </div>

        {/* 4 Stage-Specific One-Tap Buttons in 2x2 or 4x1 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {outcomes.map((item) => {
            const isSelected = selectedOutcome === item.label || selectedOutcome === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectOutcome(item.label)}
                className={`px-3 py-3 rounded-xl text-center text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 ${
                  isSelected
                    ? 'bg-[#0029FF] text-white ring-4 ring-blue-200 shadow-blue-500/30'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Navigation row: Next Stage & Skip */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelectOutcome('Skipped')}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors py-1 px-2"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip this stage</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={onNextStage}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#0029FF] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-[0.05em] transition-colors shadow-md active:scale-95 disabled:opacity-50"
          >
            <span>{nextStageName ? `Next: ${nextStageName}` : 'Finish Call'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
