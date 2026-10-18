import React from 'react';
import { Sparkles, Loader2, RotateCw, Lightbulb } from 'lucide-react';

/**
 * AiSuggestion Component
 * @param {string} suggestion AI suggestion text or null
 * @param {boolean} loading Loading state
 * @param {Function} onRequest Callback to trigger AI coaching suggestion
 * @param {string} [error] Optional error message if API failed
 */
export default function AiSuggestion({ suggestion, loading = false, onRequest, error = null }) {
  return (
    <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0029FF] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>AI Coach</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-blue-100 text-[#0029FF] rounded">
                Live
              </span>
            </h3>
          </div>
        </div>

        {/* Refresh button if suggestion already exists */}
        {suggestion && !loading && onRequest && (
          <button
            type="button"
            onClick={onRequest}
            className="flex items-center gap-1 text-xs font-semibold text-[#0029FF] hover:text-blue-800 hover:underline px-2 py-1 rounded"
            title="Get another recommendation"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {/* Body state: Loading, No Suggestion, Error, or Suggestion Content */}
      {loading ? (
        <div className="flex items-center gap-3 py-3 px-3 bg-white/80 rounded-xl border border-blue-100 text-slate-600 animate-pulse">
          <Loader2 className="w-5 h-5 text-[#0029FF] animate-spin shrink-0" />
          <div className="space-y-1.5 flex-1">
            <p className="text-sm font-medium text-slate-700">Analyzing prospect response & crafting advice...</p>
            <div className="h-2 bg-blue-100 rounded w-5/6" />
          </div>
        </div>
      ) : error ? (
        <div className="py-2.5 px-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          {onRequest && (
            <button
              type="button"
              onClick={onRequest}
              className="font-bold underline ml-2 hover:text-rose-900"
            >
              Retry
            </button>
          )}
        </div>
      ) : suggestion ? (
        <div className="relative pl-4 pr-3 py-3 bg-white/90 rounded-xl border-l-4 border-l-[#0029FF] border border-slate-200/80 shadow-xs">
          <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
            {suggestion}
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Need advice or an objection pivot? Ask your AI copilot.</span>
          </div>

          <button
            type="button"
            onClick={onRequest}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0029FF] hover:bg-blue-700 active:scale-95 text-white shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Get AI Suggestion</span>
          </button>
        </div>
      )}
    </div>
  );
}
