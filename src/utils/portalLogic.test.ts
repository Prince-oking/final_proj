import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStaffStatusUpdate,
  computeSummaryStats,
  filterSubmissions,
  findSubmissionByReference,
  generateReferenceNumber,
  generateSummaryCsv,
  validateIssueReport,
  validateResidentRegistration,
  validateServiceRequest,
} from './portalLogic';
import type { PortalSubmission, StaffOfficial } from '../types/portal';

const sampleOfficial: StaffOfficial = {
  id: 'off-1',
  name: 'Sec. Elena Villanueva',
  role: 'Barangay Secretary',
};

const sampleSubmissions: PortalSubmission[] = [
  {
    id: 'sub-1',
    referenceNumber: 'BRG-2026-0101',
    kind: 'issue',
    title: 'Broken streetlight near Purok 2 chapel',
    category: 'Broken Streetlight',
    purok: 'Purok 2 - Mabini',
    location: 'Mabini St. corner Sampaguita Alley',
    description: 'Lamp housing is detached and dark at night.',
    urgency: 'High',
    residentId: 'res-1',
    residentName: 'Maria Santos',
    residentContact: '0917-555-0102',
    status: 'Received',
    createdAt: '2026-11-18T08:30:00.000Z',
    updatedAt: '2026-11-18T08:30:00.000Z',
    remarks: [
      {
        id: 'rem-1',
        timestamp: '2026-11-18T08:30:00.000Z',
        status: 'Received',
        authorName: 'Portal System',
        authorRole: 'Automated Intake',
        note: 'Report logged in barangay queue.',
      },
    ],
  },
  {
    id: 'sub-2',
    referenceNumber: 'REQ-2026-0104',
    kind: 'service',
    title: 'Barangay Clearance — Local Employment',
    category: 'Barangay Clearance',
    purok: 'Purok 1 - Centro',
    location: '14 Rizal Ave., Purok 1',
    description: 'Clearance request for factory employment.',
    purpose: 'Employment',
    preferredPickupDate: '2026-11-24',
    residentId: 'res-2',
    residentName: 'Juan Dela Cruz',
    residentContact: '0918-555-0148',
    status: 'Resolved',
    createdAt: '2026-11-17T09:15:00.000Z',
    updatedAt: '2026-11-19T14:00:00.000Z',
    remarks: [
      {
        id: 'rem-2',
        timestamp: '2026-11-19T14:00:00.000Z',
        status: 'Resolved',
        authorName: 'Sec. Elena Villanueva',
        authorRole: 'Barangay Secretary',
        note: 'Printed and ready for pickup at Window 1.',
      },
    ],
  },
];

test('generateReferenceNumber increments per prefix and year cleanly', () => {
  assert.equal(generateReferenceNumber('issue', sampleSubmissions, 2026), 'BRG-2026-0102');
  assert.equal(generateReferenceNumber('service', sampleSubmissions, 2026), 'REQ-2026-0105');
  assert.equal(generateReferenceNumber('issue', [], 2026), 'BRG-2026-0101');
});

test('validateIssueReport rejects empty fields and accepts valid input', () => {
  const invalid = validateIssueReport({
    title: '',
    category: '',
    purok: '',
    location: '12',
    description: 'short',
    urgency: 'Medium',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.category);
  assert.ok(invalid.errors.purok);
  assert.ok(invalid.errors.location);
  assert.ok(invalid.errors.description);

  const valid = validateIssueReport({
    title: 'Clogged canal on Rizal St.',
    category: 'Clogged Drainage',
    purok: 'Purok 4 - Rizal',
    location: 'Rizal St. in front of San Miguel Elementary School',
    description: 'Storm drain grate is blocked with debris causing water buildup.',
    urgency: 'High',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('validateServiceRequest and validateResidentRegistration enforce required fields', () => {
  const invalidService = validateServiceRequest({
    serviceType: '',
    purok: '',
    location: '',
    purpose: '',
    preferredPickupDate: '',
    notes: '',
  });
  assert.equal(invalidService.valid, false);
  assert.ok(invalidService.errors.serviceType);
  assert.ok(invalidService.errors.preferredPickupDate);

  const invalidRes = validateResidentRegistration({
    fullName: 'Al',
    purok: '',
    address: '1',
    phone: '123',
    email: 'not-an-email',
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.fullName);
  assert.ok(invalidRes.errors.email);
});

test('filterSubmissions and findSubmissionByReference filter accurately', () => {
  const onlyIssues = filterSubmissions(sampleSubmissions, {
    query: '',
    kind: 'issue',
    status: 'all',
    category: 'all',
  });
  assert.equal(onlyIssues.length, 1);
  assert.equal(onlyIssues[0].referenceNumber, 'BRG-2026-0101');

  const searchHit = filterSubmissions(sampleSubmissions, {
    query: 'delacruz',
    kind: 'all',
    status: 'all',
    category: 'all',
  });
  assert.equal(searchHit.length, 0);

  const searchName = filterSubmissions(sampleSubmissions, {
    query: 'mabini',
    kind: 'all',
    status: 'all',
    category: 'all',
  });
  assert.equal(searchName.length, 1);

  const exactRef = findSubmissionByReference(sampleSubmissions, ' req-2026-0104 ');
  assert.equal(exactRef?.id, 'sub-2');
});

test('applyStaffStatusUpdate appends remark and updates status immutably', () => {
  const updated = applyStaffStatusUpdate(
    sampleSubmissions,
    'sub-1',
    'In Progress',
    'Assigned electrician for pole inspection.',
    sampleOfficial,
    '2026-11-20T10:00:00.000Z',
  );

  assert.equal(sampleSubmissions[0].status, 'Received');
  assert.equal(updated[0].status, 'In Progress');
  assert.equal(updated[0].remarks.length, 2);
  assert.equal(updated[0].remarks[1].authorName, 'Sec. Elena Villanueva');
  assert.equal(updated[0].remarks[1].note, 'Assigned electrician for pole inspection.');
});

test('computeSummaryStats and generateSummaryCsv aggregate counts accurately', () => {
  const stats = computeSummaryStats(sampleSubmissions);
  assert.equal(stats.total, 2);
  assert.equal(stats.issueCount, 1);
  assert.equal(stats.serviceCount, 1);
  assert.equal(stats.byStatus.Received, 1);
  assert.equal(stats.byStatus.Resolved, 1);
  assert.equal(stats.resolutionRatePercent, 50);
  assert.equal(stats.byCategory.length, 2);

  const csv = generateSummaryCsv(sampleSubmissions);
  assert.ok(csv.includes('BRG-2026-0101'));
  assert.ok(csv.includes('REQ-2026-0104'));
  assert.ok(csv.includes('Reference Number,Type,Category / Service'));
});
