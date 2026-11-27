import type { PortalView } from '../types/portal';

interface DocumentationViewProps {
  onNavigate: (view: PortalView) => void;
}

export function DocumentationView({ onNavigate }: DocumentationViewProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-[#1F241D]/12 dark:border-white/12 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8D1B22] dark:text-[#E5989B]">
          User Manual &amp; System Documentation
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA] tracking-tight">
          Barangay San Miguel Portal Guide &amp; XAMPP Setup
        </h1>
        <p className="text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed max-w-2xl">
          Operational instructions for residents and barangay officials, plus local
          XAMPP MariaDB/MySQL and Express REST API configuration details.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-5 reveal hover-lift">
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold text-[#8D1B22] dark:text-[#E5989B]">01</span>
            <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
              Resident Accounts &amp; Filing Reports
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
              <li>
                Open <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Resident Login</strong> to create a resident account or
                sign in with your registered email and password.
              </li>
              <li>
                Select <strong className="text-[#1F241D] dark:text-[#F2F0EA]">File Report</strong> to submit a neighborhood issue
                (category, purok, typed street/landmark, and optional live camera
                photo or uploaded image) or switch to <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Service Request</strong>{' '}
                for barangay clearances and certificates.
              </li>
              <li>
                Every submission generates a unique reference number (
                <span className="font-mono text-xs bg-[#ECE9E2] dark:bg-[#252C24] dark:text-[#F2F0EA] px-1.5 py-0.5 rounded">
                  BRG-2026-XXXX
                </span>{' '}
                or{' '}
                <span className="font-mono text-xs bg-[#ECE9E2] dark:bg-[#252C24] dark:text-[#F2F0EA] px-1.5 py-0.5 rounded">
                  REQ-2026-XXXX
                </span>
                ) stored in the database.
              </li>
              <li>
                Use <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Track</strong> at any time to check status progress and
                official barangay remarks.
              </li>
            </ol>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('resident')}
              className="min-h-[40px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E241E] dark:bg-[#8D1B22] hover:bg-[#2B332B] dark:hover:bg-[#701319] transition-colors"
            >
              Go to Resident Portal
            </button>
          </div>
        </section>

        <section className="bg-[#ECE9E2]/70 dark:bg-[#252C24] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-5 reveal reveal-delay-1 hover-lift">
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold text-[#8D1B22] dark:text-[#E5989B]">02</span>
            <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
              Barangay Staff Desk &amp; Summary Reports
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
              <li>
                Barangay officials sign in separately via <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Staff Login</strong>.
                On first launch, set up the initial Barangay Secretary/Official
                credentials directly in the setup form.
              </li>
              <li>
                Inside <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Staff Desk</strong>, filter submissions by type,
                status, or category, inspect uploaded photos, change status (
                <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Received</strong>, <strong className="text-[#1F241D] dark:text-[#F2F0EA]">In Progress</strong>,{' '}
                <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Resolved</strong>), and post official remarks.
              </li>
              <li>
                Open <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Summary</strong> (restricted to Barangay Staff) to view
                aggregated counts by category, status, and purok, or export a CSV
                report.
              </li>
            </ol>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="min-h-[40px] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#8D1B22] hover:bg-[#701319] transition-colors"
            >
              Go to Staff Login / Desk
            </button>
          </div>
        </section>

        <section className="bg-[#1E241E] dark:bg-[#1B211A] dark:border dark:border-white/12 text-white rounded-3xl p-6 sm:p-7 space-y-3 reveal reveal-delay-2 hover-lift">
          <span className="font-mono text-xs font-bold text-[#E5989B]">03</span>
          <h2 className="font-display text-2xl font-extrabold text-white">
            Connecting to XAMPP MySQL &amp; Express API
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-white/80 leading-relaxed">
            <li>
              Open <strong className="text-white">XAMPP Control Panel</strong> and start{' '}
              <strong className="text-white">MySQL</strong> (port{' '}
              <span className="font-mono text-white">3306</span>) and Apache (if using
              phpMyAdmin).
            </li>
            <li>
              Copy <span className="font-mono text-white">.env.example</span> to{' '}
              <span className="font-mono text-white">.env</span> with your XAMPP
              settings (<span className="font-mono text-white">MYSQL_HOST=127.0.0.1</span>
              , <span className="font-mono text-white">MYSQL_USER=root</span>,{' '}
              <span className="font-mono text-white">MYSQL_DATABASE=barangay_portal</span>).
            </li>
            <li>
              Optionally import{' '}
              <span className="font-mono text-white">database/barangay_portal.sql</span>{' '}
              in phpMyAdmin, or let the server auto-create the tables and sample records
              when you run <span className="font-mono text-white">npm run dev</span>.
            </li>
          </ol>
        </section>

        <section className="bg-white dark:bg-[#1C221B] border border-[#1F241D]/10 dark:border-white/12 rounded-3xl p-6 sm:p-7 space-y-3 reveal reveal-delay-3 hover-lift">
          <span className="font-mono text-xs font-bold text-[#8D1B22] dark:text-[#E5989B]">04</span>
          <h2 className="font-display text-2xl font-extrabold text-[#1F241D] dark:text-[#F2F0EA]">
            Scope &amp; Prototype Boundaries
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[#565A51] dark:text-[#B4B9AE] leading-relaxed">
            <li>
              <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Single Barangay:</strong> Configured exclusively for Barangay
              San Miguel puroks and officials.
            </li>
            <li>
              <strong className="text-[#1F241D] dark:text-[#F2F0EA]">Typed Location:</strong> Addresses and landmarks are entered as
              text without map integration.
            </li>
            <li>
              <strong className="text-[#1F241D] dark:text-[#F2F0EA]">On-Site Pickup:</strong> Document requests create a pickup
              queue record; no online fee payments or digitally signed PDFs are
              issued.
            </li>
            <li>
              <strong className="text-[#1F241D] dark:text-[#F2F0EA]">In-Portal Status Updates:</strong> No SMS notifications are
              sent; residents check updates in the portal.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
