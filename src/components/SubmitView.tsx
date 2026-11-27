import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Info,
  SearchCheck,
  UserCheck,
  Wrench,
} from 'lucide-react';
import type {
  AuthUser,
  IssueCategory,
  PortalSubmission,
  ServiceType,
  SubmissionKind,
  UrgencyLevel,
} from '../types/portal';
import {
  ISSUE_CATEGORIES,
  PUROK_LIST,
  SERVICE_TYPES,
  validateIssueReport,
  validateServiceRequest,
} from '../utils/portalLogic';
import {
  createIssueSubmission,
  createServiceSubmission,
} from '../services/api';
import { PhotoAttachmentField } from './PhotoAttachmentField';
import { ResidentAuthView } from './ResidentAuthView';
import { playSubmissionSuccessSound } from '../utils/soundFeedback';

interface SubmitViewProps {
  initialKind: SubmissionKind;
  authUser: AuthUser | null;
  token: string | null;
  onAuthenticated: (token: string, user: AuthUser) => void;
  onSignOut: () => void;
  onSubmissionCreated: (created: PortalSubmission) => void;
  onTrackReference: (referenceNumber: string) => void;
  onGoToStaffLogin: () => void;
}

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22] placeholder:text-[#565A51] dark:placeholder:text-[#989E91]';

export function SubmitView({
  initialKind,
  authUser,
  token,
  onAuthenticated,
  onSignOut,
  onSubmissionCreated,
  onTrackReference,
  onGoToStaffLogin,
}: SubmitViewProps) {
  const [kind, setKind] = useState<SubmissionKind>(initialKind);
  const [submittedRecord, setSubmittedRecord] = useState<PortalSubmission | null>(
    null,
  );
  const [copiedRef, setCopiedRef] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Issue Report State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState<IssueCategory | ''>('');
  const [issuePurok, setIssuePurok] = useState(authUser?.purok || PUROK_LIST[0]);
  const [issueLocation, setIssueLocation] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<UrgencyLevel>('Medium');
  const [issueDescription, setIssueDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState<string | undefined>(undefined);
  const [issueErrors, setIssueErrors] = useState<Record<string, string>>({});

  // Service Request State
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [servicePurok, setServicePurok] = useState(
    authUser?.purok || PUROK_LIST[0],
  );
  const [serviceLocation, setServiceLocation] = useState(authUser?.address || '');
  const [servicePurpose, setServicePurpose] = useState('');
  const [preferredPickupDate, setPreferredPickupDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 2);
    return next.toISOString().slice(0, 10);
  });
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  if (!authUser || !token) {
    return (
      <ResidentAuthView
        authUser={authUser}
        token={token}
        onAuthenticated={onAuthenticated}
        onSignOut={onSignOut}
        onStartSubmission={() => {}}
        onTrackReference={onTrackReference}
        onGoToStaffLogin={onGoToStaffLogin}
        noticeText="Sign in or create a resident account first so your report or document request is recorded under your profile."
      />
    );
  }

  const handleIssueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const result = validateIssueReport({
      title: issueTitle,
      category: issueCategory,
      purok: issuePurok,
      location: issueLocation,
      description: issueDescription,
      urgency: issueUrgency,
      photoDataUrl,
      photoName,
    });

    if (!result.valid || !issueCategory) {
      setIssueErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { submission } = await createIssueSubmission(
        {
          title: issueTitle.trim(),
          category: issueCategory,
          purok: issuePurok,
          location: issueLocation.trim(),
          description: issueDescription.trim(),
          urgency: issueUrgency,
          photoDataUrl,
          photoName,
        },
        token,
      );

      setIssueTitle('');
      setIssueCategory('');
      setIssueLocation('');
      setIssueDescription('');
      setIssueUrgency('Medium');
      setPhotoDataUrl(undefined);
      setPhotoName(undefined);
      setIssueErrors({});
      setCopiedRef(false);
      setSubmittedRecord(submission);
      void playSubmissionSuccessSound('issue');
      onSubmissionCreated(submission);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to submit issue report.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const result = validateServiceRequest({
      serviceType,
      purok: servicePurok,
      location: serviceLocation,
      purpose: servicePurpose,
      preferredPickupDate,
      notes: serviceNotes,
    });

    if (!result.valid || !serviceType) {
      setServiceErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { submission } = await createServiceSubmission(
        {
          serviceType,
          purok: servicePurok,
          location: serviceLocation.trim(),
          purpose: servicePurpose.trim(),
          preferredPickupDate,
          notes: serviceNotes.trim(),
        },
        token,
      );

      setServiceType('');
      setServicePurpose('');
      setServiceNotes('');
      setServiceErrors({});
      setCopiedRef(false);
      setSubmittedRecord(submission);
      void playSubmissionSuccessSound('service');
      onSubmissionCreated(submission);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to submit service request.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedRef(true);
    } catch {
      setCopiedRef(false);
    }
  };

  if (submittedRecord) {
    return (
      <section className="max-w-2xl mx-auto rounded-3xl overflow-hidden border border-[#1F241D]/12 dark:border-white/12 bg-white dark:bg-[#1C221B] shadow-xs view-enter">
        <div className="bg-[#1E241E] text-[#F5F3EE] p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {submittedRecord.kind === 'issue'
                  ? 'Issue Report Logged'
                  : 'Service Request Recorded'}
              </h1>
              <p className="text-sm text-white/75 mt-1">
                Save your reference number below to monitor status updates and official
                remarks.
              </p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-white/70">
                Reference Number
              </p>
              <p className="text-2xl font-bold font-mono text-white tracking-tight mt-0.5 tabular-nums">
                {submittedRecord.referenceNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyRef(submittedRecord.referenceNumber)}
              className="min-h-[40px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] bg-[#F5F3EE] hover:bg-white transition-colors whitespace-nowrap"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>{copiedRef ? 'Copied Reference' : 'Copy Number'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <dl className="divide-y divide-[#1F241D]/10 dark:divide-white/10 text-sm">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#565A51] dark:text-[#B4B9AE] font-medium">Submission</dt>
              <dd className="font-bold text-[#1F241D] dark:text-[#F2F0EA] text-right">
                {submittedRecord.title}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#565A51] dark:text-[#B4B9AE] font-medium">Category</dt>
              <dd className="text-[#1F241D] dark:text-[#F2F0EA] font-medium text-right">
                {submittedRecord.category}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#565A51] dark:text-[#B4B9AE] font-medium">Location</dt>
              <dd className="text-[#1F241D] dark:text-[#F2F0EA] font-medium text-right">
                {submittedRecord.purok} · {submittedRecord.location}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#565A51] dark:text-[#B4B9AE] font-medium">Initial Status</dt>
              <dd className="font-bold text-[#8D1B22] dark:text-[#E5989B] text-right">
                {submittedRecord.status}
              </dd>
            </div>
          </dl>

          {submittedRecord.photoDataUrl && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#565A51] dark:text-[#B4B9AE]">
                Attached Photo
              </p>
              <img
                src={submittedRecord.photoDataUrl}
                alt="Submitted report evidence"
                className="w-full max-h-56 object-cover rounded-2xl border border-[#1F241D]/12 dark:border-white/12"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onTrackReference(submittedRecord.referenceNumber)}
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors whitespace-nowrap"
            >
              <SearchCheck className="w-4 h-4" aria-hidden="true" />
              <span>Track This Submission</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmittedRecord(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/20 dark:border-white/20 hover:bg-[#1E241E] hover:text-white dark:hover:bg-[#F2F0EA] dark:hover:text-[#141814] transition-colors whitespace-nowrap"
            >
              Submit Another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-5 border-b border-[#1F241D]/12 dark:border-white/12">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D1B22] dark:text-[#E5989B]">
            Resident Intake Desk
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight">
            Submit a Report or Service Request
          </h1>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE]">
            Choose a category below so barangay officials can assign and track your filing.
          </p>
        </div>

        {/* Rounded-Pill Mode Switcher */}
        <div
          role="tablist"
          aria-label="Submission type"
          className="inline-flex p-1 rounded-full bg-[#ECE9E2] dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 self-start md:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'issue'}
            onClick={() => {
              setKind('issue');
              setSubmitError('');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              kind === 'issue'
                ? 'bg-[#8D1B22] text-white'
                : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Issue Report</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'service'}
            onClick={() => {
              setKind('service');
              setSubmitError('');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              kind === 'service'
                ? 'bg-[#1E241E] text-[#F5F3EE] dark:bg-[#F2F0EA] dark:text-[#141814]'
                : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Service Request</span>
          </button>
        </div>
      </div>

      {/* Minimal 12-Column Intake Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Brief Card */}
        <aside
          className={`lg:col-span-4 lg:sticky lg:top-20 rounded-3xl p-6 sm:p-7 text-white space-y-6 transition-colors ${
            kind === 'issue' ? 'bg-[#8D1B22]' : 'bg-[#1E241E]'
          }`}
        >
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
              {kind === 'issue' ? 'Neighborhood Reporting' : 'Hall Window 1 Queue'}
            </p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
              {kind === 'issue'
                ? 'Log concerns with clear photo context.'
                : 'Reserve clearances for faster release.'}
            </h2>
          </div>

          <ol className="space-y-3.5 text-xs text-white/90 border-t border-white/20 pt-5">
            <li className="flex gap-3">
              <span className="font-mono font-bold text-white/70 shrink-0">01</span>
              <span>
                {kind === 'issue'
                  ? 'Select the category, purok, and nearest landmark or pole number.'
                  : 'Choose your requested document and preferred pickup date.'}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-white/70 shrink-0">02</span>
              <span>
                Receive an instant <span className="font-mono font-bold">{kind === 'issue' ? 'BRG-' : 'REQ-'}</span> tracking reference number.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-white/70 shrink-0">03</span>
              <span>
                {kind === 'issue'
                  ? 'Follow barangay field crew remarks from Received to Resolved.'
                  : 'Present valid ID and settle any barangay fee at Window 1 on pickup.'}
              </span>
            </li>
          </ol>

          <div className="bg-black/20 rounded-2xl p-4 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Filing as {authUser.fullName}</span>
            </div>
            <p className="text-white/75 pl-6">
              {authUser.purok} · {authUser.phone || authUser.email}
            </p>
          </div>
        </aside>

        {/* Right Minimal Intake Form */}
        <div className="lg:col-span-8">
          {submitError && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-[#3A1719] border border-[#8D1B22] dark:border-[#E5989B]/60 text-xs font-semibold text-[#701319] dark:text-[#FAD2D4] flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          {kind === 'issue' ? (
            <form
              onSubmit={handleIssueSubmit}
              noValidate
              className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-8 space-y-6 view-enter"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="issue-category"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Issue Category
                  </label>
                  <select
                    id="issue-category"
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value as IssueCategory)}
                    className={inputClass}
                  >
                    <option value="">Select category...</option>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {issueErrors.category && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{issueErrors.category}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="issue-urgency"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Urgency Level
                  </label>
                  <select
                    id="issue-urgency"
                    value={issueUrgency}
                    onChange={(e) => setIssueUrgency(e.target.value as UrgencyLevel)}
                    className={inputClass}
                  >
                    <option value="Low">Low — Minor inconvenience</option>
                    <option value="Medium">Medium — Needs scheduled attention</option>
                    <option value="High">High — Safety hazard / urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="issue-title"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Problem Summary
                </label>
                <input
                  id="issue-title"
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g., Broken streetlight on Purok 2"
                  className={inputClass}
                />
                {issueErrors.title && (
                  <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{issueErrors.title}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="issue-purok"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Purok / Zone
                  </label>
                  <select
                    id="issue-purok"
                    value={issuePurok}
                    onChange={(e) => setIssuePurok(e.target.value)}
                    className={inputClass}
                  >
                    {PUROK_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {issueErrors.purok && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5">
                      {issueErrors.purok}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="issue-location"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Exact Location / Landmark
                  </label>
                  <input
                    id="issue-location"
                    type="text"
                    value={issueLocation}
                    onChange={(e) => setIssueLocation(e.target.value)}
                    placeholder="Street name, pole #, or landmark"
                    className={inputClass}
                  />
                  {issueErrors.location && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{issueErrors.location}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="issue-description"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Detailed Description
                </label>
                <textarea
                  id="issue-description"
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what happened, how long it has been an issue, and any safety concerns."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22] placeholder:text-[#565A51] dark:placeholder:text-[#989E91]"
                />
                {issueErrors.description && (
                  <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{issueErrors.description}</span>
                  </p>
                )}
              </div>

              <PhotoAttachmentField
                photoDataUrl={photoDataUrl}
                photoName={photoName}
                onChange={(url, name) => {
                  setPhotoDataUrl(url);
                  setPhotoName(name);
                }}
              />

              <div className="pt-4 border-t border-[#1F241D]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#565A51] dark:text-[#B4B9AE]">
                  Logged directly to Barangay San Miguel queue.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue Report'}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleServiceSubmit}
              noValidate
              className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-8 space-y-6 view-enter"
            >
              <div className="p-4 rounded-2xl bg-[#ECE9E2]/70 dark:bg-[#252C24] flex items-start gap-3">
                <Info className="w-4 h-4 text-[#8D1B22] dark:text-[#E5989B] shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
                  Fees (if applicable) are settled in person at Window 1, and signed
                  printed documents are claimed on-site with a valid ID.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="service-type"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Document / Service Type
                  </label>
                  <select
                    id="service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className={inputClass}
                  >
                    <option value="">Select document...</option>
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {serviceErrors.serviceType && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{serviceErrors.serviceType}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="service-pickup"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Preferred Pickup Date
                  </label>
                  <input
                    id="service-pickup"
                    type="date"
                    value={preferredPickupDate}
                    onChange={(e) => setPreferredPickupDate(e.target.value)}
                    className={inputClass}
                  />
                  {serviceErrors.preferredPickupDate && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5">
                      {serviceErrors.preferredPickupDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="service-purok"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Purok / Zone
                  </label>
                  <select
                    id="service-purok"
                    value={servicePurok}
                    onChange={(e) => setServicePurok(e.target.value)}
                    className={inputClass}
                  >
                    {PUROK_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {serviceErrors.purok && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5">
                      {serviceErrors.purok}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="service-address"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                  >
                    Residential Address
                  </label>
                  <input
                    id="service-address"
                    type="text"
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    placeholder="House #, Street Name"
                    className={inputClass}
                  />
                  {serviceErrors.location && (
                    <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{serviceErrors.location}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="service-purpose"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Purpose of Request
                </label>
                <input
                  id="service-purpose"
                  type="text"
                  value={servicePurpose}
                  onChange={(e) => setServicePurpose(e.target.value)}
                  placeholder="e.g., Local employment, CHED scholarship renewal, Postal ID"
                  className={inputClass}
                />
                {serviceErrors.purpose && (
                  <p role="alert" className="text-xs font-semibold text-[#8D1B22] dark:text-[#E5989B] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{serviceErrors.purpose}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="service-notes"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] mb-1.5"
                >
                  Additional Notes <span className="font-normal text-[#565A51] dark:text-[#B4B9AE]">(Optional)</span>
                </label>
                <textarea
                  id="service-notes"
                  rows={3}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Any details for the Barangay Secretary (e.g., years of residency, representative name)."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F3EE]/50 dark:bg-[#141814] text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 rounded-xl focus:bg-white dark:focus:bg-[#181D17] focus:border-[#8D1B22] focus:outline-none focus:ring-1 focus:ring-[#8D1B22] placeholder:text-[#565A51] dark:placeholder:text-[#989E91]"
                />
              </div>

              <div className="pt-4 border-t border-[#1F241D]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#565A51] dark:text-[#B4B9AE]">
                  Applicant: {authUser.fullName}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] hover:bg-[#2B332B] dark:bg-[#8D1B22] dark:hover:bg-[#701319] transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Service Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
