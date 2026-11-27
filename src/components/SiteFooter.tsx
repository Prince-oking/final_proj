import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Moon, SearchCheck, Sun } from 'lucide-react';
import type { PortalView, SubmissionKind } from '../types/portal';

interface SiteFooterProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (view: PortalView) => void;
  onStartSubmission: (kind: SubmissionKind) => void;
}

export function SiteFooter({
  theme,
  onToggleTheme,
  onNavigate,
  onStartSubmission,
}: SiteFooterProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [formError, setFormError] = useState('');
  const [subscribedInfo, setSubscribedInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim();
    const cleanName = firstName.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (cleanName.length < 2) {
      setFormError('Please enter your first name.');
      return;
    }

    setSubscribedInfo({ name: cleanName, email: cleanEmail });
    setEmail('');
    setFirstName('');
  };

  return (
    <footer className="no-print mt-12">
      {/* 1. Barangay Hilltop & Homes Skyline Transition (Warm Alabaster -> Deep Forest Charcoal) */}
      <div className="w-full overflow-hidden leading-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="block w-full h-11 sm:h-16 text-[#1E241E] dark:text-[#1B211A]"
        >
          <path
            d="M0 84V62L36 58L58 44L84 52L116 40L154 48L182 32L210 44L238 44V58L276 54L312 36L346 46L378 39L414 55L452 55V42L488 30L518 44L554 50L594 58L630 58V40L656 40V30L694 18H746L784 30V40H810V58L852 54L886 38L922 48L958 34L994 48L1032 56L1068 42L1104 42V54L1142 36L1178 46L1214 32L1248 48L1286 42L1324 52L1362 38L1398 48L1440 56V84H0Z"
            fill="currentColor"
          />
          <rect x="718" y="4" width="3" height="16" fill="currentColor" />
          <path d="M721 5H738L734 9.5L738 14H721V5Z" fill="#8D1B22" />
        </svg>
      </div>

      {/* 3. Main Deep Forest Charcoal 3-Column Footer Grid */}
      <div className="bg-[#1E241E] dark:bg-[#1B211A] text-[#F5F3EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 md:divide-x md:divide-white/15">
            {/* Left Column: Navigation & Quick Civic Tools */}
            <div className="md:col-span-3 md:pr-8 flex flex-col justify-between gap-8 reveal">
              <nav aria-label="Footer navigation" className="flex flex-col items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('portal')}
                  className="text-sm font-medium text-[#F5F3EE] hover:text-[#E5989B] transition-colors whitespace-nowrap"
                >
                  Portal Home
                </button>
                <button
                  type="button"
                  onClick={() => onStartSubmission('issue')}
                  className="text-sm font-medium text-[#F5F3EE] hover:text-[#E5989B] transition-colors whitespace-nowrap"
                >
                  Report an Issue
                </button>
                <button
                  type="button"
                  onClick={() => onStartSubmission('service')}
                  className="text-sm font-medium text-[#F5F3EE] hover:text-[#E5989B] transition-colors whitespace-nowrap"
                >
                  Request Document
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('track')}
                  className="text-sm font-medium text-[#F5F3EE] hover:text-[#E5989B] transition-colors whitespace-nowrap"
                >
                  Track Submissions
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('manual')}
                  className="text-sm font-medium text-[#F5F3EE] hover:text-[#E5989B] transition-colors whitespace-nowrap"
                >
                  User Manual
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('track')}
                  aria-label="Open public submission tracker"
                  className="w-10 h-10 rounded-full border border-white/35 text-[#F5F3EE] hover:border-[#E5989B] hover:text-[#E5989B] inline-flex items-center justify-center transition-colors"
                >
                  <SearchCheck className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('manual')}
                  aria-label="Open barangay portal manual"
                  className="w-10 h-10 rounded-full border border-white/35 text-[#F5F3EE] hover:border-[#E5989B] hover:text-[#E5989B] inline-flex items-center justify-center transition-colors"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Center Column: Barangay Advisories Subscription */}
            <div className="md:col-span-6 md:px-10 flex flex-col justify-center reveal reveal-delay-1">
              <div className="max-w-md mx-auto w-full text-center space-y-4">
                <div className="space-y-1.5">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Get Updates
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D2D4CC] leading-relaxed">
                    Subscribe for barangay notices, drainage clearing schedules, and
                    service window announcements.
                  </p>
                </div>

                {subscribedInfo ? (
                  <div
                    role="status"
                    className="p-4 rounded-lg border border-white/25 bg-white/5 text-left space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5 text-sm text-white font-semibold">
                      <CheckCircle2
                        className="w-4 h-4 text-[#E5989B] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        Registered {subscribedInfo.name} ({subscribedInfo.email}) for
                        Barangay San Miguel updates.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubscribedInfo(null)}
                      className="text-xs font-bold uppercase tracking-wider text-[#D2D4CC] hover:text-white underline underline-offset-4"
                    >
                      Register another email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} noValidate className="space-y-2.5 text-left">
                    <div>
                      <label htmlFor="footer-updates-email" className="sr-only">
                        Email Address
                      </label>
                      <input
                        id="footer-updates-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="*Email"
                        className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-transparent text-white placeholder:text-[#A9ADA3] border border-white/30 rounded-md focus:border-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex-1">
                        <label htmlFor="footer-updates-name" className="sr-only">
                          First Name
                        </label>
                        <input
                          id="footer-updates-name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="*First Name"
                          className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-transparent text-white placeholder:text-[#A9ADA3] border border-white/30 rounded-md focus:border-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="editorial-btn min-h-[42px] px-6 py-2 text-xs font-bold uppercase tracking-wider text-[#1F241D] bg-[#F5F3EE] hover:bg-white whitespace-nowrap shrink-0"
                      >
                        Sign Up
                      </button>
                    </div>

                    {formError && (
                      <p role="alert" className="text-xs font-semibold text-red-300">
                        {formError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>

            {/* Right Column: Contact, Hall Address & Civic Seal */}
            <div className="md:col-span-3 md:pl-8 flex flex-col justify-between items-start md:items-end text-left md:text-right gap-6 reveal reveal-delay-2">
              <div className="space-y-4 w-full flex flex-col items-start md:items-end">
                <button
                  type="button"
                  onClick={() => onStartSubmission('issue')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#E5989B] transition-colors whitespace-nowrap arrow-nudge"
                >
                  <span>Send Us A Message</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="space-y-1 text-xs sm:text-sm text-[#D2D4CC] leading-relaxed">
                  <p className="font-mono text-[#F5F3EE] tabular-nums">
                    (02) 8555-0194
                  </p>
                  <p>Rizal Ave. cor. Mabini St.</p>
                  <p>Barangay San Miguel Hall</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#A9ADA3] pt-1 tabular-nums">
                    Mon–Fri 08:00–17:00
                  </p>
                </div>
              </div>

              {/* Minimalist Geometric Civic Emblem */}
              <svg
                viewBox="0 0 96 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Barangay San Miguel Official Seal"
                className="w-24 h-11 text-[#F5F3EE]/85"
              >
                <ellipse
                  cx="48"
                  cy="22"
                  rx="45"
                  ry="19"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <ellipse
                  cx="48"
                  cy="22"
                  rx="41"
                  ry="15"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
                <circle cx="18" cy="22" r="2.2" fill="#8D1B22" />
                <text
                  x="51"
                  y="20"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="7.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  SAN MIGUEL
                </text>
                <text
                  x="51"
                  y="30"
                  textAnchor="middle"
                  fill="#D2D4CC"
                  fontSize="6"
                  fontWeight="600"
                  letterSpacing="1.4"
                  fontFamily="JetBrains Mono, monospace"
                >
                  CIVIC DESK
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Bottom Copyright Strip */}
        <div className="bg-[#151A15] dark:bg-[#111511] border-t border-white/10 pb-14 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#A9ADA3]">
            <p>© 2026 Barangay San Miguel · Community Services Desk</p>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => onNavigate('resident')}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                Resident Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigate('staff')}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                Staff Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigate('manual')}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                User Manual &amp; XAMPP Setup
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-pressed={theme === 'dark'}
                aria-label={
                  theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                }
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/25 text-[#F5F3EE] hover:border-[#E5989B] hover:text-[#E5989B] transition-colors whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
