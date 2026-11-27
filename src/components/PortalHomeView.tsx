import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type {
  AuthUser,
  PortalSubmission,
  PortalView,
  SubmissionKind,
  SummaryStats,
} from '../types/portal';
import {
  HERO_BARANGAY_HALL_IMAGE,
  HERO_BARANGAY_HALL_NIGHT_IMAGE,
} from '../data/seedData';
import { formatDisplayDate } from '../utils/portalLogic';
import { StatusLabel } from './StatusLabel';

interface PortalHomeViewProps {
  authUser: AuthUser | null;
  recentSubmissions: PortalSubmission[];
  stats: SummaryStats;
  onStartSubmission: (kind: SubmissionKind) => void;
  onTrackReference: (refNumber: string) => void;
  onNavigate: (view: PortalView) => void;
  onSignOut: () => void;
}

export function PortalHomeView({
  authUser,
  recentSubmissions,
  stats,
  onStartSubmission,
  onTrackReference,
  onNavigate,
  onSignOut,
}: PortalHomeViewProps) {
  const [heroImgError, setHeroImgError] = useState(false);
  const [nightHeroImgError, setNightHeroImgError] = useState(false);
  const [bentoErrors, setBentoErrors] = useState<Record<string, boolean>>({});
  const [quickRef, setQuickRef] = useState('');

  const isStaff = authUser?.role === 'staff';
  const navLinks: Array<{ view: PortalView; label: string }> = isStaff
    ? [
        { view: 'portal', label: 'Portal' },
        { view: 'staff', label: 'Staff Desk' },
        { view: 'summary', label: 'Summary' },
        { view: 'track', label: 'Track' },
        { view: 'manual', label: 'Manual' },
      ]
    : [
        { view: 'portal', label: 'Portal' },
        { view: 'track', label: 'Track' },
        { view: 'resident', label: authUser ? 'My Account' : 'Resident Login' },
        { view: 'staff', label: 'Staff Login' },
        { view: 'manual', label: 'Manual' },
      ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. Panoramic Sunlit Barangay Vista Hero (Edge-to-Edge Top & Sides, Seamless Alabaster Notch) */}
      <section className="w-full p-0">
        <div className="relative overflow-hidden rounded-b-[26px] sm:rounded-b-[32px] min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] bg-[#1E241E] flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2B3529] via-[#1E241E] to-[#4A1C1F] dark:from-[#0E1520] dark:via-[#141814] dark:to-[#241618]" />
          <div className="absolute inset-0 hero-bg-settle">
            {!heroImgError && (
              <img
                src={HERO_BARANGAY_HALL_IMAGE}
                alt="Barangay San Miguel Hall on the hilltop overlooking neighborhood homes and lush green trees at sunset"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-100 dark:opacity-0 transition-opacity duration-500"
              />
            )}
            {!nightHeroImgError && (
              <img
                src={HERO_BARANGAY_HALL_NIGHT_IMAGE}
                alt="Barangay San Miguel Hall on the hilltop under a starry night sky with warm lights glowing inside the hall and neighborhood houses"
                referrerPolicy="no-referrer"
                onError={() => setNightHeroImgError(true)}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-0 dark:opacity-100 transition-opacity duration-500"
              />
            )}
          </div>

          {/* Measured directional contrast scrims for crisp readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#121611]/80 via-[#121611]/40 to-[#121611]/10"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#121611]/65 via-transparent to-[#121611]/30"
          />

          {/* Top-Center Inverted-Corner Alabaster Notch (Desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center justify-center absolute top-[-1px] md:left-[58%] lg:left-[54%] xl:left-1/2 -translate-x-1/2 z-20 bg-[#F5F3EE] dark:bg-[#141814] px-4 lg:px-7 h-11 rounded-b-[20px] hero-notch-enter"
          >
            {/* Left concave inverted fillet */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-[#F5F3EE] dark:text-[#141814] absolute top-0 -left-[23px] pointer-events-none"
            >
              <path d="M0 0 H24 V24 C24 10.745 13.255 0 0 0 Z" />
            </svg>
            {/* Right concave inverted fillet */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-[#F5F3EE] dark:text-[#141814] absolute top-0 -right-[23px] pointer-events-none"
            >
              <path d="M24 0 H0 V24 C0 10.745 10.745 0 24 0 Z" />
            </svg>

            <div className="flex items-center gap-3.5 lg:gap-5 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.07em]">
              {navLinks.map((item) => {
                const isActive = item.view === 'portal';
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => onNavigate(item.view)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`py-1 whitespace-nowrap shrink-0 transition-colors nav-link-slide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D1B22] ${
                      isActive
                        ? 'text-[#8D1B22] dark:text-[#E5989B]'
                        : 'text-[#1F241D]/80 hover:text-[#1F241D] dark:text-[#F2F0EA]/80 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <span
                className="h-3.5 w-px bg-[#1F241D]/20 dark:bg-white/20 shrink-0"
                aria-hidden="true"
              />

              {isStaff ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-1 text-[#1F241D] hover:text-[#8D1B22] dark:text-[#F2F0EA] dark:hover:text-[#E5989B] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D1B22]"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartSubmission('issue')}
                  className="py-1 text-[#8D1B22] hover:text-[#701319] dark:text-[#E5989B] dark:hover:text-white whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D1B22]"
                >
                  File Report
                </button>
              )}
            </div>
          </nav>

          {/* Top Bar inside Hero: Civic Sun Crest Lockup in Top-Left Sky Pocket + Floating Track Card (Right) */}
          <div className="relative z-10 max-w-7xl w-full mx-auto px-5 pt-4 pb-2 sm:px-6 sm:pt-4 lg:px-8 lg:pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <button
              type="button"
              onClick={() => onNavigate('portal')}
              className="hidden md:inline-flex items-center gap-2.5 text-left group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white hero-enter"
            >
              {/* Radiant Civic Sun Crest */}
              <svg
                aria-hidden="true"
                viewBox="0 0 40 40"
                className="w-8 h-8 text-white shrink-0 transition-transform group-hover:scale-105"
                fill="none"
              >
                <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.75" />
                {Array.from({ length: 16 }).map((_, idx) => {
                  const angle = (idx * 360) / 16;
                  return (
                    <line
                      key={idx}
                      x1="20"
                      y1="2.5"
                      x2="20"
                      y2="10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      transform={`rotate(${angle} 20 20)`}
                    />
                  );
                })}
              </svg>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xs lg:text-sm font-extrabold tracking-[0.05em] uppercase text-white whitespace-nowrap">
                  Barangay San Miguel
                </span>
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/80 mt-1 whitespace-nowrap">
                  Community Services
                </span>
              </span>
            </button>

            <p className="md:hidden text-xs font-medium tracking-wide text-white/85">
              Barangay San Miguel · Community Services
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onTrackReference(quickRef);
              }}
              className="w-full sm:w-80 md:mt-10 bg-[#1E241E]/65 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 text-white shadow-lg space-y-2.5 hero-enter hero-enter-delay-2 hover-lift"
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="home-quick-track"
                  className="text-xs font-bold tracking-tight text-white"
                >
                  Track a Submission
                </label>
                <span className="text-[11px] font-mono text-white/75">
                  BRG / REQ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    className="w-3.5 h-3.5 text-[#565A51] dark:text-[#B4B9AE] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="home-quick-track"
                    type="text"
                    value={quickRef}
                    onChange={(e) => setQuickRef(e.target.value)}
                    placeholder="BRG-2026-0101"
                    className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] rounded-lg font-mono placeholder:font-sans placeholder:text-[#565A51] dark:placeholder:text-[#989E91] focus:outline-none focus:ring-2 focus:ring-[#8D1B22]"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#1F241D] bg-[#F5F3EE] hover:bg-white dark:bg-[#F2F0EA] dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                >
                  Track
                </button>
              </div>
            </form>
          </div>

          {/* Lower-Left Hero Title & Primary Actions */}
          <div className="relative z-10 max-w-7xl w-full mx-auto px-5 pb-7 pt-8 sm:px-6 sm:pb-9 lg:px-8 lg:pb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <h1 className="font-display text-[clamp(2.25rem,4.6vw,3.75rem)] font-extrabold tracking-tight text-white leading-[1.06] [text-wrap:balance] hero-enter hero-enter-delay-1">
                Barangay San Miguel, served closer to home.
              </h1>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-md hero-enter hero-enter-delay-2">
                Skip the queue at the hall. Report neighborhood concerns with photo
                evidence, request clearances for pickup, and follow every official remark.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 hero-enter hero-enter-delay-3">
                <button
                  type="button"
                  onClick={() => onStartSubmission('issue')}
                  className="min-h-[44px] inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] bg-white hover:bg-[#F5F3EE] transition-colors whitespace-nowrap arrow-nudge"
                >
                  <Camera className="w-4 h-4 text-[#8D1B22]" aria-hidden="true" />
                  <span>Report an Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onStartSubmission('service')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E]/75 backdrop-blur-sm border border-white/30 hover:bg-[#1E241E] transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Request Document</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/85 hero-enter hero-enter-delay-3">
              <span className="font-mono tabular-nums">Mon–Fri 08:00–17:00 · Window 1</span>
              {authUser ? (
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(authUser.role === 'staff' ? 'staff' : 'resident')
                  }
                  className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline underline-offset-4 whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {authUser.role === 'staff' ? 'Staff:' : 'Resident:'}{' '}
                    {authUser.fullName}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('resident')}
                  className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline underline-offset-4 whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resident Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Asymmetric 3-Column Feature Bento (Warm White + Signature Burgundy Card) */}
      <section aria-label="Barangay services overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 reveal">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1F241D] dark:text-[#F2F0EA] leading-tight [text-wrap:balance]">
            <span className="text-[#8D1B22] dark:text-[#E5989B]">San Miguel</span> — built for every purok.
          </h2>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] max-w-sm leading-relaxed">
            Direct community issue logging, clear document pickup requests, and transparent
            official updates across all neighborhood zones.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 1: Clean White Card with Sunlit Lane Photo */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl p-3.5 flex flex-col justify-between gap-4 reveal reveal-delay-1 hover-lift hover-img-zoom">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#ECE9E2] dark:bg-[#252C24]">
              {bentoErrors.lane ? (
                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-[#ECE9E2] dark:bg-[#252C24] text-[#1F241D] dark:text-[#F2F0EA]">
                  <span className="font-display text-lg font-bold">Barangay Neighborhoods</span>
                </div>
              ) : (
                <img
                  src="/src/assets/images/bento_community_lane_1795758872975.jpg"
                  alt="Sunlit Barangay San Miguel neighborhood lane with homes and flowering plants"
                  referrerPolicy="no-referrer"
                  onError={() => setBentoErrors((p) => ({ ...p, lane: true }))}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="px-2 pb-2 space-y-2.5">
              <div className="flex items-center gap-2 text-[#1F241D] dark:text-[#F2F0EA]">
                <Camera className="w-4 h-4 text-[#8D1B22] dark:text-[#E5989B] shrink-0" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold tracking-tight">
                  Neighborhood Issues
                </h3>
              </div>
              <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
                Report broken streetlights, clogged drainage, road hazards, or waste pickup
                concerns with live camera or uploaded photos.
              </p>
              <button
                type="button"
                onClick={() => onStartSubmission('issue')}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8D1B22] hover:text-[#701319] dark:text-[#E5989B] dark:hover:text-white transition-colors pt-1 arrow-nudge"
              >
                <span>Report an issue</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card 2: Signature Burgundy Card */}
          <div className="lg:col-span-4 bg-[#8D1B22] dark:bg-[#7A181E] text-white rounded-2xl p-3.5 flex flex-col justify-between gap-4 reveal reveal-delay-2 hover-lift hover-img-zoom">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#701319]">
              {bentoErrors.overlook ? (
                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-[#701319] text-white">
                  <span className="font-display text-lg font-bold">Transparent Barangay Tracking</span>
                </div>
              ) : (
                <img
                  src="/src/assets/images/bento_hall_overlook_1795758873326.jpg"
                  alt="Golden hour stone terrace overlooking Barangay San Miguel rooftops and green hills"
                  referrerPolicy="no-referrer"
                  onError={() => setBentoErrors((p) => ({ ...p, overlook: true }))}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="px-2 pb-2 space-y-2.5">
              <div className="flex items-center gap-2 text-white">
                <Search className="w-4 h-4 text-white/90 shrink-0" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold tracking-tight">
                  Tracked Progress
                </h3>
              </div>
              <p className="text-sm text-white/85 leading-relaxed">
                Follow every filing from Received to In Progress and Resolved with dated
                official remarks from Barangay San Miguel staff.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('track')}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#F5F3EE] transition-colors pt-1 arrow-nudge"
              >
                <span>Open tracker</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card 3: Right Stacked Column (Documents + Staff Desk with Bottom Photo) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl p-5 flex-1 flex flex-col justify-between gap-3 reveal reveal-delay-3 hover-lift">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#1F241D] dark:text-[#F2F0EA]">
                  <FileText className="w-4 h-4 text-[#8D1B22] dark:text-[#E5989B] shrink-0" aria-hidden="true" />
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    Document Clearances
                  </h3>
                </div>
                <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
                  Request Barangay Clearance, Residency, Indigency, or Business Endorsement
                  for scheduled pickup at Window 1.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onStartSubmission('service')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8D1B22] hover:text-[#701319] dark:text-[#E5989B] dark:hover:text-white transition-colors arrow-nudge"
                >
                  <span>Request document</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl pt-5 overflow-hidden flex-1 flex flex-col justify-between gap-4 reveal reveal-delay-4 hover-lift hover-img-zoom">
              <div className="px-5 space-y-2">
                <div className="flex items-center gap-2 text-[#1F241D] dark:text-[#F2F0EA]">
                  <ShieldCheck className="w-4 h-4 text-[#8D1B22] dark:text-[#E5989B] shrink-0" aria-hidden="true" />
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {authUser?.role === 'staff'
                      ? 'Staff Management Desk'
                      : 'Barangay Staff Desk'}
                  </h3>
                </div>
                <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
                  {authUser?.role === 'staff'
                    ? `Signed in as ${authUser.fullName}. Manage the queue or inspect summary analytics.`
                    : 'Officials sign in separately to review filings, record remarks, and export summary reports.'}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('staff')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8D1B22] hover:text-[#701319] dark:text-[#E5989B] dark:hover:text-white transition-colors arrow-nudge"
                  >
                    <span>
                      {authUser?.role === 'staff' ? 'Open staff desk' : 'Staff login'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  {authUser?.role === 'staff' && (
                    <button
                      type="button"
                      onClick={() => onNavigate('summary')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1F241D] hover:text-[#8D1B22] dark:text-[#F2F0EA] dark:hover:text-[#E5989B] transition-colors"
                    >
                      <span>Summary report</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="h-32 w-full overflow-hidden bg-[#ECE9E2] dark:bg-[#252C24]">
                {bentoErrors.team ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#ECE9E2] dark:bg-[#252C24] text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">
                    Barangay San Miguel Officials
                  </div>
                ) : (
                  <img
                    src="/src/assets/images/bento_service_team_1795758873569.jpg"
                    alt="Community volunteers looking over Barangay San Miguel valley at dusk"
                    referrerPolicy="no-referrer"
                    onError={() => setBentoErrors((p) => ({ ...p, team: true }))}
                    className="w-full h-full object-cover object-center"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent Community Reports & Requests Ledger */}
      <section
        aria-label="Recent community reports and requests"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 reveal">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8D1B22] dark:text-[#E5989B]">
              Public Ledger
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F241D] dark:text-[#F2F0EA]">
              Recent Community Reports &amp; Requests
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('track')}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1F241D] hover:text-[#8D1B22] dark:text-[#F2F0EA] dark:hover:text-[#E5989B] transition-colors whitespace-nowrap arrow-nudge"
          >
            <span>Open Full Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl divide-y divide-[#1F241D]/10 dark:divide-white/10 overflow-hidden reveal reveal-delay-1">
          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#565A51] dark:text-[#B4B9AE]">
              No recent submissions logged yet. Use Report an Issue or Request
              Document above to submit the first entry.
            </div>
          ) : (
            recentSubmissions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTrackReference(item.referenceNumber)}
                className="w-full text-left px-5 sm:px-6 py-4 hover:bg-[#F5F3EE]/70 dark:hover:bg-[#252C24]/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 arrow-nudge"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#565A51] dark:text-[#B4B9AE]">
                    <span className="font-mono font-bold text-[#1F241D] dark:text-[#F2F0EA] tabular-nums">
                      {item.referenceNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.purok}</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[#1F241D] dark:text-[#F2F0EA] truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] truncate">
                    {item.location} · Filed {formatDisplayDate(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                  <StatusLabel status={item.status} />
                  <ArrowRight
                    className="w-4 h-4 text-[#1F241D] dark:text-[#F2F0EA]"
                    aria-hidden="true"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* 4. Warm Stone 4-Column Activity Strip (Echoes Reference Bottom Summary Strip) */}
      <section
        aria-label="Portal activity overview"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-[#ECE9E2] dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl overflow-hidden reveal">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1F241D]/10 dark:divide-white/10">
            <div className="p-6 sm:p-7 reveal reveal-delay-1">
              <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">
                Total Submissions
              </p>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] mt-2 tabular-nums leading-none">
                {stats.total}
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">
                {stats.issueCount} issues · {stats.serviceCount} requests
              </p>
            </div>

            <div className="p-6 sm:p-7 reveal reveal-delay-2">
              <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">
                Received Queue
              </p>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#8D1B22] dark:text-[#E5989B] mt-2 tabular-nums leading-none">
                {stats.byStatus.Received}
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">Awaiting staff action</p>
            </div>

            <div className="p-6 sm:p-7 reveal reveal-delay-3">
              <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">
                In Progress
              </p>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-amber-800 dark:text-amber-300 mt-2 tabular-nums leading-none">
                {stats.byStatus['In Progress']}
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">
                Assigned to barangay team
              </p>
            </div>

            <div className="p-6 sm:p-7 reveal reveal-delay-4">
              <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">
                Resolved
              </p>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-2 tabular-nums leading-none">
                {stats.byStatus.Resolved}
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">
                {stats.resolutionRatePercent}% completion rate
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
