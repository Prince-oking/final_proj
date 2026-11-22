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
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
        Loading barangay summary report...
      </div>
    );
  }

  if (errorMsg || !stats) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-red-700">
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
      barColor: 'bg-blue-800',
      textColor: 'text-blue-800',
      desc: 'Newly filed and awaiting assignment',
    },
    {
      label: 'In Progress',
      count: stats.byStatus['In Progress'],
      barColor: 'bg-amber-600',
      textColor: 'text-amber-700',
      desc: 'Currently being acted on by barangay staff',
    },
    {
      label: 'Resolved',
      count: stats.byStatus.Resolved,
      barColor: 'bg-emerald-700',
      textColor: 'text-emerald-700',
      desc: 'Completed issue or document ready/released',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-800 mb-1">
            Barangay Staff Decision Support · {authUser.fullName}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Barangay Summary Report
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Aggregated counts by category, status, and purok to help barangay
            officials prioritize field action.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenStaffDesk}
            className="min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            <span>Back to Staff Desk</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Logged</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">All reports &amp; requests</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Issue Reports</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.issueCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Community maintenance</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Service Requests</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.serviceCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Document pickup queue</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Resolution Rate</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {stats.resolutionRatePercent}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.byStatus.Resolved} of {stats.total} resolved
          </p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Submissions by Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
                      <span className="font-medium text-slate-900 truncate">
                        {row.category}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        · {row.kind === 'issue' ? 'Issue' : 'Service'}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                      {row.count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        row.kind === 'issue' ? 'bg-blue-800' : 'bg-slate-600'
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
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Counts by Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
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
                        <span className={`text-sm font-semibold ${row.textColor}`}>
                          {row.label}
                        </span>
                        <p className="text-xs text-slate-500">{row.desc}</p>
                      </div>
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Submissions by Purok / Zone
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                  <th className="text-left font-semibold px-5 py-2.5">Purok</th>
                  <th className="text-right font-semibold px-4 py-2.5">Open</th>
                  <th className="text-right font-semibold px-5 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats.byPurok.map((p) => (
                  <tr key={p.purok}>
                    <td className="px-5 py-2.5 text-slate-800 font-medium">
                      {p.purok}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-700 tabular-nums">
                      {p.openCount}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
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
