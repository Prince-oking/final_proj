import type { PortalView } from '../types/portal';

interface DocumentationViewProps {
  onNavigate: (view: PortalView) => void;
}

export function DocumentationView({ onNavigate }: DocumentationViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          User Manual &amp; System Documentation
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Barangay San Miguel Portal Guide &amp; XAMPP Setup
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Operational instructions for residents and barangay officials, plus local
          XAMPP MariaDB/MySQL and Express REST API configuration details.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            01. Resident Accounts &amp; Filing Reports
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Open <strong>Resident Login</strong> to create a resident account or
              sign in with your registered email and password.
            </li>
            <li>
              Select <strong>File Report</strong> to submit a neighborhood issue
              (category, purok, typed street/landmark, and optional live camera
              photo or uploaded image) or switch to <strong>Service Request</strong>{' '}
              for barangay clearances and certificates.
            </li>
            <li>
              Every submission generates a unique reference number (
              <span className="font-mono text-xs">BRG-2026-XXXX</span> or{' '}
              <span className="font-mono text-xs">REQ-2026-XXXX</span>) stored in
              the database.
            </li>
            <li>
              Use <strong>Track</strong> at any time to check status progress and
              official barangay remarks.
            </li>
          </ol>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('resident')}
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Go to Resident Portal
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            02. Barangay Staff Desk &amp; Summary Reports
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Barangay officials sign in separately via <strong>Staff Login</strong>.
              On first launch, set up the initial Barangay Secretary/Official
              credentials directly in the setup form.
            </li>
            <li>
              Inside <strong>Staff Desk</strong>, filter submissions by type,
              status, or category, inspect uploaded photos, change status (
              <strong>Received</strong>, <strong>In Progress</strong>,{' '}
              <strong>Resolved</strong>), and post official remarks.
            </li>
            <li>
              Open <strong>Summary</strong> (restricted to Barangay Staff) to view
              aggregated counts by category, status, and purok, or export a CSV
              report.
            </li>
          </ol>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Go to Staff Login / Desk
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            03. Connecting to XAMPP MySQL &amp; Express API
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Open <strong>XAMPP Control Panel</strong> and start{' '}
              <strong>MySQL</strong> (port <span className="font-mono">3306</span>)
              and Apache (if using phpMyAdmin).
            </li>
            <li>
              Copy <span className="font-mono">.env.example</span> to{' '}
              <span className="font-mono">.env</span> with your XAMPP settings (
              <span className="font-mono">MYSQL_HOST=127.0.0.1</span>,{' '}
              <span className="font-mono">MYSQL_USER=root</span>,{' '}
              <span className="font-mono">MYSQL_DATABASE=barangay_portal</span>).
            </li>
            <li>
              Optionally import{' '}
              <span className="font-mono">database/barangay_portal.sql</span> in
              phpMyAdmin, or let the server auto-create the tables and sample records
              when you run <span className="font-mono">npm run dev</span>.
            </li>
          </ol>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            04. Scope &amp; Prototype Boundaries
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              <strong>Single Barangay:</strong> Configured exclusively for Barangay
              San Miguel puroks and officials.
            </li>
            <li>
              <strong>Typed Location:</strong> Addresses and landmarks are entered as
              text without map integration.
            </li>
            <li>
              <strong>On-Site Pickup:</strong> Document requests create a pickup
              queue record; no online fee payments or digitally signed PDFs are
              issued.
            </li>
            <li>
              <strong>In-Portal Status Updates:</strong> No SMS notifications are
              sent; residents check updates in the portal.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
