import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
  RotateCcw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  AuthUser,
  PortalSubmission,
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
import {
  createStaffOfficialApi,
  fetchStaffSubmissions,
  resetSampleSubmissionsApi,
  updateSubmissionStatusApi,
} from '../services/api';
import { StatusLabel } from './StatusLabel';

interface StaffDashboardViewProps {
  authUser: AuthUser;
  token: string;
  onOpenSummary: () => void;
  onSubmissionsChanged: () => void;
}

export function StaffDashboardView({
  authUser,
  token,
  onOpenSummary,
  onSubmissionsChanged,
}: StaffDashboardViewProps) {
  const [submissions, setSubmissions] = useState<PortalSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | SubmissionKind>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [selectedId, setSelectedId] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<SubmissionStatus>('Received');
  const [draftRemark, setDraftRemark] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [saveError, setSaveError] = useState('');
  const [imgError, setImgError] = useState(false);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  // Add Barangay Staff Modal State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('Punong Barangay');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffCreateMsg, setStaffCreateMsg] = useState('');
  const [staffCreateError, setStaffCreateError] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetchStaffSubmissions(token);
      setSubmissions(res.submissions);
      if (res.submissions.length > 0 && !selectedId) {
        setSelectedId(res.submissions[0].id);
        setDraftStatus(res.submissions[0].status);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load staff queue.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    setSaveError('');
    setImgError(false);
    if (window.innerWidth < 1024 && inspectorRef.current) {
      inspectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSavingUpdate(true);
    setSaveError('');
    setSaveFeedback('');
    try {
      const { submission } = await updateSubmissionStatusApi(
        selectedItem.id,
        { status: draftStatus, remarkNote: draftRemark },
        token,
      );

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submission.id ? submission : s)),
      );
      setDraftRemark('');
      setSaveFeedback(
        `Updated ${submission.referenceNumber} to ${submission.status}.`,
      );
      onSubmissionsChanged();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save update.',
      );
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      const res = await resetSampleSubmissionsApi(token);
      setSubmissions(res.submissions);
      if (res.submissions[0]) {
        setSelectedId(res.submissions[0].id);
        setDraftStatus(res.submissions[0].status);
      }
      setSaveFeedback('Sample community submissions restored.');
      onSubmissionsChanged();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to reset sample data.',
      );
    }
  };

  const handleCreateStaff = async (e: FormEvent) => {
    e.preventDefault();
    setStaffCreateError('');
    setStaffCreateMsg('');
    setCreatingStaff(true);
    try {
      const res = await createStaffOfficialApi(
        {
          fullName: newStaffName,
          officialTitle: newStaffTitle,
          email: newStaffEmail,
          password: newStaffPassword,
        },
        token,
      );
      setStaffCreateMsg(
        `Added ${res.staffUser.fullName} (${res.staffUser.officialTitle}).`,
      );
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
    } catch (err) {
      setStaffCreateError(
        err instanceof Error ? err.message : 'Could not create staff account.',
      );
    } finally {
      setCreatingStaff(false);
    }
  };

  const allCategories = [...ISSUE_CATEGORIES, ...SERVICE_TYPES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-1">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>
              Signed in as {authUser.fullName} ·{' '}
              {authUser.officialTitle || 'Barangay Staff'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Barangay Staff Management Desk
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review community reports and service requests, update handling status,
            and record official remarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSummary}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4" aria-hidden="true" />
            <span>View Summary Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddStaff(true);
              setStaffCreateError('');
              setStaffCreateMsg('');
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Add Staff Account</span>
          </button>

          <button
            type="button"
            onClick={() => void handleResetDemoData()}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
        >
          {loadError}
        </div>
      )}

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
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 tabular-nums">{filtered.length}</strong>{' '}
              of <span className="tabular-nums">{submissions.length}</span> records
            </span>
            <span>Select a row to review</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading submissions queue...
            </div>
          ) : filtered.length === 0 ? (
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

                {saveError && (
                  <p role="alert" className="text-xs font-semibold text-red-700">
                    {saveError}
                  </p>
                )}

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
                  disabled={savingUpdate}
                  className="w-full min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60 transition-colors"
                >
                  {savingUpdate ? 'Saving Update...' : 'Save Status & Remark'}
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

      {/* Add Staff Official Modal */}
      {showAddStaff && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 id="add-staff-title" className="text-base font-bold text-slate-900">
                Add Barangay Staff Account
              </h2>
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                aria-label="Close modal"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3.5">
              {staffCreateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{staffCreateError}</span>
                </div>
              )}
              {staffCreateMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {staffCreateMsg}
                </div>
              )}

              <div>
                <label
                  htmlFor="new-staff-name"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Official Name
                </label>
                <input
                  id="new-staff-name"
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g., Kap. Roberto Mendoza"
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="new-staff-title"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Position / Role
                </label>
                <select
                  id="new-staff-title"
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="Punong Barangay">Punong Barangay</option>
                  <option value="Barangay Secretary">Barangay Secretary</option>
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
                  htmlFor="new-staff-email"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Official Email
                </label>
                <input
                  id="new-staff-email"
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="kapitan@barangaysanmiguel.ph"
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="new-staff-pass"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Password (8+ characters)
                </label>
                <input
                  id="new-staff-pass"
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-60"
                >
                  {creatingStaff ? 'Saving...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
