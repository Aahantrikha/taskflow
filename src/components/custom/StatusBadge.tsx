import { cn } from '@/lib/utils';
import type { Status, Priority, ProjectStatus } from '@/store/useStore';

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  backlog: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
  todo: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  in_progress: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  in_review: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  done: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
  medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  urgent: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

const projectStatusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  completed: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  on_hold: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  cancelled: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
};

interface StatusBadgeProps {
  status: Status | ProjectStatus;
  type?: 'status' | 'priority' | 'project';
  className?: string;
}

export function StatusBadge({ status, type = 'status', className }: StatusBadgeProps) {
  const config = type === 'priority' 
    ? priorityConfig[status] 
    : type === 'project' 
    ? projectStatusConfig[status] 
    : statusConfig[status];

  if (!config) return null;

  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bg,
      config.text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const config = priorityConfig[priority];
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bg,
      config.text,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {label}
    </span>
  );
}
