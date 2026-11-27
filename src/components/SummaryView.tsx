import { useEffect, useState } from 'react';
import { ClipboardList, Download, Printer } from 'lucide-react';
import type { AuthUser, PortalSubmission, SummaryStats } from '../types/portal';
import { generateSummaryCsv } from '../utils/portalLogic';
import { fetchStaffSummary } from '../services/api';

interface SummaryViewProps {
  authUser: AuthUser;
  token: string;
  onOpenStaffDesk: () => void;
}

export function SummaryView({
  authUser,
  token,
  onOpenStaffDesk,
}: SummaryViewProps) {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [submissions, setSubmissions] = useState<PortalSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg('');
    fetchStaffSummary(token)
      .then((res) => {
        if (!cancelled) {
          setStats(res.stats);
          setSubmissions(res.submissions);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to load summary report.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-12 text-center text-sm font-medium text-[#565A51] dark:text-[#B4B9AE]">
        Loading barangay summary report...
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-8 text-center space-y-3">
        <p className="text-sm font-bold text-[#8D1B22] dark:text-[#E5989B]">
          {errorMsg || 'Summary data unavailable.'}
        </p>
      </div>
    );
  }

  const maxCategoryCount = Math.max(
    1,
    ...stats.byCategory.map((c) => c.count),
  );

  const handleExportCsv = () => {
    const csv = generateSummaryCsv(submissions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barangay-san-miguel-summary-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusRows = [
    {
      label: 'Received',
      count: stats.byStatus.Received,
      barColor: 'bg-[#8D1B22]',
      textColor: 'text-[#E5989B]',
      desc: 'Newly filed and awaiting assignment',
    },
    {
      label: 'In Progress',
      count: stats.byStatus['In Progress'],
      barColor: 'bg-amber-400',
      textColor: 'text-amber-300',
      desc: 'Currently being acted on by barangay staff',
    },
    {
      label: 'Resolved',
      count: stats.byStatus.Resolved,
      barColor: 'bg-emerald-400',
      textColor: 'text-emerald-300',
      desc: 'Completed issue or document ready/released',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#1F241D]/12 dark:border-white/12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8D1B22] dark:text-[#E5989B] mb-1">
            Barangay Staff Decision Support · {authUser.fullName}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight">
            Barangay Summary Report
          </h1>
          <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] mt-1">
            Aggregated counts by category, status, and purok to prioritize field action.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenStaffDesk}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-[#1F241D] dark:text-[#F2F0EA] border border-[#1F241D]/15 dark:border-white/15 bg-white dark:bg-[#1C221B] hover:bg-[#ECE9E2] dark:hover:bg-[#252C24] transition-colors whitespace-nowrap"
          >
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            <span>Back to Staff Desk</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] dark:bg-[#252C24] hover:bg-[#2B332B] dark:hover:bg-[#2F372E] dark:border dark:border-white/15 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Warm Stone 4-Metric KPI Strip */}
      <div className="bg-[#ECE9E2] dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl overflow-hidden reveal">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1F241D]/10 dark:divide-white/10">
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">Total Logged</p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] mt-2 tabular-nums leading-none">
              {stats.total}
            </p>
            <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">All reports &amp; requests</p>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">Issue Reports</p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] mt-2 tabular-nums leading-none">
              {stats.issueCount}
            </p>
            <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">Community maintenance</p>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">Service Requests</p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] mt-2 tabular-nums leading-none">
              {stats.serviceCount}
            </p>
            <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">Document pickup queue</p>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold text-[#565A51] dark:text-[#B4B9AE]">Resolution Rate</p>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-2 tabular-nums leading-none">
              {stats.resolutionRatePercent}%
            </p>
            <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-2">
              {stats.byStatus.Resolved} of {stats.total} resolved
            </p>
          </div>
        </div>
      </div>

      {/* Asymmetric Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-7 space-y-5 reveal reveal-delay-1 hover-lift">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
              Submissions by Category
            </h2>
            <p className="text-xs text-[#565A51] dark:text-[#B4B9AE] mt-0.5">
              Sorted by volume to highlight recurring barangay needs.
            </p>
          </div>

          <div className="space-y-4">
            {stats.byCategory.map((row) => {
              const widthPct = Math.round((row.count / maxCategoryCount) * 100);
              return (
                <div key={row.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#1F241D] dark:text-[#F2F0EA] truncate">
                        {row.category}
                      </span>
                      <span className="text-xs text-[#565A51] dark:text-[#B4B9AE] shrink-0">
                        · {row.kind === 'issue' ? 'Issue' : 'Service'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#1F241D] dark:text-[#F2F0EA] tabular-nums shrink-0">
                      {row.count}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#ECE9E2] dark:bg-[#252C24] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.kind === 'issue' ? 'bg-[#1E241E] dark:bg-[#B4B9AE]' : 'bg-[#8D1B22] dark:bg-[#E5989B]'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="lg:col-span-5 space-y-6">
          {/* Dark Forest Status Distribution Card */}
          <section className="bg-[#1E241E] dark:bg-[#1B211A] dark:border dark:border-white/12 text-white rounded-3xl p-6 sm:p-7 space-y-5 reveal reveal-delay-2 hover-lift">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-white">
                Counts by Status
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                Current workflow distribution across all submissions.
              </p>
            </div>

            <div className="space-y-4">
              {statusRows.map((row) => {
                const pct =
                  stats.total === 0
                    ? 0
                    : Math.round((row.count / stats.total) * 100);
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className={`text-sm font-bold ${row.textColor}`}>
                          {row.label}
                        </span>
                        <p className="text-xs text-white/65">{row.desc}</p>
                      </div>
                      <span className="text-sm font-mono font-bold text-white tabular-nums">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl overflow-hidden reveal reveal-delay-3 hover-lift">
            <div className="px-6 py-4 bg-[#ECE9E2]/65 dark:bg-[#252C24]/70 border-b border-[#1F241D]/10 dark:border-white/10">
              <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
                Submissions by Purok / Zone
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F3EE] dark:bg-[#141814] text-[11px] font-bold uppercase tracking-wider text-[#565A51] dark:text-[#B4B9AE] border-b border-[#1F241D]/10 dark:border-white/10">
                  <th className="text-left px-6 py-3">Purok</th>
                  <th className="text-right px-4 py-3">Open</th>
                  <th className="text-right px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F241D]/10 dark:divide-white/10">
                {stats.byPurok.map((p) => (
                  <tr key={p.purok}>
                    <td className="px-6 py-3 text-[#1F241D] dark:text-[#F2F0EA] font-semibold">
                      {p.purok}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#8D1B22] dark:text-[#E5989B] tabular-nums">
                      {p.openCount}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-[#1F241D] dark:text-[#F2F0EA] tabular-nums">
                      {p.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
