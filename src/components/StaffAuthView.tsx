import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../types/portal';
import {
  fetchStaffAuthStatus,
  loginStaff,
  setupInitialStaff,
} from '../services/api';

interface StaffAuthViewProps {
  authUser: AuthUser | null;
  onAuthenticated: (token: string, user: AuthUser) => void;
  onSignOut: () => void;
  onGoToResidentLogin: () => void;
}

export function StaffAuthView({
  authUser,
  onAuthenticated,
  onSignOut,
  onGoToResidentLogin,
}: StaffAuthViewProps) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [officialTitle, setOfficialTitle] = useState('Barangay Secretary');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchStaffAuthStatus()
      .then((res) => {
        if (!cancelled) {
          setNeedsSetup(res.needsSetup);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStaffLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginStaff({ email, password });
      onAuthenticated(res.token, res.user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Staff sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFirstRunSetup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await setupInitialStaff({
        fullName,
        officialTitle,
        email,
        password,
      });
      onAuthenticated(res.token, res.user);
    } catch (err) {
      const typed = err as Error & { fieldErrors?: Record<string, string> };
      setErrorMsg(typed.message || 'Initial staff setup failed.');
      if (typed.fieldErrors) setFieldErrors(typed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  if (authUser && authUser.role === 'resident') {
    return (
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Barangay Staff Access Required
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              The Staff Desk and Summary Report are restricted to Barangay San Miguel
              officials. You are currently signed in as resident{' '}
              <strong>{authUser.fullName}</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900"
          >
            Sign Out &amp; Open Staff Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          Barangay Officials Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {needsSetup ? 'Set Up First Barangay Staff Account' : 'Barangay Staff Sign In'}
        </h1>
        <p className="text-sm text-slate-600">
          {needsSetup
            ? 'No barangay staff account has been configured yet. Create the first official account to unlock the Staff Desk and Summary Reports.'
            : 'Sign in with your Barangay Official credentials to manage community submissions, post remarks, and view summary reports.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        {loadingStatus ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Checking staff portal configuration...
          </p>
        ) : (
          <>
            {errorMsg && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {needsSetup ? (
              <form onSubmit={handleFirstRunSetup} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="staff-setup-name"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Official Full Name
                  </label>
                  <input
                    id="staff-setup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Sec. Elena Villanueva"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="staff-setup-title"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Barangay Position
                  </label>
                  <select
                    id="staff-setup-title"
                    value={officialTitle}
                    onChange={(e) => setOfficialTitle(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="Barangay Secretary">Barangay Secretary</option>
                    <option value="Punong Barangay">Punong Barangay</option>
                    <option value="Kagawad — Infrastructure & Sanitation">
                      Kagawad — Infrastructure &amp; Sanitation
                    </option>
                    <option value="Barangay Administrative Staff">
                      Barangay Administrative Staff
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="staff-setup-email"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Official Email
                  </label>
                  <input
                    id="staff-setup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="secretary@barangaysanmiguel.ph"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="staff-setup-password"
                    className="block text-sm font-semibold text-slate-900 mb-1"
                  >
                    Password (minimum 8 characters)
                  </label>
                  <input
                    id="staff-setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong staff password"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-red-700 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
                >
                  {submitting
                    ? 'Creating Staff Account...'
                    : 'Claim Staff Account & Enter Desk'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleStaffLogin} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="staff-login-email"
                    className="block text-sm font-semibold text-slate-900 mb-1.5"
                  >
                    Official Email
                  </label>
                  <input
                    id="staff-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="official@barangaysanmiguel.ph"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="staff-login-password"
                    className="block text-sm font-semibold text-slate-900 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="staff-login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your staff password"
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Signing In...' : 'Sign In to Staff Desk'}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-center text-slate-500">
        Looking to file a neighborhood issue or document request?{' '}
        <button
          type="button"
          onClick={onGoToResidentLogin}
          className="font-semibold text-blue-800 hover:underline"
        >
          Go to Resident Login
        </button>
      </p>
    </div>
  );
}
