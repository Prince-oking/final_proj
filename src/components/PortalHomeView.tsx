import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  FileText,
  Search,
  UserCheck,
} from 'lucide-react';
import type {
  PortalSubmission,
  PortalView,
  ResidentAccount,
  SubmissionKind,
  SummaryStats,
} from '../types/portal';
import { HERO_BARANGAY_HALL_IMAGE } from '../data/seedData';
import { formatDisplayDate } from '../utils/portalLogic';
import { StatusLabel } from './StatusLabel';

interface PortalHomeViewProps {
  activeResident: ResidentAccount;
  submissions: PortalSubmission[];
  stats: SummaryStats;
  onOpenAccountModal: () => void;
  onStartSubmission: (kind: SubmissionKind) => void;
  onTrackReference: (refNumber: string) => void;
  onNavigate: (view: PortalView) => void;
}

export function PortalHomeView({
  activeResident,
  submissions,
  stats,
  onOpenAccountModal,
  onStartSubmission,
  onTrackReference,
  onNavigate,
}: PortalHomeViewProps) {
  const [heroImgError, setHeroImgError] = useState(false);
  const [quickRef, setQuickRef] = useState('');

  const recentSubmissions = submissions.slice(0, 6);
  const residentSubmissions = submissions.filter(
    (s) => s.residentId === activeResident.id,
  );

  return (
    <div className="space-y-10">
      {/* Institutional Hero Split */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Barangay San Miguel · Community Service Desk
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 leading-[1.15] [text-wrap:balance]">
                Report neighborhood issues and request barangay documents online
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Skip the queue at the barangay hall. File community concerns with a
                photo and street location, request clearances for pickup, and follow
                every official update using your reference number.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onStartSubmission('issue')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>Report an Issue</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartSubmission('service')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Request Document</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onTrackReference(quickRef);
                }}
                className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <label htmlFor="home-quick-track" className="sr-only">
                  Track by reference number
                </label>
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="home-quick-track"
                    type="text"
                    value={quickRef}
                    onChange={(e) => setQuickRef(e.target.value)}
                    placeholder="Ref. no. (e.g., BRG-2026-0101)"
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  <span>Track Status</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200">
            {heroImgError ? (
              <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-8 text-center bg-slate-100 text-slate-600">
                <p className="text-sm font-semibold text-slate-800">
                  Barangay San Miguel Hall
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Community Service &amp; Operations Center
                </p>
              </div>
            ) : (
              <img
                src={HERO_BARANGAY_HALL_IMAGE}
                alt="Barangay San Miguel Hall exterior plaza in morning daylight"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Operational Utility Ribbon */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-800">Hall Hours:</span>
            <span>Mon–Fri 8:00 AM–5:00 PM</span>
            <span aria-hidden="true">·</span>
            <span>Document Pickup: Window 1</span>
            <span aria-hidden="true">·</span>
            <span>No online fees or SMS alerts in prototype</span>
          </div>

          <button
            type="button"
            onClick={onOpenAccountModal}
            className="inline-flex items-center gap-1.5 font-semibold text-blue-800 hover:underline whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Resident: {activeResident.fullName} ({residentSubmissions.length} submitted)
            </span>
          </button>
        </div>
      </section>

      {/* Full-Width 4-Column KPI Strip */}
      <section aria-label="Portal activity overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Submissions</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums font-mono">
              {stats.total}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.issueCount} issues · {stats.serviceCount} requests
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Received Queue</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1.5 tabular-nums font-mono">
              {stats.byStatus.Received}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting staff action</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1.5 tabular-nums font-mono">
              {stats.byStatus['In Progress']}
            </p>
            <p className="text-xs text-slate-500 mt-1">Assigned to barangay team</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1.5 tabular-nums font-mono">
              {stats.byStatus.Resolved}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.resolutionRatePercent}% completion rate
            </p>
          </div>
        </div>
      </section>

      {/* Recent Community Log + Resident Account Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Community Reports &amp; Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any reference number to view full timeline and staff remarks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('track')}
              className="text-xs font-semibold text-blue-800 hover:underline whitespace-nowrap"
            >
              Open Full Tracker
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {recentSubmissions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTrackReference(item.referenceNumber)}
                className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {item.referenceNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.purok}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.location} · Filed {formatDisplayDate(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <StatusLabel status={item.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Active Resident Profile
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Used to prefill your contact details when filing.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAccountModal}
                className="text-xs font-semibold text-blue-800 hover:underline whitespace-nowrap"
              >
                Switch / Register
              </button>
            </div>

            <dl className="space-y-2 text-sm border-t border-slate-200 pt-3">
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-slate-500">Name</dt>
                <dd className="text-xs font-semibold text-slate-900 text-right">
                  {activeResident.fullName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-slate-500">Purok</dt>
                <dd className="text-xs font-medium text-slate-800 text-right">
                  {activeResident.purok}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="text-xs font-medium text-slate-800 text-right">
                  {activeResident.address}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-xs text-slate-500">Contact</dt>
                <dd className="text-xs font-mono text-slate-800 text-right tabular-nums">
                  {activeResident.phone}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              For Barangay Officials
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review incoming resident submissions, attach official remarks, update
              statuses, and inspect category summaries.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('staff')}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
              >
                Open Staff Desk
              </button>
              <button
                type="button"
                onClick={() => onNavigate('summary')}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
              >
                View Summary
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
