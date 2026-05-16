import { motion } from 'framer-motion';
import { MessageSquare, FolderGit, Users, CheckCircle2 } from 'lucide-react';
import type { Activity } from '@/store/useStore';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

const typeIcons = {
  task: CheckCircle2,
  project: FolderGit,
  comment: MessageSquare,
  member: Users,
};

const typeColors = {
  task: 'text-blue-400 bg-blue-500/10',
  project: 'text-violet-400 bg-violet-500/10',
  comment: 'text-amber-400 bg-amber-500/10',
  member: 'text-emerald-400 bg-emerald-500/10',
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function ActivityFeed({ activities, maxItems = 8 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayActivities.map((activity, index) => {
        const Icon = typeIcons[activity.type];
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="relative mt-0.5">
              <UserAvatar user={activity.user} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.user.name}</span>
                {' '}{activity.action}{' '}
                <span className="text-blue-400 font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.timestamp)}</p>
            </div>
            <div className={cn('p-1.5 rounded-lg shrink-0', typeColors[activity.type])}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
