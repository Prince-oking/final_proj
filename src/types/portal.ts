export type PortalView =
  | 'portal'
  | 'submit'
  | 'track'
  | 'resident'
  | 'staff'
  | 'summary'
  | 'manual';

export type AuthRole = 'resident' | 'staff';

export type SubmissionKind = 'issue' | 'service';

export type SubmissionStatus = 'Received' | 'In Progress' | 'Resolved';

export type UrgencyLevel = 'Low' | 'Medium' | 'High';

export type IssueCategory =
  | 'Broken Streetlight'
  | 'Uncollected Garbage'
  | 'Clogged Drainage'
  | 'Flooding'
  | 'Road Damage'
  | 'Public Sanitation'
  | 'Noise / Disturbance'
  | 'Other';

export type ServiceType =
  | 'Barangay Clearance'
  | 'Certificate of Residency'
  | 'Certificate of Indigency'
  | 'Business Clearance Endorsement'
  | 'Good Moral Certificate';

export interface AuthUser {
  id: string;
  role: AuthRole;
  fullName: string;
  email: string;
  purok: string;
  address: string;
  phone: string;
  officialTitle: string;
}

export interface ResidentAccount {
  id: string;
  fullName: string;
  purok: string;
  address: string;
  phone: string;
  email: string;
}

export interface StaffOfficial {
  id: string;
  name: string;
  role: string;
}

export interface RemarkEntry {
  id: string;
  timestamp: string;
  status: SubmissionStatus;
  authorName: string;
  authorRole: string;
  note: string;
}

export interface PortalSubmission {
  id: string;
  referenceNumber: string;
  kind: SubmissionKind;
  title: string;
  category: IssueCategory | ServiceType;
  purok: string;
  location: string;
  description: string;
  urgency?: UrgencyLevel;
  photoDataUrl?: string;
  photoName?: string;
  purpose?: string;
  preferredPickupDate?: string;
  residentId: string;
  residentName: string;
  residentContact: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  remarks: RemarkEntry[];
}

export interface SubmissionFilters {
  query: string;
  kind: 'all' | SubmissionKind;
  status: 'all' | SubmissionStatus;
  category: string;
}

export interface IssueFormInput {
  title: string;
  category: IssueCategory | '';
  purok: string;
  location: string;
  description: string;
  urgency: UrgencyLevel;
  photoDataUrl?: string;
  photoName?: string;
}

export interface ServiceFormInput {
  serviceType: ServiceType | '';
  purok: string;
  location: string;
  purpose: string;
  preferredPickupDate: string;
  notes: string;
}

export interface ResidentFormInput {
  fullName: string;
  purok: string;
  address: string;
  phone: string;
  email: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface SummaryStats {
  total: number;
  issueCount: number;
  serviceCount: number;
  byStatus: Record<SubmissionStatus, number>;
  resolutionRatePercent: number;
  byCategory: Array<{ category: string; count: number; kind: SubmissionKind }>;
  byPurok: Array<{ purok: string; count: number; openCount: number }>;
}
