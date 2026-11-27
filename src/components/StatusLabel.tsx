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
        className={`inline-flex items-center gap-1.5 font-semibold tracking-tight text-emerald-800 dark:text-emerald-300 whitespace-nowrap ${textClass}`}
      >
        <CheckCircle2 className={iconClass} aria-hidden="true" />
        <span>Resolved</span>
      </span>
    );
  }

  if (status === 'In Progress') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold tracking-tight text-amber-800 dark:text-amber-300 whitespace-nowrap ${textClass}`}
      >
        <Clock className={iconClass} aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight text-[#8D1B22] dark:text-[#E5989B] whitespace-nowrap ${textClass}`}
    >
      <Inbox className={iconClass} aria-hidden="true" />
      <span>Received</span>
    </span>
  );
}
