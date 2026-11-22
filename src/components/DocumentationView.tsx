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
          Barangay San Miguel Report and Request Portal Guide
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Operational instructions for residents, barangay officials, and administrators,
          including system scope, data workflow, and prototype limitations.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            01. Resident Guide: Filing an Issue Report
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Confirm your active resident profile or register a new profile using the
              Resident Account selector.
            </li>
            <li>
              Click <strong>File Report</strong> and choose the{' '}
              <strong>Issue Report</strong> tab.
            </li>
            <li>
              Select the category (such as Broken Streetlight, Uncollected Garbage, or
              Clogged Drainage), choose your Purok, and type the exact street or
              landmark.
            </li>
            <li>
              Attach visual evidence using <strong>Take Photo</strong> (live camera) or{' '}
              <strong>Upload Photo</strong> (image file or drag-and-drop).
            </li>
            <li>
              Submit the form to receive a unique reference number (e.g.,{' '}
              <span className="font-mono text-xs">BRG-2026-0106</span>).
            </li>
          </ol>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Go to Submission Form
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            02. Resident Guide: Requesting Documents &amp; Tracking
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Switch to the <strong>Service Request</strong> tab to request a Barangay
              Clearance, Certificate of Residency, or Certificate of Indigency.
            </li>
            <li>
              Enter your purpose and preferred pickup date. This logs a formal request
              record for on-site claiming at Window 1.
            </li>
            <li>
              Open the <strong>Track</strong> page at any time and enter your reference
              number to view the 3-step status (<strong>Received</strong>,{' '}
              <strong>In Progress</strong>, <strong>Resolved</strong>) and official
              remarks.
            </li>
          </ol>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('track')}
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Open Reference Tracker
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            03. Staff &amp; Officials Workflow
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              Open <strong>Staff Desk</strong> and select your official role (Barangay
              Secretary, Punong Barangay, or Committee Kagawad).
            </li>
            <li>
              Filter the queue by type, status, category, or search by reference number
              or street name.
            </li>
            <li>
              Select any submission to inspect the photo evidence, update its status,
              and append official remarks. Every update is immediately visible on the
              resident tracker.
            </li>
            <li>
              Visit <strong>Summary</strong> to view real-time counts by category,
              status, and purok, or export a CSV file for council meetings.
            </li>
          </ol>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Open Staff Desk
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            04. System Scope &amp; Prototype Limitations
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              <strong>Single-Barangay Deployment:</strong> Configured exclusively for
              Barangay San Miguel puroks and officials.
            </li>
            <li>
              <strong>Typed Location Only:</strong> Locations are entered manually as
              street/landmark text with no interactive map integration.
            </li>
            <li>
              <strong>In-Portal Status Updates:</strong> No SMS notifications are sent;
              updates appear directly inside the tracking portal.
            </li>
            <li>
              <strong>On-Site Pickup &amp; Fees:</strong> No online fee payment is
              processed, and document requests create a pickup record rather than
              issuing legally signed digital certificates.
            </li>
            <li>
              <strong>Demonstration Persistence:</strong> Runs on preloaded sample
              records and browser-persisted local storage for demonstration.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
