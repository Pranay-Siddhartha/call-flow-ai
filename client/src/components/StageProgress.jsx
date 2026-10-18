import React from 'react';
import { Check } from 'lucide-react';
import { STAGES } from '../data/stages';

/**
 * StageProgress Component
 * @param {number} currentStage Active stage number (1-8)
 * @param {Array} stageResults Completed stage results
 * @param {Function} onSelectStage Callback when a stage step is clicked (optional)
 */
export default function StageProgress({ currentStage = 1, stageResults = [], onSelectStage }) {
  // Map of completed stage numbers
  const completedStages = new Set(
    stageResults
      .filter((r) => r && r.outcome)
      .map((r) => Number(r.stage_number))
  );

  return (
    <div className="w-full bg-white border-b border-slate-200 py-3.5 px-4 shadow-xs">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between relative">
          {STAGES.map((stage, index) => {
            const isCurrent = stage.number === currentStage;
            const isCompleted = completedStages.has(stage.number) || stage.number < currentStage;
            const isUpcoming = !isCurrent && !isCompleted;
            const isClickable = !!onSelectStage;

            return (
              <React.Fragment key={stage.number}>
                {/* Stage Step Item */}
                <div
                  className={`flex flex-col items-center relative z-10 group ${
                    isClickable ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => isClickable && onSelectStage(stage.number)}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  title={`Stage ${stage.number}: ${stage.name}`}
                >
                  {/* Circle Indicator */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isCurrent
                        ? 'bg-[#0029FF] text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/30 scale-105'
                        : isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                        : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <span>{stage.number}</span>
                    )}
                  </div>

                  {/* Stage Label (hidden on small screens, shown on desktop) */}
                  <span
                    className={`hidden md:block mt-1.5 text-xs font-semibold text-center max-w-[80px] truncate transition-colors ${
                      isCurrent
                        ? 'text-[#0029FF] font-bold'
                        : isCompleted
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500 font-normal'
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>

                {/* Connecting Line between stages */}
                {index < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors duration-300 ${
                      stage.number < currentStage || completedStages.has(stage.number)
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile current stage label */}
        <div className="md:hidden mt-2 text-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Stage {currentStage} of 8:
          </span>{' '}
          <span className="text-xs font-bold text-[#0029FF]">
            {STAGES.find((s) => s.number === currentStage)?.name}
          </span>
        </div>
      </div>
    </div>
  );
}
