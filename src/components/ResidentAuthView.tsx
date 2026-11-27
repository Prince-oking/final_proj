import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  LogIn,
  LogOut,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import type { AuthUser, PortalSubmission, SubmissionKind } from '../types/portal';
import { PUROK_LIST, formatDisplayDate } from '../utils/portalLogic';
import {
  fetchMySubmissions,
  loginResident,
  registerResident,
} from '../services/api';
import { StatusLabel } from './StatusLabel';

interface ResidentAuthViewProps {
  authUser: AuthUser | null;
  token: string | null;
  onAuthenticated: (token: string, user: AuthUser) => void;
  onSignOut: () => void;
  onStartSubmission: (kind: SubmissionKind) => void;
  onTrackReference: (refNumber: string) => void;
  onGoToStaffLogin: () => void;
  noticeText?: string;
}

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22] placeholder:text-[#565A51] dark:placeholder:text-[#989E91]';

export function ResidentAuthView({
  authUser,
  token,
  onAuthenticated,
  onSignOut,
  onStartSubmission,
  onTrackReference,
  onGoToStaffLogin,
  noticeText,
}: ResidentAuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [purok, setPurok] = useState(PUROK_LIST[0]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [mySubmissions, setMySubmissions] = useState<PortalSubmission[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [panelImgError, setPanelImgError] = useState(false);

  useEffect(() => {
    if (!token || authUser?.role !== 'resident') {
      setMySubmissions([]);
      return;
    }
    let cancelled = false;
    setLoadingMine(true);
    fetchMySubmissions(token)
      .then((res) => {
        if (!cancelled) setMySubmissions(res.submissions);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, authUser]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await loginResident({ email: loginEmail, password: loginPassword });
      onAuthenticated(res.token, res.user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await registerResident({
        fullName,
        purok,
        address,
        phone,
        email: regEmail,
        password: regPassword,
      });
      onAuthenticated(res.token, res.user);
    } catch (err) {
      const typed = err as Error & { fieldErrors?: Record<string, string> };
      setErrorMsg(typed.message || 'Registration failed.');
      if (typed.fieldErrors) setFieldErrors(typed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  if (authUser && authUser.role === 'resident') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Warm Stone Resident Profile Banner */}
        <div className="bg-[#ECE9E2] dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D1B22] dark:text-[#E5989B]">
              Resident Account
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight">
              {authUser.fullName}
            </h1>
            <p className="text-sm text-[#565A51] dark:text-[#B4B9AE]">
              {authUser.purok} · {authUser.address} · {authUser.phone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onStartSubmission('issue')}
              className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>File New Report</span>
            </button>
            <button
              type="button"
              onClick={() => onStartSubmission('service')}
              className="min-h-[42px] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] bg-white dark:bg-[#252C24] border border-[#1F241D]/15 dark:border-white/15 hover:bg-[#1E241E] hover:text-white dark:hover:bg-[#F2F0EA] dark:hover:text-[#141814] transition-colors whitespace-nowrap"
            >
              Request Document
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] hover:bg-white/70 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <section className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#1F241D]/10 dark:border-white/10 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
                My Submitted Reports &amp; Service Requests
              </h2>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-0.5">
                Records filed under {authUser.email}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1F241D] dark:text-[#F2F0EA] tabular-nums">
              {mySubmissions.length} total
            </span>
          </div>

          {loadingMine ? (
            <div className="p-8 text-center text-sm text-[#565A51] dark:text-[#B4B9AE]">
              Loading your submissions...
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="font-display text-xl font-bold text-[#1F241D] dark:text-[#F2F0EA]">
                You have not filed any reports or requests yet
              </p>
              <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] max-w-md mx-auto">
                File a community issue report with photo evidence or request a
                barangay clearance for pickup.
              </p>
              <button
                type="button"
                onClick={() => onStartSubmission('issue')}
                className="min-h-[42px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319]"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1F241D]/10 dark:divide-white/10">
              {mySubmissions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTrackReference(item.referenceNumber)}
                  className="w-full text-left px-6 py-4 hover:bg-[#F5F3EE]/70 dark:hover:bg-[#252C24]/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#565A51] dark:text-[#B4B9AE]">
                      <span className="font-mono font-bold text-[#1F241D] dark:text-[#F2F0EA] tabular-nums">
                        {item.referenceNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Filed {formatDisplayDate(item.createdAt)}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1F241D] dark:text-[#F2F0EA] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] truncate">{item.location}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <StatusLabel status={item.status} />
                    <ArrowRight className="w-4 h-4 text-[#1F241D] dark:text-[#F2F0EA]" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (authUser && authUser.role === 'staff') {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1C221B] border border-[#1F241D]/12 dark:border-white/12 rounded-3xl p-6 sm:p-8 space-y-4">
        <h1 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
          Currently Signed In as Barangay Staff
        </h1>
        <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
          You are signed in as <strong className="text-[#1F241D] dark:text-[#F2F0EA]">{authUser.fullName}</strong> (
          {authUser.officialTitle}). Sign out first if you want to sign into a
          resident account.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[42px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] hover:bg-[#2B332B] dark:bg-[#8D1B22] dark:hover:bg-[#701319]"
          >
            Sign Out to Switch to Resident
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-3xl overflow-hidden border border-[#1F241D]/12 dark:border-white/12 bg-white dark:bg-[#1C221B] grid grid-cols-1 lg:grid-cols-12 shadow-xs">
        {/* Left Atmospheric Editorial Photo Panel */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[520px] bg-[#1E241E] flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden">
          {!panelImgError && (
            <img
              src="/src/assets/images/bento_community_lane_1795758872975.jpg"
              alt="Sunlit Barangay San Miguel neighborhood lane"
              referrerPolicy="no-referrer"
              onError={() => setPanelImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#121611]/90 via-[#121611]/55 to-[#121611]/45"
          />

          <div className="relative z-10 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F3EE]/80">
              Resident Portal
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight [text-wrap:balance]">
              Direct neighborhood service access.
            </h1>
          </div>

          <div className="relative z-10 space-y-3 text-xs text-white/90 pt-6">
            <p className="leading-relaxed">
              {noticeText ||
                'Sign in or register once to submit reports with photo evidence, request barangay clearances, and follow official updates.'}
            </p>
            <div className="pt-2 border-t border-white/20 space-y-1 text-[11px] text-white/80">
              <p>01 · File community issues with live photos</p>
              <p>02 · Reserve clearances for Window 1 pickup</p>
              <p>03 · Track every barangay status remark</p>
            </div>
          </div>
        </div>

        {/* Right Minimal Form Surface */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          <div className="flex items-center p-1 bg-[#ECE9E2] dark:bg-[#141814] rounded-full">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setFieldErrors({});
              }}
              className={`flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-[#1E241E] text-[#F5F3EE] dark:bg-[#8D1B22] dark:text-white'
                  : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Resident Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setFieldErrors({});
              }}
              className={`flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-[#1E241E] text-[#F5F3EE] dark:bg-[#8D1B22] dark:text-white'
                  : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Account</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 dark:bg-[#3A1719] border border-[#8D1B22] dark:border-[#E5989B]/60 text-xs font-semibold text-[#701319] dark:text-[#FAD2D4] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="res-login-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="res-login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="resident@example.ph"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="res-login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="res-login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] hover:bg-[#2B332B] dark:bg-[#8D1B22] dark:hover:bg-[#701319] transition-colors disabled:opacity-60"
              >
                {submitting ? 'Signing In...' : 'Sign In as Resident'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate className="space-y-3.5">
              <div>
                <label
                  htmlFor="res-reg-name"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                >
                  Full Name
                </label>
                <input
                  id="res-reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Maria Clara Santos"
                  className={inputClass}
                />
                {fieldErrors.fullName && (
                  <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="res-reg-purok"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Purok / Zone
                  </label>
                  <select
                    id="res-reg-purok"
                    value={purok}
                    onChange={(e) => setPurok(e.target.value)}
                    className={inputClass}
                  >
                    {PUROK_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="res-reg-phone"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Mobile / Contact No.
                  </label>
                  <input
                    id="res-reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-000-0000"
                    className={inputClass}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="res-reg-address"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                >
                  Street / House Address
                </label>
                <input
                  id="res-reg-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street Name"
                  className={inputClass}
                />
                {fieldErrors.address && (
                  <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="res-reg-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="res-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="resident@example.ph"
                    className={inputClass}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="res-reg-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="res-reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60"
              >
                {submitting ? 'Creating Account...' : 'Create Resident Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-[#565A51] dark:text-[#B4B9AE]">
        Are you a barangay official or secretary?{' '}
        <button
          type="button"
          onClick={onGoToStaffLogin}
          className="font-bold text-[#1F241D] dark:text-[#F2F0EA] underline underline-offset-4 hover:text-[#8D1B22] dark:hover:text-[#E5989B]"
        >
          Go to Barangay Staff Login
        </button>
      </p>
    </div>
  );
}
