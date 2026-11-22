import { useEffect, useMemo, useState } from 'react';
import type {
  IssueCategory,
  PortalSubmission,
  PortalView,
  ResidentAccount,
  ServiceType,
  SubmissionKind,
  SubmissionStatus,
  UrgencyLevel,
} from './types/portal';
import {
  SAMPLE_RESIDENTS,
  SEED_SUBMISSIONS,
  STAFF_OFFICIALS,
} from './data/seedData';
import {
  applyStaffStatusUpdate,
  computeSummaryStats,
  generateReferenceNumber,
} from './utils/portalLogic';
import { HeaderNav } from './components/HeaderNav';
import { PortalHomeView } from './components/PortalHomeView';
import { SubmitView } from './components/SubmitView';
import { TrackView } from './components/TrackView';
import { StaffDashboardView } from './components/StaffDashboardView';
import { SummaryView } from './components/SummaryView';
import { DocumentationView } from './components/DocumentationView';
import { ResidentAccountModal } from './components/ResidentAccountModal';

const STORAGE_KEYS = {
  submissions: 'bsm_portal_submissions_v1',
  residents: 'bsm_portal_residents_v1',
  activeResidentId: 'bsm_portal_active_resident_v1',
};

function loadInitialSubmissions(): PortalSubmission[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.submissions);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed local storage
  }
  return SEED_SUBMISSIONS;
}

function loadInitialResidents(): ResidentAccount[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.residents);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed local storage
  }
  return SAMPLE_RESIDENTS;
}

export default function App() {
  const [activeView, setActiveView] = useState<PortalView>('portal');
  const [submitKind, setSubmitKind] = useState<SubmissionKind>('issue');
  const [trackRefTarget, setTrackRefTarget] = useState<string>('');

  const [submissions, setSubmissions] = useState<PortalSubmission[]>(
    loadInitialSubmissions,
  );
  const [residents, setResidents] = useState<ResidentAccount[]>(
    loadInitialResidents,
  );
  const [activeResidentId, setActiveResidentId] = useState<string>(() => {
    try {
      return (
        window.localStorage.getItem(STORAGE_KEYS.activeResidentId) ||
        SAMPLE_RESIDENTS[0].id
      );
    } catch {
      return SAMPLE_RESIDENTS[0].id;
    }
  });

  const [activeOfficialId, setActiveOfficialId] = useState<string>(
    STAFF_OFFICIALS[0].id,
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.submissions,
        JSON.stringify(submissions),
      );
    } catch {
      // Ignore quota errors on large attachments
    }
  }, [submissions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.residents,
        JSON.stringify(residents),
      );
    } catch {
      // Ignore storage errors
    }
  }, [residents]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.activeResidentId,
        activeResidentId,
      );
    } catch {
      // Ignore storage errors
    }
  }, [activeResidentId]);

  const activeResident =
    residents.find((r) => r.id === activeResidentId) || residents[0];
  const activeOfficial =
    STAFF_OFFICIALS.find((o) => o.id === activeOfficialId) || STAFF_OFFICIALS[0];

  const stats = useMemo(
    () => computeSummaryStats(submissions),
    [submissions],
  );

  const navigateTo = (view: PortalView) => {
    setActiveView(view);
    window.scrollTo(0, 0);
  };

  const handleStartSubmission = (kind: SubmissionKind) => {
    setSubmitKind(kind);
    navigateTo('submit');
  };

  const handleTrackReference = (referenceNumber: string) => {
    setTrackRefTarget(referenceNumber);
    navigateTo('track');
  };

  const handleCreateIssue = (payload: {
    title: string;
    category: IssueCategory;
    purok: string;
    location: string;
    description: string;
    urgency: UrgencyLevel;
    photoDataUrl?: string;
    photoName?: string;
  }): PortalSubmission => {
    const now = new Date().toISOString();
    const referenceNumber = generateReferenceNumber('issue', submissions, 2026);
    const created: PortalSubmission = {
      id: `sub-${Date.now()}`,
      referenceNumber,
      kind: 'issue',
      title: payload.title,
      category: payload.category,
      purok: payload.purok,
      location: payload.location,
      description: payload.description,
      urgency: payload.urgency,
      photoDataUrl: payload.photoDataUrl,
      photoName: payload.photoName,
      residentId: activeResident.id,
      residentName: activeResident.fullName,
      residentContact: activeResident.phone,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      remarks: [
        {
          id: `rem-${Date.now()}`,
          timestamp: now,
          status: 'Received',
          authorName: 'Portal Intake',
          authorRole: 'Barangay Desk',
          note: payload.photoDataUrl
            ? 'Issue report received with attached photo evidence and queued for barangay review.'
            : 'Issue report received and queued for barangay review.',
        },
      ],
    };

    setSubmissions((prev) => [created, ...prev]);
    return created;
  };

  const handleCreateService = (payload: {
    serviceType: ServiceType;
    purok: string;
    location: string;
    purpose: string;
    preferredPickupDate: string;
    notes: string;
  }): PortalSubmission => {
    const now = new Date().toISOString();
    const referenceNumber = generateReferenceNumber('service', submissions, 2026);
    const created: PortalSubmission = {
      id: `sub-${Date.now()}`,
      referenceNumber,
      kind: 'service',
      title: `${payload.serviceType} — ${payload.purpose}`,
      category: payload.serviceType,
      purok: payload.purok,
      location: payload.location,
      description:
        payload.notes ||
        `Pickup request for ${payload.serviceType} (${payload.purpose}).`,
      purpose: payload.purpose,
      preferredPickupDate: payload.preferredPickupDate,
      residentId: activeResident.id,
      residentName: activeResident.fullName,
      residentContact: activeResident.phone,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      remarks: [
        {
          id: `rem-${Date.now()}`,
          timestamp: now,
          status: 'Received',
          authorName: 'Portal Intake',
          authorRole: 'Barangay Desk',
          note: 'Service request logged for Barangay Secretary verification.',
        },
      ],
    };

    setSubmissions((prev) => [created, ...prev]);
    return created;
  };

  const handleStaffUpdate = (
    submissionId: string,
    nextStatus: SubmissionStatus,
    remarkNote: string,
  ) => {
    setSubmissions((prev) =>
      applyStaffStatusUpdate(
        prev,
        submissionId,
        nextStatus,
        remarkNote,
        activeOfficial,
      ),
    );
  };

  const handleCreateResident = (newResident: ResidentAccount) => {
    setResidents((prev) => [newResident, ...prev]);
    setActiveResidentId(newResident.id);
  };

  const handleResetDemoData = () => {
    setSubmissions(SEED_SUBMISSIONS);
    setResidents(SAMPLE_RESIDENTS);
    setActiveResidentId(SAMPLE_RESIDENTS[0].id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900">
      <HeaderNav
        activeView={activeView}
        onNavigate={navigateTo}
        onStartReport={() => handleStartSubmission('issue')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {activeView === 'portal' && (
          <PortalHomeView
            activeResident={activeResident}
            submissions={submissions}
            stats={stats}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
            onStartSubmission={handleStartSubmission}
            onTrackReference={handleTrackReference}
            onNavigate={navigateTo}
          />
        )}

        {activeView === 'submit' && (
          <SubmitView
            key={submitKind}
            initialKind={submitKind}
            activeResident={activeResident}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
            onSubmitIssue={handleCreateIssue}
            onSubmitService={handleCreateService}
            onTrackReference={handleTrackReference}
          />
        )}

        {activeView === 'track' && (
          <TrackView
            submissions={submissions}
            activeResident={activeResident}
            initialReference={trackRefTarget}
          />
        )}

        {activeView === 'staff' && (
          <StaffDashboardView
            submissions={submissions}
            officials={STAFF_OFFICIALS}
            activeOfficialId={activeOfficial.id}
            onSelectOfficial={setActiveOfficialId}
            onUpdateSubmission={handleStaffUpdate}
            onResetDemoData={handleResetDemoData}
          />
        )}

        {activeView === 'summary' && (
          <SummaryView submissions={submissions} stats={stats} />
        )}

        {activeView === 'manual' && (
          <DocumentationView onNavigate={navigateTo} />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Barangay San Miguel Report &amp; Request Portal · Community Services Desk
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('manual')}
              className="hover:text-slate-900 underline underline-offset-2"
            >
              User Manual &amp; Scope
            </button>
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="hover:text-slate-900 underline underline-offset-2"
            >
              Switch Resident ({activeResident.fullName})
            </button>
          </div>
        </div>
      </footer>

      <ResidentAccountModal
        isOpen={isAccountModalOpen}
        residents={residents}
        activeResidentId={activeResident.id}
        onSelectResident={setActiveResidentId}
        onCreateResident={handleCreateResident}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
}
