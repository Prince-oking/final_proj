import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  PlusSquare,
  SearchCheck,
} from 'lucide-react';
import type { PortalView } from '../types/portal';

interface HeaderNavProps {
  activeView: PortalView;
  onNavigate: (view: PortalView) => void;
  onStartReport: () => void;
}

const DESKTOP_LINKS: Array<{ view: PortalView; label: string }> = [
  { view: 'portal', label: 'Portal' },
  { view: 'track', label: 'Track' },
  { view: 'staff', label: 'Staff Desk' },
  { view: 'summary', label: 'Summary' },
  { view: 'manual', label: 'Manual' },
];

const MOBILE_TABS: Array<{
  view: PortalView;
  label: string;
  Icon: typeof Home;
}> = [
  { view: 'portal', label: 'Portal', Icon: Home },
  { view: 'submit', label: 'Submit', Icon: PlusSquare },
  { view: 'track', label: 'Track', Icon: SearchCheck },
  { view: 'staff', label: 'Staff', Icon: ClipboardList },
  { view: 'summary', label: 'Summary', Icon: BarChart3 },
];

export function HeaderNav({
  activeView,
  onNavigate,
  onStartReport,
}: HeaderNavProps) {
  return (
    <>
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('portal')}
            className="text-left text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Barangay San Miguel
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6"
          >
            {DESKTOP_LINKS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
                    isActive
                      ? 'text-blue-800 border-blue-800'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('manual')}
              aria-label="Open User Manual"
              className={`md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                activeView === 'manual' ? 'text-blue-800 bg-blue-50' : ''
              }`}
            >
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onStartReport}
              className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              File Report
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile bottom navigation"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200"
      >
        <div className="grid grid-cols-5 h-14">
          {MOBILE_TABS.map(({ view, label, Icon }) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-blue-800 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="mt-0.5 leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
