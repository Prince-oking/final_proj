import type {
  IssueCategory,
  IssueFormInput,
  PortalSubmission,
  RemarkEntry,
  ResidentFormInput,
  ServiceFormInput,
  ServiceType,
  StaffOfficial,
  SubmissionFilters,
  SubmissionKind,
  SubmissionStatus,
  SummaryStats,
  ValidationResult,
} from '../types/portal';

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Broken Streetlight',
  'Uncollected Garbage',
  'Clogged Drainage',
  'Flooding',
  'Road Damage',
  'Public Sanitation',
  'Noise / Disturbance',
  'Other',
];

export const SERVICE_TYPES: ServiceType[] = [
  'Barangay Clearance',
  'Certificate of Residency',
  'Certificate of Indigency',
  'Business Clearance Endorsement',
  'Good Moral Certificate',
];

export const PUROK_LIST: string[] = [
  'Purok 1 - Centro',
  'Purok 2 - Mabini',
  'Purok 3 - Sampaguita',
  'Purok 4 - Rizal',
  'Purok 5 - Riverside',
  'Purok 6 - Bagong Silang',
];

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'Received',
  'In Progress',
  'Resolved',
];

export function generateReferenceNumber(
  kind: SubmissionKind,
  existing: Pick<PortalSubmission, 'referenceNumber' | 'kind'>[],
  year = new Date().getFullYear(),
): string {
  const prefix = kind === 'issue' ? 'BRG' : 'REQ';
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxSeq = 100;
  for (const item of existing) {
    const match = item.referenceNumber.match(pattern);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}-${year}-${nextSeq}`;
}

export function validateIssueReport(input: IssueFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title.trim() || input.title.trim().length < 5) {
    errors.title = 'Enter a short summary of at least 5 characters.';
  }
  if (!input.category) {
    errors.category = 'Select an issue category.';
  }
  if (!input.purok.trim()) {
    errors.purok = 'Select a purok or zone.';
  }
  if (!input.location.trim() || input.location.trim().length < 5) {
    errors.location = 'Type the specific street, corner, or nearby landmark.';
  }
  if (!input.description.trim() || input.description.trim().length < 10) {
    errors.description = 'Provide details (at least 10 characters) so barangay staff can act.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateServiceRequest(input: ServiceFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.serviceType) {
    errors.serviceType = 'Select the document or service you are requesting.';
  }
  if (!input.purok.trim()) {
    errors.purok = 'Select your purok or zone.';
  }
  if (!input.location.trim() || input.location.trim().length < 5) {
    errors.location = 'Type your residential street address for verification.';
  }
  if (!input.purpose.trim() || input.purpose.trim().length < 4) {
    errors.purpose = 'State the purpose of the document (e.g., employment, scholarship).';
  }
  if (!input.preferredPickupDate.trim()) {
    errors.preferredPickupDate = 'Choose a preferred barangay hall pickup date.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateResidentRegistration(input: ResidentFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.fullName.trim() || input.fullName.trim().length < 3) {
    errors.fullName = 'Enter the resident full name.';
  }
  if (!input.purok.trim()) {
    errors.purok = 'Select a purok.';
  }
  if (!input.address.trim() || input.address.trim().length < 5) {
    errors.address = 'Enter a street or house address.';
  }
  if (!input.phone.trim() || input.phone.trim().length < 7) {
    errors.phone = 'Enter a valid mobile or landline contact number.';
  }
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address or leave blank.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterSubmissions(
  submissions: PortalSubmission[],
  filters: SubmissionFilters,
): PortalSubmission[] {
  const q = filters.query.trim().toLowerCase();

  return submissions.filter((item) => {
    if (filters.kind !== 'all' && item.kind !== filters.kind) {
      return false;
    }
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (!q) {
      return true;
    }
    return (
      item.referenceNumber.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.purok.toLowerCase().includes(q) ||
      item.residentName.toLowerCase().includes(q)
    );
  });
}

export function findSubmissionByReference(
  submissions: PortalSubmission[],
  referenceQuery: string,
): PortalSubmission | undefined {
  const normalized = referenceQuery.trim().toUpperCase();
  if (!normalized) return undefined;
  return submissions.find(
    (s) => s.referenceNumber.trim().toUpperCase() === normalized,
  );
}

export function applyStaffStatusUpdate(
  submissions: PortalSubmission[],
  submissionId: string,
  nextStatus: SubmissionStatus,
  remarkNote: string,
  official: StaffOfficial,
  timestamp = new Date().toISOString(),
  photo?: { photoDataUrl?: string; photoName?: string },
): PortalSubmission[] {
  const trimmedNote = remarkNote.trim();
  const noteText =
    trimmedNote.length > 0
      ? trimmedNote
      : `Status updated to ${nextStatus} by ${official.name}.`;

  return submissions.map((item) => {
    if (item.id !== submissionId) {
      return item;
    }
    const newRemark: RemarkEntry = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      status: nextStatus,
      authorName: official.name,
      authorRole: official.role,
      note: noteText,
      photoDataUrl: photo?.photoDataUrl,
      photoName: photo?.photoName,
    };

    return {
      ...item,
      status: nextStatus,
      updatedAt: timestamp,
      remarks: [...item.remarks, newRemark],
    };
  });
}

export function computeSummaryStats(submissions: PortalSubmission[]): SummaryStats {
  const byStatus: Record<SubmissionStatus, number> = {
    Received: 0,
    'In Progress': 0,
    Resolved: 0,
  };

  let issueCount = 0;
  let serviceCount = 0;

  const categoryMap = new Map<string, { count: number; kind: SubmissionKind }>();
  const purokMap = new Map<string, { count: number; openCount: number }>();

  for (const item of submissions) {
    byStatus[item.status] += 1;
    if (item.kind === 'issue') issueCount += 1;
    else serviceCount += 1;

    const existingCat = categoryMap.get(item.category);
    if (existingCat) {
      existingCat.count += 1;
    } else {
      categoryMap.set(item.category, { count: 1, kind: item.kind });
    }

    const purokKey = item.purok || 'Unspecified';
    const existingPurok = purokMap.get(purokKey);
    const isOpen = item.status !== 'Resolved';
    if (existingPurok) {
      existingPurok.count += 1;
      if (isOpen) existingPurok.openCount += 1;
    } else {
      purokMap.set(purokKey, { count: 1, openCount: isOpen ? 1 : 0 });
    }
  }

  const total = submissions.length;
  const resolutionRatePercent =
    total === 0 ? 0 : Math.round((byStatus.Resolved / total) * 100);

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, info]) => ({
      category,
      count: info.count,
      kind: info.kind,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const byPurok = Array.from(purokMap.entries())
    .map(([purok, info]) => ({
      purok,
      count: info.count,
      openCount: info.openCount,
    }))
    .sort((a, b) => b.count - a.count || a.purok.localeCompare(b.purok));

  return {
    total,
    issueCount,
    serviceCount,
    byStatus,
    resolutionRatePercent,
    byCategory,
    byPurok,
  };
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateSummaryCsv(submissions: PortalSubmission[]): string {
  const headers = [
    'Reference Number',
    'Type',
    'Category / Service',
    'Title',
    'Purok',
    'Location',
    'Resident',
    'Status',
    'Submitted At',
    'Last Updated',
    'Latest Remark',
  ];

  const rows = submissions.map((s) => {
    const latestRemark =
      s.remarks.length > 0 ? s.remarks[s.remarks.length - 1].note : '';
    return [
      s.referenceNumber,
      s.kind === 'issue' ? 'Issue Report' : 'Service Request',
      s.category,
      s.title,
      s.purok,
      s.location,
      s.residentName,
      s.status,
      s.createdAt,
      s.updatedAt,
      latestRemark,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDisplayDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
