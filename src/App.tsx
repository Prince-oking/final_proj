import { useCallback, useEffect, useState } from 'react';
import type {
  AuthUser,
  PortalSubmission,
  PortalView,
  SubmissionKind,
  SummaryStats,
} from './types/portal';
import { fetchPortalOverview } from './services/api';
import { HeaderNav } from './components/HeaderNav';
import { PortalHomeView } from './components/PortalHomeView';
import { SubmitView } from './components/SubmitView';
import { TrackView } from './components/TrackView';
import { ResidentAuthView } from './components/ResidentAuthView';
import { StaffAuthView } from './components/StaffAuthView';
import { StaffDashboardView } from './components/StaffDashboardView';
import { SummaryView } from './components/SummaryView';
import { DocumentationView } from './components/DocumentationView';
import { SiteFooter } from './components/SiteFooter';
import { useMotionObserver } from './utils/useMotionObserver';

const EMPTY_STATS: SummaryStats = {
  total: 0,
  issueCount: 0,
  serviceCount: 0,
  byStatus: { Received: 0, 'In Progress': 0, Resolved: 0 },
  resolutionRatePercent: 0,
  byCategory: [],
  byPurok: [],
};

export default function App() {
  const [activeView, setActiveView] = useState<PortalView>('portal');
  const [submitKind, setSubmitKind] = useState<SubmissionKind>('issue');
  const [trackRefTarget, setTrackRefTarget] = useState<string>('');

  // Session Bearer token held strictly in React state (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [recentSubmissions, setRecentSubmissions] = useState<PortalSubmission[]>(
    [],
  );
  const [overviewStats, setOverviewStats] = useState<SummaryStats>(EMPTY_STATS);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('barangay-theme', theme);
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useMotionObserver(activeView);

  const loadOverview = useCallback(async () => {
    try {
      const data = await fetchPortalOverview();
      setRecentSubmissions(data.recent);
      setOverviewStats(data.stats);
    } catch {
      // Handled gracefully with empty fallback state
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const navigateTo = (view: PortalView) => {
    setActiveView(view);
    window.scrollTo(0, 0);
  };

  const handleAuthenticated = (token: string, user: AuthUser) => {
    setAuthToken(token);
    setAuthUser(user);
    if (
      user.role === 'staff' &&
      (activeView === 'resident' || activeView === 'portal')
    ) {
      navigateTo('staff');
    } else if (user.role === 'resident' && activeView === 'staff') {
      navigateTo('resident');
    }
  };

  const handleSignOut = (redirectView?: PortalView) => {
    setAuthToken(null);
    setAuthUser(null);
    if (typeof redirectView === 'string') {
      navigateTo(redirectView);
    } else if (activeView === 'staff' || activeView === 'summary') {
      navigateTo('portal');
    }
  };

  const handleStartSubmission = (kind: SubmissionKind) => {
    setSubmitKind(kind);
    navigateTo('submit');
  };

  const handleTrackReference = (referenceNumber: string) => {
    setTrackRefTarget(referenceNumber);
    navigateTo('track');
  };

  const quickReferences = recentSubmissions.map((s) => s.referenceNumber);
  const isStaff = authUser?.role === 'staff' && Boolean(authToken);

  return (
    <div className="min-h-screen flex flex-col editorial-paper text-[#1F241D] dark:text-[#F2F0EA]">
      <HeaderNav
        activeView={activeView}
        authUser={authUser}
        onNavigate={navigateTo}
        onStartReport={() => handleStartSubmission('issue')}
        onSignOut={() => handleSignOut()}
      />

      {activeView === 'portal' ? (
        <main key={activeView} className="flex-1 w-full view-enter">
          <PortalHomeView
            authUser={authUser}
            recentSubmissions={recentSubmissions}
            stats={overviewStats}
            onStartSubmission={handleStartSubmission}
            onTrackReference={handleTrackReference}
            onNavigate={navigateTo}
            onSignOut={() => handleSignOut()}
          />
        </main>
      ) : (
        <main key={activeView} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-20 md:pb-14 view-enter">
          {activeView === 'submit' && (
            <SubmitView
              key={`${submitKind}-${authUser?.id || 'anon'}`}
              initialKind={submitKind}
              authUser={authUser}
              token={authToken}
              onAuthenticated={handleAuthenticated}
              onSignOut={() => handleSignOut()}
              onSubmissionCreated={() => void loadOverview()}
              onTrackReference={handleTrackReference}
              onGoToStaffLogin={() => navigateTo('staff')}
            />
          )}

          {activeView === 'track' && (
            <TrackView
              token={authToken}
              quickReferences={quickReferences}
              initialReference={trackRefTarget}
            />
          )}

          {activeView === 'resident' && (
            <ResidentAuthView
              authUser={authUser}
              token={authToken}
              onAuthenticated={handleAuthenticated}
              onSignOut={() => handleSignOut('resident')}
              onStartSubmission={handleStartSubmission}
              onTrackReference={handleTrackReference}
              onGoToStaffLogin={() => navigateTo('staff')}
            />
          )}

          {activeView === 'staff' &&
            (isStaff && authUser && authToken ? (
              <StaffDashboardView
                authUser={authUser}
                token={authToken}
                onOpenSummary={() => navigateTo('summary')}
                onSubmissionsChanged={() => void loadOverview()}
              />
            ) : (
              <StaffAuthView
                authUser={authUser}
                onAuthenticated={handleAuthenticated}
                onSignOut={() => handleSignOut('staff')}
                onGoToResidentLogin={() => navigateTo('resident')}
              />
            ))}

          {activeView === 'summary' &&
            (isStaff && authUser && authToken ? (
              <SummaryView
                authUser={authUser}
                token={authToken}
                onOpenStaffDesk={() => navigateTo('staff')}
              />
            ) : (
              <StaffAuthView
                authUser={authUser}
                onAuthenticated={handleAuthenticated}
                onSignOut={() => handleSignOut('staff')}
                onGoToResidentLogin={() => navigateTo('resident')}
              />
            ))}

          {activeView === 'manual' && (
            <DocumentationView onNavigate={navigateTo} />
          )}
        </main>
      )}

      <SiteFooter
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={navigateTo}
        onStartSubmission={handleStartSubmission}
      />
    </div>
  );
}
