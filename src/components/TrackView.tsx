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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Minimal Centered Lookup Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D1B22] dark:text-[#E5989B]">
            Public Reference Tracker
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight [text-wrap:balance]">
            Track Report or Request Status
          </h1>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE]">
            Inspect live barangay handling progress, photo evidence, and official remarks.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-[#1C221B] border border-[#1F241D]/15 dark:border-white/15 rounded-2xl sm:rounded-full p-1.5 shadow-xs"
        >
          <label htmlFor="track-ref-input" className="sr-only">
            Reference Number
          </label>
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#565A51] dark:text-[#B4B9AE] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="track-ref-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="BRG-2026-0101 or REQ-2026-0102"
              className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm font-mono bg-transparent text-[#1F241D] dark:text-[#F2F0EA] rounded-full placeholder:font-sans placeholder:text-[#565A51] dark:placeholder:text-[#989E91] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[42px] px-6 py-2 rounded-xl sm:rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Look Up'}
          </button>
        </form>

        {quickReferences.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-xs text-[#565A51] dark:text-[#B4B9AE] mr-1">Recent:</span>
            {quickReferences.slice(0, 5).map((ref) => {
              const isSelected = match?.referenceNumber === ref;
              return (
                <button
                  key={ref}
                  type="button"
                  onClick={() => quickSelect(ref)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#1E241E] text-[#F5F3EE] border-[#1E241E] dark:bg-[#8D1B22] dark:text-white dark:border-[#8D1B22]'
                      : 'bg-white text-[#1F241D] border-[#1F241D]/15 hover:border-[#8D1B22] dark:bg-[#1C221B] dark:text-[#F2F0EA] dark:border-white/15 dark:hover:border-[#E5989B]'
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
        <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-12 text-center text-sm font-medium text-[#565A51] dark:text-[#B4B9AE]">
          Looking up {searchedRef}...
        </div>
      ) : !searchedRef.trim() ? (
        <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-12 text-center space-y-2">
          <p className="font-display text-xl font-bold text-[#1F241D] dark:text-[#F2F0EA]">
            Enter a reference number above
          </p>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE]">
            Issue reports start with <span className="font-mono font-bold">BRG-</span> and
            service requests start with <span className="font-mono font-bold">REQ-</span>.
          </p>
        </div>
      ) : !match ? (
        <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-12 text-center space-y-3">
          <SearchX
            className="w-8 h-8 text-[#565A51] dark:text-[#B4B9AE] mx-auto"
            aria-hidden="true"
          />
          <div>
            <p className="font-display text-xl font-bold text-[#1F241D] dark:text-[#F2F0EA]">
              {notFoundMsg || `No record found for "${searchedRef.trim()}"`}
            </p>
            <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] mt-1">
              Check the spelling of your reference number or select one of the
              recent submissions above.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden border border-[#1F241D]/12 dark:border-white/12 bg-white dark:bg-[#1C221B] shadow-xs view-enter">
          {/* Dark Forest Charcoal Ticket Header + Progress Rail */}
          <div className="bg-[#1E241E] text-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-white/75">
                  <span className="font-mono font-bold text-[#F5F3EE] tabular-nums">
                    {match.referenceNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {match.kind === 'issue' ? 'Issue Report' : 'Service Request'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{match.category}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {match.title}
                </h2>
              </div>

              <div className="shrink-0">
                <StatusLabel status={match.status} size="md" />
              </div>
            </div>

            <ol className="grid grid-cols-3 gap-3 sm:gap-5 pt-2">
              {SUBMISSION_STATUSES.map((step, index) => {
                const completed = index <= activeStepIndex;
                const isCurrent = index === activeStepIndex;
                return (
                  <li key={step} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                          completed
                            ? 'bg-[#8D1B22] text-white'
                            : 'bg-white/10 text-white/60 border border-white/20'
                        }`}
                      >
                        {completed ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent
                            ? 'text-white'
                            : completed
                              ? 'text-white/90'
                              : 'text-white/50'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          completed ? 'bg-[#8D1B22] w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Minimal Split Content: Details (Left) & Stone Activity Rail (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 bg-white dark:bg-[#1C221B]">
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#565A51] dark:text-[#B4B9AE]">
                  Submission Details
                </h3>
                <p className="text-sm sm:text-base text-[#1F241D] dark:text-[#F2F0EA] leading-relaxed">
                  {match.description}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-[#1F241D]/10 dark:border-white/10 text-sm">
                <div>
                  <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Purok / Location</dt>
                  <dd className="font-semibold text-[#1F241D] dark:text-[#F2F0EA] mt-0.5">
                    {match.purok} — {match.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Submitted By</dt>
                  <dd className="font-semibold text-[#1F241D] dark:text-[#F2F0EA] mt-0.5">
                    {match.residentName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Date Filed</dt>
                  <dd className="font-mono text-xs text-[#1F241D] dark:text-[#F2F0EA] mt-0.5 tabular-nums">
                    {formatDisplayDateTime(match.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Last Updated</dt>
                  <dd className="font-mono text-xs text-[#1F241D] dark:text-[#F2F0EA] mt-0.5 tabular-nums">
                    {formatDisplayDateTime(match.updatedAt)}
                  </dd>
                </div>
                {match.purpose && (
                  <div>
                    <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Document Purpose</dt>
                    <dd className="font-semibold text-[#1F241D] dark:text-[#F2F0EA] mt-0.5">
                      {match.purpose}
                    </dd>
                  </div>
                )}
                {match.preferredPickupDate && (
                  <div>
                    <dt className="text-xs text-[#565A51] dark:text-[#B4B9AE]">Preferred Pickup</dt>
                    <dd className="font-mono text-xs text-[#1F241D] dark:text-[#F2F0EA] mt-0.5 tabular-nums">
                      {formatDisplayDate(match.preferredPickupDate)}
                    </dd>
                  </div>
                )}
              </dl>

              {match.photoDataUrl && (
                <div className="pt-5 border-t border-[#1F241D]/10 dark:border-white/10 space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#565A51] dark:text-[#B4B9AE]">
                    Attached Photo Evidence
                  </h3>
                  {imgError ? (
                    <div className="p-6 bg-[#ECE9E2] dark:bg-[#252C24] rounded-2xl text-center text-xs text-[#565A51] dark:text-[#B4B9AE]">
                      Photo preview unavailable ({match.photoName || 'image'})
                    </div>
                  ) : (
                    <img
                      src={match.photoDataUrl}
                      alt={`Evidence for ${match.referenceNumber}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full max-h-72 object-cover rounded-2xl border border-[#1F241D]/10 dark:border-white/12"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Warm Stone Official Activity Log */}
            <div className="lg:col-span-5 bg-[#ECE9E2]/60 dark:bg-[#181D17] border-t lg:border-t-0 lg:border-l border-[#1F241D]/10 dark:border-white/10 p-6 sm:p-8 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#565A51] dark:text-[#B4B9AE]">
                Official Remarks ({match.remarks.length})
              </h3>

              <ol className="space-y-3">
                {[...match.remarks].reverse().map((remark) => (
                  <li
                    key={remark.id}
                    className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl p-4 space-y-2 hover-lift"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusLabel status={remark.status} />
                      <span className="text-[11px] font-mono text-[#565A51] dark:text-[#B4B9AE] tabular-nums">
                        {formatDisplayDateTime(remark.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-[#1F241D] dark:text-[#F2F0EA] leading-relaxed">
                      {remark.note}
                    </p>
                    {remark.photoDataUrl && (
                      <div className="pt-1 space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#565A51] dark:text-[#B4B9AE]">
                          {remark.status === 'Resolved'
                            ? 'Resolved Proof Photo'
                            : 'Official Update Photo'}
                        </p>
                        <img
                          src={remark.photoDataUrl}
                          alt={
                            remark.photoName
                              ? `Official proof: ${remark.photoName}`
                              : `Official update photo for ${match.referenceNumber}`
                          }
                          referrerPolicy="no-referrer"
                          className="w-full max-h-48 object-cover rounded-xl border border-[#1F241D]/10 dark:border-white/12"
                        />
                      </div>
                    )}
                    <p className="text-xs text-[#565A51] dark:text-[#B4B9AE]">
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
