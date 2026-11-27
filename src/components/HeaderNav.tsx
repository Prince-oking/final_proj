import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  PlusSquare,
  SearchCheck,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { AuthUser, PortalView } from '../types/portal';

interface HeaderNavProps {
  activeView: PortalView;
  authUser: AuthUser | null;
  onNavigate: (view: PortalView) => void;
  onStartReport: () => void;
  onSignOut: () => void;
}

function CivicSunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={className}
      fill="none"
    >
      <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, idx) => {
        const angle = (idx * 360) / 12;
        return (
          <line
            key={idx}
            x1="20"
            y1="3"
            x2="20"
            y2="9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 20 20)`}
          />
        );
      })}
    </svg>
  );
}

export function HeaderNav({
  activeView,
  authUser,
  onNavigate,
  onStartReport,
  onSignOut,
}: HeaderNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const isStaff = authUser?.role === 'staff';
  const isPortalHome = activeView === 'portal';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 56);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeView]);

  const desktopLinks: Array<{ view: PortalView; label: string }> = isStaff
    ? [
        { view: 'portal', label: 'Portal' },
        { view: 'staff', label: 'Staff Desk' },
        { view: 'summary', label: 'Summary' },
        { view: 'track', label: 'Track' },
        { view: 'manual', label: 'Manual' },
      ]
    : [
        { view: 'portal', label: 'Portal' },
        { view: 'track', label: 'Track' },
        { view: 'resident', label: authUser ? 'My Account' : 'Resident Login' },
        { view: 'staff', label: 'Staff Login' },
        { view: 'manual', label: 'Manual' },
      ];

  const mobileTabs: Array<{
    view: PortalView;
    label: string;
    Icon: typeof Home;
  }> = isStaff
    ? [
        { view: 'portal', label: 'Portal', Icon: Home },
        { view: 'staff', label: 'Staff Desk', Icon: ClipboardList },
        { view: 'summary', label: 'Summary', Icon: BarChart3 },
        { view: 'track', label: 'Track', Icon: SearchCheck },
        { view: 'manual', label: 'Manual', Icon: BookOpen },
      ]
    : [
        { view: 'portal', label: 'Portal', Icon: Home },
        { view: 'submit', label: 'Submit', Icon: PlusSquare },
        { view: 'track', label: 'Track', Icon: SearchCheck },
        { view: 'resident', label: 'Resident', Icon: User },
        { view: 'staff', label: 'Staff', Icon: ShieldCheck },
      ];

  return (
    <>
      {/* Mobile Compact Sticky Top Bar */}
      <header className="no-print md:hidden sticky top-0 z-30 bg-[#F5F3EE]/95 dark:bg-[#141814]/95 backdrop-blur-md border-b border-[#1F241D]/10 dark:border-white/10">
        <div className="px-4 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('portal')}
            className="inline-flex items-center gap-2 font-display text-left text-base font-extrabold tracking-tight text-[#1F241D] dark:text-[#F2F0EA] whitespace-nowrap shrink-0"
          >
            <CivicSunIcon className="w-5 h-5 text-[#8D1B22] dark:text-[#E5989B] shrink-0" />
            <span>Barangay San Miguel</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {!isStaff && (
              <button
                type="button"
                onClick={() => onNavigate('manual')}
                aria-label="Open User Manual"
                className={`editorial-btn min-h-[40px] min-w-[40px] inline-flex items-center justify-center border border-[#1F241D]/15 dark:border-white/15 ${
                  activeView === 'manual'
                    ? 'bg-[#1F241D] text-[#F5F3EE] dark:bg-[#F2F0EA] dark:text-[#141814]'
                    : 'bg-white text-[#1F241D] hover:bg-[#ECE9E2] dark:bg-[#1C221B] dark:text-[#F2F0EA] dark:hover:bg-[#252C24]'
                }`}
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {isStaff ? (
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#1E241E] hover:bg-[#2B332B] whitespace-nowrap shrink-0"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartReport}
                className="min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#8D1B22] hover:bg-[#701319] whitespace-nowrap shrink-0"
              >
                File Report
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Floating Island Header:
          - On Portal Home: smoothly appears as a floating island when scrolling past the top notch
          - On Inner Views: always anchored as a crisp sticky floating island */}
      <header
        aria-hidden={isPortalHome && !scrolled ? true : undefined}
        className={`no-print hidden md:flex items-center justify-between gap-8 z-40 px-5 lg:px-6 h-13 rounded-full border transition-all duration-200 motion-island ${
          isPortalHome
            ? `fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl bg-[#F5F3EE]/95 dark:bg-[#1C221B]/95 backdrop-blur-md border-[#1F241D]/15 dark:border-white/15 shadow-lg ${
                scrolled
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-4 pointer-events-none'
              }`
            : 'sticky top-3 mx-auto mt-3 w-[calc(100%-3rem)] max-w-6xl bg-white/92 dark:bg-[#1C221B]/95 backdrop-blur-md border-[#1F241D]/12 dark:border-white/15 shadow-sm'
        }`}
      >
        <button
          type="button"
          onClick={() => onNavigate('portal')}
          tabIndex={isPortalHome && !scrolled ? -1 : 0}
          className="inline-flex items-center gap-2.5 font-display text-left text-base font-extrabold tracking-tight text-[#1F241D] dark:text-[#F2F0EA] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8D1B22]"
        >
          <CivicSunIcon className="w-5 h-5 text-[#8D1B22] dark:text-[#E5989B] shrink-0" />
          <span>Barangay San Miguel</span>
        </button>

        <nav
          aria-label="Floating navigation"
          className="flex items-center gap-5 lg:gap-7 text-[11px] font-bold uppercase tracking-[0.08em]"
        >
          {desktopLinks.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                tabIndex={isPortalHome && !scrolled ? -1 : 0}
                onClick={() => onNavigate(item.view)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors nav-link-slide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D1B22] ${
                  isActive
                    ? 'text-[#8D1B22] dark:text-[#E5989B] underline decoration-2 underline-offset-4'
                    : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {isStaff ? (
            <button
              type="button"
              tabIndex={isPortalHome && !scrolled ? -1 : 0}
              onClick={onSignOut}
              className="min-h-[36px] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-[#1E241E] hover:bg-[#2B332B] transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              tabIndex={isPortalHome && !scrolled ? -1 : 0}
              onClick={onStartReport}
              className="min-h-[36px] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F241D]"
            >
              File Report
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#F5F3EE] dark:bg-[#181D17] border-t border-[#1F241D]/15 dark:border-white/12"
      >
        <div className="grid grid-cols-5 h-14">
          {mobileTabs.map(({ view, label, Icon }) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold whitespace-nowrap border-r last:border-r-0 border-[#1F241D]/10 dark:border-white/10 transition-colors ${
                  isActive
                    ? 'bg-[#1E241E] text-[#F5F3EE] dark:bg-[#8D1B22] dark:text-white'
                    : 'text-[#565A51] hover:text-[#1F241D] dark:text-[#B4B9AE] dark:hover:text-[#F2F0EA]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="mt-0.5 leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
