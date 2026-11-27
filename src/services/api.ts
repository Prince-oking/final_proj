import type {
  AuthUser,
  IssueCategory,
  PortalSubmission,
  ServiceType,
  SubmissionStatus,
  SummaryStats,
  UrgencyLevel,
} from '../types/portal';

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    errors?: Record<string, string>;
  };

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & {
      fieldErrors?: Record<string, string>;
      status?: number;
    };
    err.fieldErrors = data.errors;
    err.status = res.status;
    throw err;
  }

  return data;
}

export function fetchPortalOverview() {
  return requestJson<{ stats: SummaryStats; recent: PortalSubmission[] }>(
    '/api/portal/overview',
  );
}

export function fetchStaffAuthStatus() {
  return requestJson<{
    needsSetup: boolean;
    envAdminConfigured: boolean;
    staffCount: number;
  }>('/api/auth/staff/status');
}

export function registerResident(payload: {
  fullName: string;
  purok: string;
  address: string;
  phone: string;
  email: string;
  password: string;
}) {
  return requestJson<{ token: string; user: AuthUser }>(
    '/api/auth/resident/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function loginResident(payload: { email: string; password: string }) {
  return requestJson<{ token: string; user: AuthUser }>(
    '/api/auth/resident/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function setupInitialStaff(payload: {
  fullName: string;
  officialTitle: string;
  email: string;
  password: string;
}) {
  return requestJson<{ token: string; user: AuthUser }>(
    '/api/auth/staff/setup',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function loginStaff(payload: { email: string; password: string }) {
  return requestJson<{ token: string; user: AuthUser }>(
    '/api/auth/staff/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function trackSubmissionByReference(
  referenceNumber: string,
  token?: string | null,
) {
  return requestJson<{ submission: PortalSubmission }>(
    `/api/submissions/track/${encodeURIComponent(referenceNumber.trim())}`,
    {},
    token,
  );
}

export function fetchMySubmissions(token: string) {
  return requestJson<{ submissions: PortalSubmission[] }>(
    '/api/submissions/mine',
    {},
    token,
  );
}

export function createIssueSubmission(
  payload: {
    title: string;
    category: IssueCategory;
    purok: string;
    location: string;
    description: string;
    urgency: UrgencyLevel;
    photoDataUrl?: string;
    photoName?: string;
  },
  token: string,
) {
  return requestJson<{ submission: PortalSubmission }>(
    '/api/submissions',
    {
      method: 'POST',
      body: JSON.stringify({ kind: 'issue', ...payload }),
    },
    token,
  );
}

export function createServiceSubmission(
  payload: {
    serviceType: ServiceType;
    purok: string;
    location: string;
    purpose: string;
    preferredPickupDate: string;
    notes: string;
  },
  token: string,
) {
  return requestJson<{ submission: PortalSubmission }>(
    '/api/submissions',
    {
      method: 'POST',
      body: JSON.stringify({ kind: 'service', ...payload }),
    },
    token,
  );
}

export function fetchStaffSubmissions(token: string) {
  return requestJson<{ submissions: PortalSubmission[] }>(
    '/api/staff/submissions',
    {},
    token,
  );
}

export function updateSubmissionStatusApi(
  submissionId: string,
  payload: {
    status: SubmissionStatus;
    remarkNote: string;
    photoDataUrl?: string;
    photoName?: string;
  },
  token: string,
) {
  return requestJson<{ submission: PortalSubmission }>(
    `/api/staff/submissions/${encodeURIComponent(submissionId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function fetchStaffSummary(token: string) {
  return requestJson<{ stats: SummaryStats; submissions: PortalSubmission[] }>(
    '/api/staff/summary',
    {},
    token,
  );
}

export function fetchStaffDirectory(token: string) {
  return requestJson<{ staffUsers: AuthUser[] }>(
    '/api/staff/users',
    {},
    token,
  );
}

export function createStaffOfficialApi(
  payload: {
    fullName: string;
    officialTitle: string;
    email: string;
    password: string;
  },
  token: string,
) {
  return requestJson<{ staffUser: AuthUser }>(
    '/api/staff/users',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function resetSampleSubmissionsApi(token: string) {
  return requestJson<{ submissions: PortalSubmission[] }>(
    '/api/staff/reset-sample',
    { method: 'POST' },
    token,
  );
}
