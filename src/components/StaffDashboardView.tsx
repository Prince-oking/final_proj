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
import { PhotoAttachmentField } from './PhotoAttachmentField';
import { StatusLabel } from './StatusLabel';

interface StaffDashboardViewProps {
  authUser: AuthUser;
  token: string;
  onOpenSummary: () => void;
  onSubmissionsChanged: () => void;
}

const inputClass =
  'w-full min-h-[42px] px-3.5 py-2 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] placeholder:text-[#565A51]/70 dark:placeholder:text-[#989E91] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22]';

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
  const [draftPhotoDataUrl, setDraftPhotoDataUrl] = useState<string | undefined>(undefined);
  const [draftPhotoName, setDraftPhotoName] = useState<string | undefined>(undefined);
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
    setDraftPhotoDataUrl(undefined);
    setDraftPhotoName(undefined);
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
        {
          status: draftStatus,
          remarkNote: draftRemark,
          photoDataUrl: draftPhotoDataUrl,
          photoName: draftPhotoName,
        },
        token,
      );

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submission.id ? submission : s)),
      );
      setDraftRemark('');
      setDraftPhotoDataUrl(undefined);
      setDraftPhotoName(undefined);
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
      {/* Minimal Official Desk Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#1F241D]/12 dark:border-white/12">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D1B22] dark:text-[#E5989B] mb-1">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>
              {authUser.fullName} · {authUser.officialTitle || 'Barangay Staff'}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight">
            Barangay Staff Management Desk
          </h1>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] mt-1">
            Review community submissions, update handling status, and post official remarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSummary}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors whitespace-nowrap"
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
            className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] dark:bg-[#252C24] hover:bg-[#2B332B] dark:hover:bg-[#2F372E] dark:border dark:border-white/15 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Add Staff Account</span>
          </button>

          <button
            type="button"
            onClick={() => void handleResetDemoData()}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 bg-white dark:bg-[#1C221B] hover:bg-[#ECE9E2] dark:hover:bg-[#252C24] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-[#3A1719] border border-[#8D1B22] dark:border-[#E5989B]/60 text-sm font-semibold text-[#701319] dark:text-[#FAD2D4]"
        >
          {loadError}
        </div>
      )}

      {/* Minimal Filter Bar */}
      <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-2xl p-3.5 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-[#565A51] dark:text-[#B4B9AE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference #, title, purok, or resident..."
            aria-label="Search submissions"
            className="w-full min-h-[40px] pl-10 pr-4 py-1.5 text-sm bg-[#F5F3EE]/60 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] placeholder:text-[#565A51]/70 dark:placeholder:text-[#989E91] border border-[#1F241D]/12 dark:border-white/15 rounded-full focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-full bg-[#ECE9E2] dark:bg-[#252C24] border border-[#1F241D]/10 dark:border-white/12">
            {(['all', 'issue', 'service'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  kindFilter === k
                    ? 'bg-[#1E241E] dark:bg-[#8D1B22] text-[#F5F3EE]'
                    : 'text-[#565A51] dark:text-[#B4B9AE] hover:text-[#1F241D] dark:hover:text-[#F2F0EA]'
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
            className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-[#F5F3EE]/60 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/12 dark:border-white/15 rounded-full focus:border-[#8D1B22] focus:outline-none"
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
            className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-[#F5F3EE]/60 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/12 dark:border-white/15 rounded-full focus:border-[#8D1B22] focus:outline-none"
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

      {/* Split Queue & Sticky Review Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#ECE9E2]/65 dark:bg-[#252C24]/70 border-b border-[#1F241D]/10 dark:border-white/10 flex items-center justify-between text-xs font-medium text-[#565A51] dark:text-[#B4B9AE]">
            <span>
              Showing <strong className="text-[#1F241D] dark:text-[#F2F0EA] tabular-nums">{filtered.length}</strong>{' '}
              of <span className="tabular-nums">{submissions.length}</span> records
            </span>
            <span className="uppercase tracking-wider text-[11px]">
              Select a row to review
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#565A51] dark:text-[#B4B9AE]">
              Loading submissions queue...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="font-display text-lg font-bold text-[#1F241D] dark:text-[#F2F0EA]">
                No matching submissions
              </p>
              <p className="text-xs text-[#565A51] dark:text-[#B4B9AE]">
                Adjust your search query or status filters to view records.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1F241D]/10 dark:divide-white/10">
              {filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRow(item)}
                    className={`w-full text-left px-5 py-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#ECE9E2]/70 dark:bg-[#252C24]'
                        : 'bg-white dark:bg-[#1C221B] hover:bg-[#F5F3EE]/60 dark:hover:bg-[#252C24]/60'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#565A51] dark:text-[#B4B9AE]">
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            isSelected ? 'text-[#8D1B22] dark:text-[#E5989B]' : 'text-[#1F241D] dark:text-[#F2F0EA]'
                          }`}
                        >
                          {item.referenceNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.purok}</span>
                        {item.photoDataUrl && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[#1F241D] dark:text-[#F2F0EA] font-semibold">
                              <ImageIcon className="w-3 h-3" aria-hidden="true" />
                              Photo
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#1F241D] dark:text-[#F2F0EA] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] truncate">
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
          className="lg:col-span-5 lg:sticky lg:top-20 bg-white dark:bg-[#1C221B] border border-[#1F241D]/12 dark:border-white/12 rounded-3xl p-6 space-y-5 shadow-xs"
        >
          {!selectedItem ? (
            <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] py-8 text-center">
              Select a submission from the queue to review details and update status.
            </p>
          ) : (
            <>
              <div className="space-y-1.5 pb-4 border-b border-[#1F241D]/10 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-[#8D1B22] dark:text-[#E5989B] tabular-nums">
                    {selectedItem.referenceNumber}
                  </span>
                  <StatusLabel status={selectedItem.status} />
                </div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#1F241D] dark:text-[#F2F0EA]">
                  {selectedItem.title}
                </h2>
                <p className="text-xs font-medium text-[#565A51] dark:text-[#B4B9AE]">
                  {selectedItem.category} · {selectedItem.purok}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-[#1F241D] dark:text-[#F2F0EA] leading-relaxed">
                  {selectedItem.description}
                </p>
                <div className="bg-[#ECE9E2]/65 dark:bg-[#252C24]/70 rounded-2xl p-3.5 text-xs text-[#565A51] dark:text-[#B4B9AE] space-y-1">
                  <p>
                    <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Location:</strong>{' '}
                    {selectedItem.location}
                  </p>
                  <p>
                    <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Resident:</strong>{' '}
                    {selectedItem.residentName} ({selectedItem.residentContact})
                  </p>
                  {selectedItem.purpose && (
                    <p>
                      <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Purpose:</strong>{' '}
                      {selectedItem.purpose}
                    </p>
                  )}
                  {selectedItem.preferredPickupDate && (
                    <p>
                      <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Pickup Date:</strong>{' '}
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
                    <div className="p-4 bg-[#ECE9E2] dark:bg-[#252C24] rounded-2xl text-xs text-[#565A51] dark:text-[#B4B9AE] text-center">
                      Photo preview unavailable
                    </div>
                  ) : (
                    <img
                      src={selectedItem.photoDataUrl}
                      alt={`Submitted photo for ${selectedItem.referenceNumber}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full max-h-52 object-cover rounded-2xl border border-[#1F241D]/10 dark:border-white/12"
                    />
                  )}
                </div>
              )}

              <form
                onSubmit={handleSaveUpdate}
                className="pt-4 border-t border-[#1F241D]/10 dark:border-white/10 space-y-3.5"
              >
                <div>
                  <label
                    htmlFor="staff-status-select"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Update Status
                  </label>
                  <select
                    id="staff-status-select"
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as SubmissionStatus)
                    }
                    className={inputClass}
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
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                  >
                    Official Remark / Action Taken
                  </label>
                  <textarea
                    id="staff-remark-input"
                    rows={3}
                    value={draftRemark}
                    onChange={(e) => setDraftRemark(e.target.value)}
                    placeholder="e.g., Drainage unclogged and cleared, or Ready for pickup at Window 1."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] placeholder:text-[#565A51]/70 dark:placeholder:text-[#989E91] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22]"
                  />
                </div>

                <PhotoAttachmentField
                  photoDataUrl={draftPhotoDataUrl}
                  photoName={draftPhotoName}
                  onChange={(url, name) => {
                    setDraftPhotoDataUrl(url);
                    setDraftPhotoName(name);
                  }}
                  label={
                    draftStatus === 'Resolved'
                      ? 'Resolved Proof Photo'
                      : 'Action / Proof Photo'
                  }
                  optionalLabel="(Optional)"
                  promptTitle={
                    draftStatus === 'Resolved'
                      ? 'Attach proof that the issue is resolved'
                      : 'Attach progress or field photo'
                  }
                  promptSubtitle="e.g., unclogged drainage, repaired streetlight, or completed work."
                  readySubtitle="Will appear on public tracking timeline"
                  compact
                />

                {saveError && (
                  <p role="alert" className="text-xs font-bold text-[#8D1B22] dark:text-[#E5989B]">
                    {saveError}
                  </p>
                )}

                {saveFeedback && (
                  <p role="status" className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {saveFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingUpdate}
                  className="w-full min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60"
                >
                  {savingUpdate ? 'Saving Update...' : 'Save Status & Remark'}
                </button>
              </form>

              <div className="pt-3 border-t border-[#1F241D]/10 dark:border-white/10 space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#565A51] dark:text-[#B4B9AE]">
                  Remarks History ({selectedItem.remarks.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {[...selectedItem.remarks].reverse().map((r) => (
                    <div
                      key={r.id}
                      className="text-xs border-b border-[#1F241D]/10 dark:border-white/10 pb-2.5 last:border-b-0 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[#565A51] dark:text-[#B4B9AE]">
                        <span className="font-bold text-[#1F241D] dark:text-[#F2F0EA]">
                          {r.authorName} ({r.status})
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatDisplayDateTime(r.timestamp)}
                        </span>
                      </div>
                      <p className="text-[#565A51] dark:text-[#B4B9AE]">{r.note}</p>
                      {r.photoDataUrl && (
                        <img
                          src={r.photoDataUrl}
                          alt={
                            r.photoName
                              ? `Staff proof: ${r.photoName}`
                              : `Proof for ${selectedItem.referenceNumber}`
                          }
                          referrerPolicy="no-referrer"
                          className="w-full max-h-36 object-cover rounded-xl border border-[#1F241D]/12 dark:border-white/12"
                        />
                      )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E241E]/75 dark:bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md bg-[#F5F3EE] dark:bg-[#1C221B] border border-[#1F241D]/20 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#1E241E] dark:bg-[#141814] text-[#F5F3EE] dark:border-b dark:border-white/10">
              <h2
                id="add-staff-title"
                className="font-display text-lg font-bold tracking-tight"
              >
                Add Barangay Staff Account
              </h2>
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                aria-label="Close modal"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-[#F5F3EE] hover:text-[#E5989B] transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-3.5">
              {staffCreateError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-[#3A1719] border border-[#8D1B22] dark:border-[#E5989B]/60 text-xs font-semibold text-[#701319] dark:text-[#FAD2D4] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{staffCreateError}</span>
                </div>
              )}
              {staffCreateMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-700 dark:border-emerald-500/40 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {staffCreateMsg}
                </div>
              )}

              <div>
                <label
                  htmlFor="new-staff-name"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
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
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="new-staff-title"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                >
                  Position / Role
                </label>
                <select
                  id="new-staff-title"
                  value={newStaffTitle}
                  onChange={(e) => setNewStaffTitle(e.target.value)}
                  className={inputClass}
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
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
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
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="new-staff-pass"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1"
                >
                  Password (8+ characters)
                </label>
                <input
                  id="new-staff-pass"
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="min-h-[40px] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/15 hover:bg-[#1E241E] dark:hover:bg-[#252C24] hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="min-h-[40px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60"
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
