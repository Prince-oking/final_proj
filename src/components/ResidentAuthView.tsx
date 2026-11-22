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
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Resident Account
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {authUser.fullName}
            </h1>
            <p className="text-sm text-slate-600">
              {authUser.purok} · {authUser.address} · {authUser.phone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onStartSubmission('issue')}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>File New Report</span>
            </button>
            <button
              type="button"
              onClick={() => onStartSubmission('service')}
              className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
            >
              Request Document
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My Submitted Reports &amp; Service Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Records filed under {authUser.email}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
              {mySubmissions.length} total
            </span>
          </div>

          {loadingMine ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading your submissions...
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">
                You have not filed any reports or requests yet
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                File a community issue report with photo evidence or request a
                barangay clearance for pickup.
              </p>
              <button
                type="button"
                onClick={() => onStartSubmission('issue')}
                className="min-h-[42px] px-5 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
              >
                File Your First Report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {mySubmissions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTrackReference(item.referenceNumber)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {item.referenceNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Filed {formatDisplayDate(item.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{item.location}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <StatusLabel status={item.status} />
                    <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
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
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">
          Currently Signed In as Barangay Staff
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          You are signed in as <strong>{authUser.fullName}</strong> (
          {authUser.officialTitle}). Sign out first if you want to sign into a
          resident account.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
          >
            Sign Out to Switch to Resident
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          Resident Portal Access
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Resident Sign In &amp; Registration
        </h1>
        <p className="text-sm text-slate-600">
          {noticeText ||
            'Sign in or create a resident account to file community issue reports, request barangay documents, and view your submission history.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setFieldErrors({});
            }}
            className={`min-h-[42px] inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>Resident Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setFieldErrors({});
            }}
            className={`min-h-[42px] inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Create Account</span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {errorMsg && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2"
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
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="res-login-password"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
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
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Signing In...' : 'Sign In as Resident'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="res-reg-name"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="res-reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Maria Clara Santos"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-700 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="res-reg-purok"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Purok / Zone
                  </label>
                  <select
                    id="res-reg-purok"
                    value={purok}
                    onChange={(e) => setPurok(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
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
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Mobile / Contact No.
                  </label>
                  <input
                    id="res-reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="res-reg-address"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Street / House Address
                </label>
                <input
                  id="res-reg-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street Name"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
                {fieldErrors.address && (
                  <p className="text-xs text-red-700 mt-1">{fieldErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="res-reg-email"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="res-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="resident@example.ph"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="res-reg-password"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="res-reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.password}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Creating Account...' : 'Create Resident Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-slate-500">
        Are you a barangay official or secretary?{' '}
        <button
          type="button"
          onClick={onGoToStaffLogin}
          className="font-semibold text-blue-800 hover:underline"
        >
          Go to Barangay Staff Login
        </button>
      </p>
    </div>
  );
}
