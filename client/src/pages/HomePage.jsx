import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Headphones,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  PhoneCall,
  Loader2,
  AlertCircle,
  Info,
  ShieldCheck,
  History
} from 'lucide-react';
import { loginUser } from '../api/auth';
import StartCallModal from '../components/StartCallModal';

export default function HomePage() {
  const navigate = useNavigate();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [authNotice, setAuthNotice] = useState(null);

  // Start Call modal state (preserves live call workflow)
  const [showStartModal, setShowStartModal] = useState(false);

  // Validation helper
  const validate = () => {
    const errors = {};
    if (!email || !email.trim()) {
      errors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setAuthNotice(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      /**
       * Integration Point:
       * Calls loginUser in src/api/auth.js.
       * Connects to Supabase Auth (`supabase.auth.signInWithPassword`)
       * or backend API (`/api/auth/login`).
       */
      const session = await loginUser({ email, password });
      
      // On successful authentication, open the call launcher or proceed to history
      setShowStartModal(true);
    } catch (err) {
      console.warn('Login attempt failed:', err);
      setFormError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setAuthNotice({
      type: 'info',
      title: 'Password Reset Integration',
      message:
        'Password reset is configured via Supabase Auth (e.g. supabase.auth.resetPasswordForEmail) or your corporate SMTP gateway.',
    });
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    setAuthNotice({
      type: 'info',
      title: 'Account Registration Integration',
      message:
        'New account registration can be linked to Supabase Auth (supabase.auth.signUp) or your enterprise SSO provider.',
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] w-full">
      {/* ========================================================= */}
      {/* LEFT PANEL — Call Flow AI Branding (50% on desktop)       */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 bg-[#0B1220] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        {/* Ambient subtle glow overlay */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0029FF 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />

        {/* Content Container */}
        <div className="relative z-10 space-y-8 my-auto max-w-xl mx-auto lg:mx-0">
          {/* Logo & Brand Header */}
          <Link
            to="/"
            aria-label="Call Flow AI home"
            className="flex w-fit items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0029FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
              <Headphones className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#6F8DFF] block">
                Caller Companion
              </span>
              <span className="text-2xl font-black tracking-tight text-white">
                Call Flow <span className="text-[#2F6BFF]">AI</span>
              </span>
            </div>
          </Link>

          {/* Headline & Description */}
          <div className="space-y-4 pt-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.08]">
              Make every cold call <span className="text-[#2F6BFF] underline decoration-blue-500/40 underline-offset-8">count.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-lg">
              The live caller-facing companion that guides sales reps through eight psychological stages,
              captures prospect words verbatim, and provides real-time objection coaching.
            </p>
          </div>

          {/* Three Feature Highlights */}
          <div className="space-y-4 pt-4">
            {/* Feature 1: 8-Stage Guided Calls */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.08] transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#6F8DFF] shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">8-Stage Guided Calls</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Navigate from pattern-interrupt opener to committed next step with structured, stage-specific one-tap controls.
                </p>
              </div>
            </div>

            {/* Feature 2: AI-Powered Objection Suggestions */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.08] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">AI-Powered Objection Suggestions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time contextual coaching powered by Gemini 1.5 Flash to pivot around brush-offs without breaking conversation rhythm.
                </p>
              </div>
            </div>

            {/* Feature 3: Call History & Automatic Summaries */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.08] transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Call History & Automatic Summaries</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full persistence in Supabase PostgreSQL: stage progression, verbatim prospect notes, and auto-generated executive summaries.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Panel Footer */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
          <span>Cold Call Copilot</span>
          <span className="font-mono text-[10px] text-slate-400">v1.0.0</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL — Login (50% on desktop)                      */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md mx-auto space-y-7">
          {/* Form Header */}
          <div className="space-y-2 text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access your cold-call workstation.
            </p>
          </div>

          {/* Status Notices / Error Banners */}
          {formError && (
            <div
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{formError}</div>
            </div>
          )}

          {authNotice && (
            <div
              className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 animate-in fade-in"
              role="alert"
            >
              <Info className="w-4 h-4 text-[#0029FF] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold mb-0.5">{authNotice.title}</div>
                <div className="text-blue-700 leading-relaxed">{authNotice.message}</div>
              </div>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="text-blue-400 hover:text-blue-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: null }));
                    }
                  }}
                  placeholder="sales.rep@company.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner ${
                    fieldErrors.email
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-rose-600 font-medium pl-1" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[#0029FF] hover:text-blue-800 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0029FF] focus:border-transparent transition-all shadow-inner ${
                    fieldErrors.password
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-300 bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-rose-600 font-medium pl-1" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0029FF] hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Account Creation Link */}
          <div className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={handleCreateAccount}
              className="font-bold text-[#0029FF] hover:text-blue-800 hover:underline transition-colors"
            >
              Create an account
            </button>
          </div>

          {/* Direct Call Launch / Guest Workflow Preservation */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Need to make a live call right now?</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                No login required
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowStartModal(true)}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-300 hover:border-[#0029FF] hover:bg-blue-50/50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] group"
            >
              <PhoneCall className="w-4 h-4 text-[#0029FF] group-hover:rotate-12 transition-transform" />
              <span>Launch Cold Call Companion</span>
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-1">
              <Link
                to="/history"
                className="inline-flex items-center gap-1.5 hover:text-[#0029FF] transition-colors"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>View Past Call History</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Start Call Dialog (Preserves live call session initialization) */}
      <StartCallModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
      />
    </div>
  );
}
