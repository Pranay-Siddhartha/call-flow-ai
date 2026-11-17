import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, PhoneCall, Building2, User, ArrowRight, Loader2 } from 'lucide-react';
import { createCall } from '../api/client';

/**
 * StartCallModal Component
 * Allows the caller to initiate a new call session from anywhere in the app.
 */
export default function StartCallModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [prospectName, setProspectName] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  if (!isOpen) return null;

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
      const createdCall = response?.data || response?.call || response;
      const callId = createdCall?.id;

      if (callId) {
        onClose();
        navigate(`/call/${callId}`);
      } else {
        throw new Error('Call created but no ID was returned.');
      }
    } catch (err) {
      console.warn('API error when creating call:', err);
      // Fallback local session if backend offline
      const fallbackId = 'demo-' + crypto.randomUUID();
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0029FF] flex items-center justify-center text-white shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Start New Call</h3>
              <p className="text-xs text-slate-500">Launch 8-stage cold call companion</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleStartCall} className="p-6 space-y-4">
          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800" role="alert">
              {errorNotice}
            </div>
          )}

          <div>
            <label
              htmlFor="modalProspectName"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Prospect Name</span>
              <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="modalProspectName"
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="modalProspectCompany"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Prospect Company</span>
              <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="modalProspectCompany"
              type="text"
              value={prospectCompany}
              onChange={(e) => setProspectCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
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
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#0029FF] text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span>Launch Call</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
