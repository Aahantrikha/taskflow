import { cn } from '@/lib/utils';
import type { User } from '@/store/useStore';

interface UserAvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
};

const statusSizeMap = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
};

const statusColors = {
  online: 'bg-emerald-400',
  offline: 'bg-slate-500',
  away: 'bg-amber-400',
};

export function UserAvatar({ user, size = 'md', showStatus = false, status, className }: UserAvatarProps) {
  if (!user) {
    return (
      <div className={cn(
        'rounded-full bg-white/10 flex items-center justify-center text-muted-foreground',
        sizeMap[size],
        className
      )}>
        ?
      </div>
    );
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={cn('relative inline-block', className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn('rounded-full object-cover ring-2 ring-white/5', sizeMap[size])}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-blue-300 font-semibold',
          sizeMap[size]
        )}>
          {initials}
        </div>
      )}
      {showStatus && status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full ring-2 ring-background',
          statusSizeMap[size],
          statusColors[status]
        )} />
      )}
    </div>
  );
}
