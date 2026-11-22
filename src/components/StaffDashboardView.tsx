import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Image as ImageIcon,
  RotateCcw,
  Search,
  UserCog,
} from 'lucide-react';
import type {
  PortalSubmission,
  StaffOfficial,
  SubmissionKind,
  SubmissionStatus,
} from '../types/portal';
import {
  ISSUE_CATEGORIES,
  SERVICE_TYPES,
  SUBMISSION_STATUSES,
  filterSubmissions,
  formatDisplayDate,
  formatDisplayDateTime,
} from '../utils/portalLogic';
import { StatusLabel } from './StatusLabel';

interface StaffDashboardViewProps {
  submissions: PortalSubmission[];
  officials: StaffOfficial[];
  activeOfficialId: string;
  onSelectOfficial: (id: string) => void;
  onUpdateSubmission: (
    submissionId: string,
    nextStatus: SubmissionStatus,
    remarkNote: string,
  ) => void;
  onResetDemoData: () => void;
}

export function StaffDashboardView({
  submissions,
  officials,
  activeOfficialId,
  onSelectOfficial,
  onUpdateSubmission,
  onResetDemoData,
}: StaffDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | SubmissionKind>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [selectedId, setSelectedId] = useState<string>(
    submissions[0]?.id || '',
  );
  const [draftStatus, setDraftStatus] = useState<SubmissionStatus>(
    submissions[0]?.status || 'Received',
  );
  const [draftRemark, setDraftRemark] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [imgError, setImgError] = useState(false);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () =>
      filterSubmissions(submissions, {
        query: searchQuery,
        kind: kindFilter,
        status: statusFilter,
        category: categoryFilter,
      }),
    [submissions, searchQuery, kindFilter, statusFilter, categoryFilter],
  );

  const selectedItem =
    submissions.find((s) => s.id === selectedId) || filtered[0] || null;

  const handleSelectRow = (item: PortalSubmission) => {
    setSelectedId(item.id);
    setDraftStatus(item.status);
    setDraftRemark('');
    setSaveFeedback('');
    setImgError(false);
    if (window.innerWidth < 1024 && inspectorRef.current) {
      inspectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    onUpdateSubmission(selectedItem.id, draftStatus, draftRemark);
    setDraftRemark('');
    setSaveFeedback(
      `Updated ${selectedItem.referenceNumber} to ${draftStatus}.`,
    );
  };

  const allCategories = [...ISSUE_CATEGORIES, ...SERVICE_TYPES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Barangay Staff Management Desk
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review community reports and service requests, change status, and record
            official barangay remarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
            <UserCog className="w-4 h-4 text-blue-800 shrink-0" aria-hidden="true" />
            <label htmlFor="staff-official-select" className="sr-only">
              Active Barangay Official
            </label>
            <select
              id="staff-official-select"
              value={activeOfficialId}
              onChange={(e) => onSelectOfficial(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            >
              {officials.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.role})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onResetDemoData}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference #, title, purok, or resident..."
            aria-label="Search submissions"
            className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg">
            {(['all', 'issue', 'service'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  kindFilter === k
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {k === 'all' ? 'All Types' : k === 'issue' ? 'Issues' : 'Requests'}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | SubmissionStatus)
            }
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="all">All Statuses</option>
            {SUBMISSION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Split Queue & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Queue Table / Mobile List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 tabular-nums">{filtered.length}</strong>{' '}
              of <span className="tabular-nums">{submissions.length}</span> records
            </span>
            <span>Select a row to review</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                No matching submissions
              </p>
              <p className="text-xs text-slate-500">
                Adjust your search query or status filters to view records.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRow(item)}
                    className={`w-full text-left px-4 py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {item.referenceNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.purok}</span>
                        {item.photoDataUrl && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <ImageIcon className="w-3 h-3" aria-hidden="true" />
                              Photo
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {item.residentName} · Filed {formatDisplayDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <StatusLabel status={item.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Review & Action Panel */}
        <div
          ref={inspectorRef}
          className="lg:col-span-5 lg:sticky lg:top-20 bg-white border border-slate-200 rounded-xl p-5 space-y-5"
        >
          {!selectedItem ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Select a submission from the queue to review details and update status.
            </p>
          ) : (
            <>
              <div className="space-y-1 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-blue-800 tabular-nums">
                    {selectedItem.referenceNumber}
                  </span>
                  <StatusLabel status={selectedItem.status} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedItem.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedItem.category} · {selectedItem.purok}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-slate-800 leading-relaxed">
                  {selectedItem.description}
                </p>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-800">Location:</strong>{' '}
                    {selectedItem.location}
                  </p>
                  <p>
                    <strong className="text-slate-800">Resident:</strong>{' '}
                    {selectedItem.residentName} ({selectedItem.residentContact})
                  </p>
                  {selectedItem.purpose && (
                    <p>
                      <strong className="text-slate-800">Purpose:</strong>{' '}
                      {selectedItem.purpose}
                    </p>
                  )}
                  {selectedItem.preferredPickupDate && (
                    <p>
                      <strong className="text-slate-800">Pickup Date:</strong>{' '}
                      <span className="font-mono tabular-nums">
                        {formatDisplayDate(selectedItem.preferredPickupDate)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {selectedItem.photoDataUrl && (
                <div>
                  {imgError ? (
                    <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-500 text-center">
                      Photo preview unavailable
                    </div>
                  ) : (
                    <img
                      src={selectedItem.photoDataUrl}
                      alt={`Submitted photo for ${selectedItem.referenceNumber}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full max-h-52 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                </div>
              )}

              <form
                onSubmit={handleSaveUpdate}
                className="pt-4 border-t border-slate-200 space-y-3"
              >
                <div>
                  <label
                    htmlFor="staff-status-select"
                    className="block text-xs font-semibold text-slate-900 mb-1"
                  >
                    Update Status
                  </label>
                  <select
                    id="staff-status-select"
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as SubmissionStatus)
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {SUBMISSION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="staff-remark-input"
                    className="block text-xs font-semibold text-slate-900 mb-1"
                  >
                    Official Remark / Action Taken
                  </label>
                  <textarea
                    id="staff-remark-input"
                    rows={3}
                    value={draftRemark}
                    onChange={(e) => setDraftRemark(e.target.value)}
                    placeholder="e.g., Dispatched maintenance crew, or Ready for pickup at Window 1."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>

                {saveFeedback && (
                  <p
                    role="status"
                    className="text-xs font-semibold text-emerald-700"
                  >
                    {saveFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Save Status &amp; Remark
                </button>
              </form>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Remarks History ({selectedItem.remarks.length})
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {[...selectedItem.remarks].reverse().map((r) => (
                    <div
                      key={r.id}
                      className="text-xs border-b border-slate-100 pb-2 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {r.authorName} ({r.status})
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatDisplayDateTime(r.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{r.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
