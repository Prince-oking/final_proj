import { CheckCircle2, Clock, Inbox } from 'lucide-react';
import type { SubmissionStatus } from '../types/portal';

interface StatusLabelProps {
  status: SubmissionStatus;
  size?: 'sm' | 'md';
}

export function StatusLabel({ status, size = 'sm' }: StatusLabelProps) {
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  if (status === 'Resolved') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-emerald-700 whitespace-nowrap ${textClass}`}
      >
        <CheckCircle2 className={iconClass} aria-hidden="true" />
        <span>Resolved</span>
      </span>
    );
  }

  if (status === 'In Progress') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-amber-700 whitespace-nowrap ${textClass}`}
      >
        <Clock className={iconClass} aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold text-blue-800 whitespace-nowrap ${textClass}`}
    >
      <Inbox className={iconClass} aria-hidden="true" />
      <span>Received</span>
    </span>
  );
}
