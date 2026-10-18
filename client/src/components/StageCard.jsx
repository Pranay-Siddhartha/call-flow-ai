import React, { useState } from 'react';
import { Lightbulb, MessageSquareQuote, ChevronDown, ChevronUp, Plus, Info } from 'lucide-react';

/**
 * StageCard Component
 * Follows the assignment reference screen layout:
 * - Stage number and name
 * - What it is for (purpose)
 * - What tends to happen / She may say (with direct quotes from transcripts)
 * - Her words (prospect's exact words)
 * - Caller notes
 */
export default function StageCard({
  stage,
  prospectWords = '',
  onProspectWordsChange,
  callerNotes = '',
  onCallerNotesChange,
}) {
  const [showTendsToHappen, setShowTendsToHappen] = useState(true);

  if (!stage) return null;

  const handleUseExample = (example) => {
    const clean = example.replace(/^["']|["']$/g, '');
    if (onProspectWordsChange) {
      if (prospectWords && prospectWords.trim().length > 0) {
        onProspectWordsChange(`${prospectWords.trim()} ${clean}`);
      } else {
        onProspectWordsChange(clean);
      }
    }
  };

  const isStage5 = stage.number === 5;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      {/* Header: Stage badge, Name & Purpose */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#0029FF] bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
            Stage {stage.number} of 8
          </span>
          {isStage5 && (
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              Crucial: Capture exact words
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {stage.name}
        </h2>
        <div className="mt-2.5 text-sm sm:text-base text-slate-700 leading-relaxed font-normal bg-slate-50 border-l-4 border-[#0029FF] p-3 rounded-r-lg">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0029FF] mb-1">
            What it is for
          </p>
          <p>{stage.purpose}</p>
        </div>
      </div>

      {/* Two Guidance Columns: What Tends to Happen + Prospect May Say */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What tends to happen here (Assignment structural patterns) */}
        <div className="border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTendsToHappen(!showTendsToHappen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-slate-100/70 hover:bg-slate-200/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-[#0029FF]" />
              <span>What tends to happen here</span>
            </div>
            {showTendsToHappen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {showTendsToHappen && (
            <div className="p-3.5 text-xs text-slate-700 space-y-2">
              <ul className="space-y-2 list-none">
                {stage.tendsToHappen?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0029FF] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Prospect may say (Real quotes from transcripts) */}
        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <MessageSquareQuote className="w-3.5 h-3.5 text-slate-600" />
              <span>Prospect may say (tap to use)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">From 100 transcripts</span>
          </div>

          <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
            {stage.prospectExamples?.map((quote, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseExample(quote)}
                className="w-full group flex items-start justify-between text-left p-2 rounded-lg border border-slate-200 hover:border-[#0029FF] hover:bg-blue-50/40 transition-all text-slate-700 text-xs"
              >
                <span className="italic leading-snug group-hover:text-blue-900">{quote}</span>
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0029FF] ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prospect's Words (The central capture box) */}
      <div className="space-y-4 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="prospect-words"
              className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2"
            >
              <span>Prospect's Words</span>
              <span className="font-normal normal-case text-xs text-slate-500">
                {isStage5 ? '(Hear their struggle in their own words — do not summarize)' : '(Their exact words)'}
              </span>
            </label>
            {prospectWords && (
              <button
                type="button"
                onClick={() => onProspectWordsChange('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            id="prospect-words"
            rows={isStage5 ? 4 : 3}
            value={prospectWords}
            onChange={(e) => onProspectWordsChange(e.target.value)}
            placeholder={
              isStage5
                ? "Write down their exact words about their bottleneck, plant, product, or goals..."
                : "Type what the prospect is saying right now..."
            }
            className={`w-full rounded-xl border p-3.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner ${
              isStage5
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-300 bg-white'
            }`}
          />
        </div>

        {/* Caller Notes */}
        <div>
          <label
            htmlFor="caller-notes"
            className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
          >
            <span>Your Notes</span>
            <span className="text-xs font-normal text-slate-500 ml-1.5">(Context, follow-up reminders)</span>
          </label>
          <textarea
            id="caller-notes"
            rows={2}
            value={callerNotes}
            onChange={(e) => onCallerNotesChange(e.target.value)}
            placeholder="Personal observations, next action cues..."
            className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
