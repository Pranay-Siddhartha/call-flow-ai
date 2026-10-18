import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, RefreshCw, PhoneCall, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { getCalls } from '../api/client';
import CallHistoryCard from '../components/CallHistoryCard';

const FILTER_TABS = [
  { id: 'all', label: 'All Calls' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'abandoned', label: 'Abandoned' },
];

export default function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCallsList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = activeFilter === 'all' ? undefined : activeFilter;
      const res = await getCalls(statusParam);
      const data = Array.isArray(res) ? res : res?.data || res?.calls || [];
      setCalls(data);
    } catch (err) {
      console.warn('Error fetching calls:', err);
      setError('Could not reach backend server to load calls history.');
      // Keep existing calls or empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallsList();
  }, [activeFilter]);

  // Client-side text filter for search query
  const filteredCalls = calls.filter((call) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = call.prospect_name?.toLowerCase().includes(query);
    const companyMatch = call.prospect_company?.toLowerCase().includes(query);
    const notesMatch = call.call_summary?.toLowerCase().includes(query);
    return nameMatch || companyMatch || notesMatch;
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header with Title and Start New Call Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Call History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review past cold calls, stages reached, outcomes, and AI coach summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCallsList}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0029FF] hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Call</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0029FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prospect or company..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchCallsList}
            className="underline font-bold hover:text-amber-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calls List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-[#0029FF] animate-spin" />
          <span className="text-sm font-medium">Loading call records...</span>
        </div>
      ) : filteredCalls.length > 0 ? (
        <div className="space-y-3">
          {filteredCalls.map((call) => (
            <CallHistoryCard key={call.id} call={call} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 py-16 px-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0029FF] flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery ? 'No calls matched your search' : 'No calls yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filter tab.'
                : 'Start your first structured cold call to get AI coaching and outcome tracking.'}
            </p>
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0029FF] hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Start Your First Call!</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
