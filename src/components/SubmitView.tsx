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
  IssueCategory,
  PortalSubmission,
  ResidentAccount,
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
import { PhotoAttachmentField } from './PhotoAttachmentField';

interface SubmitViewProps {
  initialKind: SubmissionKind;
  activeResident: ResidentAccount;
  onOpenAccountModal: () => void;
  onSubmitIssue: (payload: {
    title: string;
    category: IssueCategory;
    purok: string;
    location: string;
    description: string;
    urgency: UrgencyLevel;
    photoDataUrl?: string;
    photoName?: string;
  }) => PortalSubmission;
  onSubmitService: (payload: {
    serviceType: ServiceType;
    purok: string;
    location: string;
    purpose: string;
    preferredPickupDate: string;
    notes: string;
  }) => PortalSubmission;
  onTrackReference: (referenceNumber: string) => void;
}

export function SubmitView({
  initialKind,
  activeResident,
  onOpenAccountModal,
  onSubmitIssue,
  onSubmitService,
  onTrackReference,
}: SubmitViewProps) {
  const [kind, setKind] = useState<SubmissionKind>(initialKind);
  const [submittedRecord, setSubmittedRecord] = useState<PortalSubmission | null>(
    null,
  );
  const [copiedRef, setCopiedRef] = useState(false);

  // Issue Report State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState<IssueCategory | ''>('');
  const [issuePurok, setIssuePurok] = useState(activeResident.purok);
  const [issueLocation, setIssueLocation] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<UrgencyLevel>('Medium');
  const [issueDescription, setIssueDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState<string | undefined>(undefined);
  const [issueErrors, setIssueErrors] = useState<Record<string, string>>({});

  // Service Request State
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [servicePurok, setServicePurok] = useState(activeResident.purok);
  const [serviceLocation, setServiceLocation] = useState(activeResident.address);
  const [servicePurpose, setServicePurpose] = useState('');
  const [preferredPickupDate, setPreferredPickupDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 2);
    return next.toISOString().slice(0, 10);
  });
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  const handleIssueSubmit = (e: FormEvent) => {
    e.preventDefault();
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

    const created = onSubmitIssue({
      title: issueTitle.trim(),
      category: issueCategory,
      purok: issuePurok,
      location: issueLocation.trim(),
      description: issueDescription.trim(),
      urgency: issueUrgency,
      photoDataUrl,
      photoName,
    });

    setIssueTitle('');
    setIssueCategory('');
    setIssueLocation('');
    setIssueDescription('');
    setIssueUrgency('Medium');
    setPhotoDataUrl(undefined);
    setPhotoName(undefined);
    setIssueErrors({});
    setCopiedRef(false);
    setSubmittedRecord(created);
  };

  const handleServiceSubmit = (e: FormEvent) => {
    e.preventDefault();
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

    const created = onSubmitService({
      serviceType,
      purok: servicePurok,
      location: serviceLocation.trim(),
      purpose: servicePurpose.trim(),
      preferredPickupDate,
      notes: serviceNotes.trim(),
    });

    setServiceType('');
    setServicePurpose('');
    setServiceNotes('');
    setServiceErrors({});
    setCopiedRef(false);
    setSubmittedRecord(created);
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
      <section className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {submittedRecord.kind === 'issue'
                ? 'Issue Report Logged'
                : 'Service Request Recorded'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Save your reference number below to monitor status updates and remarks
              from Barangay San Miguel staff.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Reference Number</p>
            <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight mt-0.5 tabular-nums">
              {submittedRecord.referenceNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyRef(submittedRecord.referenceNumber)}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span>{copiedRef ? 'Copied Reference' : 'Copy Number'}</span>
          </button>
        </div>

        <dl className="divide-y divide-slate-200 border border-slate-200 rounded-xl text-sm">
          <div className="px-4 py-3 flex justify-between gap-4">
            <dt className="text-slate-500">Submission</dt>
            <dd className="font-semibold text-slate-900 text-right">
              {submittedRecord.title}
            </dd>
          </div>
          <div className="px-4 py-3 flex justify-between gap-4">
            <dt className="text-slate-500">Category</dt>
            <dd className="text-slate-800 text-right">{submittedRecord.category}</dd>
          </div>
          <div className="px-4 py-3 flex justify-between gap-4">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-slate-800 text-right">
              {submittedRecord.purok} · {submittedRecord.location}
            </dd>
          </div>
          <div className="px-4 py-3 flex justify-between gap-4">
            <dt className="text-slate-500">Initial Status</dt>
            <dd className="font-semibold text-blue-800 text-right">
              {submittedRecord.status}
            </dd>
          </div>
        </dl>

        {submittedRecord.photoDataUrl && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">Attached Photo</p>
            <img
              src={submittedRecord.photoDataUrl}
              alt="Submitted report evidence"
              className="w-full max-h-56 object-cover rounded-lg border border-slate-200"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onTrackReference(submittedRecord.referenceNumber)}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 whitespace-nowrap"
          >
            <SearchCheck className="w-4 h-4" aria-hidden="true" />
            <span>Track This Submission</span>
          </button>
          <button
            type="button"
            onClick={() => setSubmittedRecord(null)}
            className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            Submit Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Submit a Report or Service Request
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Provide clear details so barangay staff can assign, verify, and update your
            request.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAccountModal}
          className="min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap self-start sm:self-auto"
        >
          <UserCheck className="w-4 h-4 text-blue-800" aria-hidden="true" />
          <span>Filing as: {activeResident.fullName}</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div
        role="tablist"
        aria-label="Submission type"
        className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-xl max-w-md"
      >
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'issue'}
          onClick={() => setKind('issue')}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            kind === 'issue'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" aria-hidden="true" />
          <span>Issue Report</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'service'}
          onClick={() => setKind('service')}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            kind === 'service'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span>Service Request</span>
        </button>
      </div>

      {kind === 'issue' ? (
        <form
          onSubmit={handleIssueSubmit}
          noValidate
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="issue-category"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Issue Category
              </label>
              <select
                id="issue-category"
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value as IssueCategory)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Select category...</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {issueErrors.category && (
                <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{issueErrors.category}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="issue-urgency"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Urgency Level
              </label>
              <select
                id="issue-urgency"
                value={issueUrgency}
                onChange={(e) => setIssueUrgency(e.target.value as UrgencyLevel)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
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
              className="block text-sm font-semibold text-slate-900 mb-1.5"
            >
              Problem Summary
            </label>
            <input
              id="issue-title"
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="e.g., Broken streetlight on Purok 2"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            {issueErrors.title && (
              <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{issueErrors.title}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="issue-purok"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Purok / Zone
              </label>
              <select
                id="issue-purok"
                value={issuePurok}
                onChange={(e) => setIssuePurok(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                {PUROK_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {issueErrors.purok && (
                <p role="alert" className="text-xs text-red-700 mt-1.5">
                  {issueErrors.purok}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="issue-location"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Exact Location / Landmark
              </label>
              <input
                id="issue-location"
                type="text"
                value={issueLocation}
                onChange={(e) => setIssueLocation(e.target.value)}
                placeholder="Street name, pole #, or landmark"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              {issueErrors.location && (
                <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{issueErrors.location}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="issue-description"
              className="block text-sm font-semibold text-slate-900 mb-1.5"
            >
              Detailed Description
            </label>
            <textarea
              id="issue-description"
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe what happened, how long it has been an issue, and any safety concerns."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            {issueErrors.description && (
              <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
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

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Submitted under {activeResident.fullName} ({activeResident.phone})
            </p>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap"
            >
              Submit Issue Report
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleServiceSubmit}
          noValidate
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6"
        >
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-slate-600 leading-relaxed">
              This form creates a pickup request record for Barangay San Miguel Hall.
              Fees (if applicable) are settled in person at Window 1, and signed
              printed documents are claimed on-site with a valid ID.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="service-type"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Document / Service Type
              </label>
              <select
                id="service-type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Select document...</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {serviceErrors.serviceType && (
                <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{serviceErrors.serviceType}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="service-pickup"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Preferred Pickup Date
              </label>
              <input
                id="service-pickup"
                type="date"
                value={preferredPickupDate}
                onChange={(e) => setPreferredPickupDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              {serviceErrors.preferredPickupDate && (
                <p role="alert" className="text-xs text-red-700 mt-1.5">
                  {serviceErrors.preferredPickupDate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="service-purok"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Purok / Zone
              </label>
              <select
                id="service-purok"
                value={servicePurok}
                onChange={(e) => setServicePurok(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                {PUROK_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {serviceErrors.purok && (
                <p role="alert" className="text-xs text-red-700 mt-1.5">
                  {serviceErrors.purok}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="service-address"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Residential Address
              </label>
              <input
                id="service-address"
                type="text"
                value={serviceLocation}
                onChange={(e) => setServiceLocation(e.target.value)}
                placeholder="House #, Street Name"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              {serviceErrors.location && (
                <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{serviceErrors.location}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="service-purpose"
              className="block text-sm font-semibold text-slate-900 mb-1.5"
            >
              Purpose of Request
            </label>
            <input
              id="service-purpose"
              type="text"
              value={servicePurpose}
              onChange={(e) => setServicePurpose(e.target.value)}
              placeholder="e.g., Local employment, CHED scholarship renewal, Postal ID"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            {serviceErrors.purpose && (
              <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{serviceErrors.purpose}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service-notes"
              className="block text-sm font-semibold text-slate-900 mb-1.5"
            >
              Additional Notes <span className="font-normal text-slate-500">(Optional)</span>
            </label>
            <textarea
              id="service-notes"
              rows={3}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="Any details for the Barangay Secretary (e.g., years of residency, representative name)."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Applicant: {activeResident.fullName} ({activeResident.phone})
            </p>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap"
            >
              Submit Service Request
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
