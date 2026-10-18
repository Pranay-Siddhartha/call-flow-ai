import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PhoneCall, Building2, User, History, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { createCall } from '../api/client';

export default function HomePage() {
  const navigate = useNavigate();
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const handleStartCall = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorNotice(null);

    const callPayload = {
      prospect_name: prospectName.trim() || undefined,
      prospect_company: prospectCompany.trim() || undefined,
      status: 'in_progress',
      current_stage: 1,
    };

    try {
      const response = await createCall(callPayload);
      // Handles both direct response and { data: call } format
      const createdCall = response?.data || response?.call || response;
      const callId = createdCall?.id;

      if (callId) {
        navigate(`/call/${callId}`);
      } else {
        throw new Error('Call was created but no ID was returned.');
      }
    } catch (err) {
      console.warn('API error when creating call:', err);
      // If backend is offline, generate a mock UUID so user can still test the frontend workflow seamlessly
      const fallbackId = 'demo-' + crypto.randomUUID();
      console.info(`Falling back to local session ID: ${fallbackId}`);
      navigate(`/call/${fallbackId}`, {
        state: {
          offline: true,
          initialCall: {
            id: fallbackId,
            prospect_name: prospectName.trim() || 'Demo Prospect',
            prospect_company: prospectCompany.trim() || 'Demo Company',
            current_stage: 1,
            status: 'in_progress',
          },
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0029FF] text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Guided Cold Calling</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Cold Call <span className="text-[#0029FF]">Copilot</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
            Your real-time AI companion for structured cold calls. Stay confident, handle objections, and close next steps.
          </p>
        </div>

        {/* Start Call Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleStartCall} className="space-y-5">
            {errorNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {errorNotice}
              </div>
            )}

            {/* Prospect Name Input */}
            <div>
              <label
                htmlFor="prospectName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Prospect Name</span>
                <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="prospectName"
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner text-base"
              />
            </div>

            {/* Prospect Company Input */}
            <div>
              <label
                htmlFor="prospectCompany"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Prospect Company</span>
                <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="prospectCompany"
                type="text"
                value={prospectCompany}
                onChange={(e) => setProspectCompany(e.target.value)}
                placeholder="e.g. Acme Health Corp"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner text-base"
              />
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#0029FF] hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing Call Session...</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Start New Call</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick link to call history */}
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/history"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0029FF] transition-colors py-1 px-3 rounded-lg hover:bg-slate-50"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>View Call History & Past Transcripts</span>
            </Link>
          </div>
        </div>

        {/* 3 Pillar feature highlights */}
        <div className="grid grid-cols-3 gap-3 text-center pt-2">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-xs">
            <Zap className="w-4 h-4 text-[#0029FF] mx-auto mb-1" />
            <div className="text-xs font-bold text-slate-800">8 Proven Stages</div>
            <div className="text-[11px] text-slate-500">Battle-tested script flow</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
            <div className="text-xs font-bold text-slate-800">AI Coach</div>
            <div className="text-[11px] text-slate-500">Real-time objection pivots</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-xs font-bold text-slate-800">CRM Ready</div>
            <div className="text-[11px] text-slate-500">Auto notes & summaries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
