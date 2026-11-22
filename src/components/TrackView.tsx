import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Search, SearchX } from 'lucide-react';
import type { PortalSubmission } from '../types/portal';
import {
  SUBMISSION_STATUSES,
  formatDisplayDate,
  formatDisplayDateTime,
} from '../utils/portalLogic';
import { trackSubmissionByReference } from '../services/api';
import { StatusLabel } from './StatusLabel';

interface TrackViewProps {
  token: string | null;
  quickReferences: string[];
  initialReference: string;
}

export function TrackView({
  token,
  quickReferences,
  initialReference,
}: TrackViewProps) {
  const defaultRef = initialReference || quickReferences[0] || 'BRG-2026-0101';
  const [query, setQuery] = useState(defaultRef);
  const [searchedRef, setSearchedRef] = useState(defaultRef);
  const [match, setMatch] = useState<PortalSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState('');
  const [imgError, setImgError] = useState(false);

  const performLookup = async (refToLookup: string) => {
    const clean = refToLookup.trim();
    setSearchedRef(clean);
    setImgError(false);
    setNotFoundMsg('');
    if (!clean) {
      setMatch(null);
      return;
    }

    setLoading(true);
    try {
      const res = await trackSubmissionByReference(clean, token);
      setMatch(res.submission);
    } catch (err) {
      setMatch(null);
      setNotFoundMsg(
        err instanceof Error ? err.message : `No record found for "${clean}".`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const target = initialReference || quickReferences[0] || 'BRG-2026-0101';
    setQuery(target);
    void performLookup(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReference]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void performLookup(query);
  };

  const quickSelect = (ref: string) => {
    setQuery(ref);
    void performLookup(ref);
  };

  const activeStepIndex = match
    ? SUBMISSION_STATUSES.indexOf(match.status)
    : -1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Track Report or Request Status
        </h1>
        <p className="text-sm text-slate-600">
          Enter your reference number to inspect current barangay handling status,
          attached photo, and official remarks.
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <label htmlFor="track-ref-input" className="sr-only">
            Reference Number
          </label>
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="track-ref-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., BRG-2026-0101 or REQ-2026-0102"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] px-6 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Look Up Reference'}
          </button>
        </form>

        {quickReferences.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Quick select:</span>
            {quickReferences.slice(0, 5).map((ref) => {
              const isSelected = match?.referenceNumber === ref;
              return (
                <button
                  key={ref}
                  type="button"
                  onClick={() => quickSelect(ref)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-800 text-white border-blue-800'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ref}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result State */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Looking up {searchedRef}...
        </div>
      ) : !searchedRef.trim() ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-base font-semibold text-slate-900">
            Enter a reference number above
          </p>
          <p className="text-sm text-slate-500">
            Issue reports start with <span className="font-mono">BRG-</span> and
            service requests start with <span className="font-mono">REQ-</span>.
          </p>
        </div>
      ) : !match ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <SearchX
            className="w-8 h-8 text-slate-400 mx-auto"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-semibold text-slate-900">
              {notFoundMsg || `No record found for "${searchedRef.trim()}"`}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Check the spelling of your reference number or select one of the
              recent submissions above.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {match.referenceNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {match.kind === 'issue' ? 'Issue Report' : 'Service Request'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{match.category}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{match.title}</h2>
            </div>

            <div className="shrink-0">
              <StatusLabel status={match.status} size="md" />
            </div>
          </div>

          {/* 3-Step Progress Stepper */}
          <div className="px-5 sm:px-6 py-5 bg-slate-50 border-b border-slate-200">
            <ol className="grid grid-cols-3 gap-3">
              {SUBMISSION_STATUSES.map((step, index) => {
                const completed = index <= activeStepIndex;
                const isCurrent = index === activeStepIndex;
                return (
                  <li key={step} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          completed
                            ? 'bg-blue-800 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {completed ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isCurrent
                            ? 'text-slate-900'
                            : completed
                              ? 'text-slate-700'
                              : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    <div
                      className={`h-1 rounded-full ${
                        completed ? 'bg-blue-800' : 'bg-slate-200'
                      }`}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Submission Details
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {match.description}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Purok / Location</dt>
                  <dd className="font-medium text-slate-900 mt-0.5">
                    {match.purok} — {match.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Submitted By</dt>
                  <dd className="font-medium text-slate-900 mt-0.5">
                    {match.residentName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date Filed</dt>
                  <dd className="font-mono text-xs text-slate-800 mt-0.5 tabular-nums">
                    {formatDisplayDateTime(match.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Last Updated</dt>
                  <dd className="font-mono text-xs text-slate-800 mt-0.5 tabular-nums">
                    {formatDisplayDateTime(match.updatedAt)}
                  </dd>
                </div>
                {match.purpose && (
                  <div>
                    <dt className="text-xs text-slate-500">Document Purpose</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">
                      {match.purpose}
                    </dd>
                  </div>
                )}
                {match.preferredPickupDate && (
                  <div>
                    <dt className="text-xs text-slate-500">Preferred Pickup</dt>
                    <dd className="font-mono text-xs text-slate-900 mt-0.5 tabular-nums">
                      {formatDisplayDate(match.preferredPickupDate)}
                    </dd>
                  </div>
                )}
              </dl>

              {match.photoDataUrl && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attached Photo Evidence
                  </h3>
                  {imgError ? (
                    <div className="p-6 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
                      Photo preview unavailable ({match.photoName || 'image'})
                    </div>
                  ) : (
                    <img
                      src={match.photoDataUrl}
                      alt={`Evidence for ${match.referenceNumber}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full max-h-72 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Official Remarks Timeline */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Barangay Remarks &amp; Activity Log
              </h3>

              <ol className="space-y-4">
                {[...match.remarks].reverse().map((remark) => (
                  <li
                    key={remark.id}
                    className="pb-4 border-b border-slate-100 last:border-b-0 last:pb-0 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusLabel status={remark.status} />
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {formatDisplayDateTime(remark.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {remark.note}
                    </p>
                    <p className="text-xs text-slate-500">
                      {remark.authorName} · {remark.authorRole}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
