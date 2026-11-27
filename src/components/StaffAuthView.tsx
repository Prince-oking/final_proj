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

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22] placeholder:text-[#565A51] dark:placeholder:text-[#989E91]';

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
  const [imgError, setImgError] = useState(false);

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
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1C221B] border border-[#1F241D]/12 dark:border-white/12 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#8D1B22] dark:text-[#E5989B] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
              Barangay Staff Access Required
            </h1>
            <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] mt-1 leading-relaxed">
              The Staff Desk and Summary Report are restricted to Barangay San Miguel
              officials. You are currently signed in as resident{' '}
              <strong className="text-[#1F241D] dark:text-[#F2F0EA]">{authUser.fullName}</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-[42px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319]"
          >
            Sign Out &amp; Open Staff Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-3xl overflow-hidden border border-[#1F241D]/15 dark:border-white/15 bg-white dark:bg-[#1C221B] grid grid-cols-1 lg:grid-cols-12 shadow-xs">
        {/* Left Deep Forest Charcoal Officials Panel */}
        <div className="lg:col-span-5 bg-[#1E241E] text-[#F5F3EE] flex flex-col justify-between overflow-hidden">
          <div className="p-6 sm:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E5989B]">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Barangay Officials Portal</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight [text-wrap:balance]">
              {needsSetup
                ? 'Set Up First Barangay Staff Account'
                : 'Barangay Staff Sign In'}
            </h1>

            <p className="text-xs sm:text-sm text-[#D6D9D2] leading-relaxed">
              {needsSetup
                ? 'No barangay staff account has been configured yet. Create the first official account to unlock the Staff Desk and Summary Reports.'
                : 'Sign in with your Barangay Official credentials to manage community submissions, post remarks, and view summary reports.'}
            </p>
          </div>

          <div className="h-44 lg:h-48 w-full overflow-hidden bg-[#151A15] relative">
            {!imgError && (
              <img
                src="/src/assets/images/bento_hall_overlook_1795758873326.jpg"
                alt="Barangay San Miguel terrace overlooking neighborhood rooftops"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover opacity-85"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#1E241E] via-transparent to-[#1E241E]/75"
            />
          </div>
        </div>

        {/* Right Minimal Credential Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          {loadingStatus ? (
            <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] py-10 text-center">
              Checking staff portal configuration...
            </p>
          ) : (
            <>
              {errorMsg && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-[#3A1719] border border-[#8D1B22] dark:border-[#E5989B]/60 text-xs font-semibold text-[#701319] dark:text-[#FAD2D4] flex items-start gap-2"
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
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                    >
                      Official Full Name
                    </label>
                    <input
                      id="staff-setup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Sec. Elena Villanueva"
                      className={inputClass}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="staff-setup-title"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                    >
                      Barangay Position
                    </label>
                    <select
                      id="staff-setup-title"
                      value={officialTitle}
                      onChange={(e) => setOfficialTitle(e.target.value)}
                      className={inputClass}
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
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                    >
                      Official Email
                    </label>
                    <input
                      id="staff-setup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="secretary@barangaysanmiguel.ph"
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
                      htmlFor="staff-setup-password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                    >
                      Password (minimum 8 characters)
                    </label>
                    <input
                      id="staff-setup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong staff password"
                      className={inputClass}
                    />
                    {fieldErrors.password && (
                      <p className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60"
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
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
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
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="staff-login-password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
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
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] hover:bg-[#2B332B] dark:bg-[#8D1B22] dark:hover:bg-[#701319] transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Signing In...' : 'Sign In to Staff Desk'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-[#565A51] dark:text-[#B4B9AE]">
        Looking to file a neighborhood issue or document request?{' '}
        <button
          type="button"
          onClick={onGoToResidentLogin}
          className="font-bold text-[#1F241D] dark:text-[#F2F0EA] underline underline-offset-4 hover:text-[#8D1B22] dark:hover:text-[#E5989B]"
        >
          Go to Resident Login
        </button>
      </p>
    </div>
  );
}
