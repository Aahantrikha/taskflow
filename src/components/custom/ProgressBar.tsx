import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
  delay?: number;
}

export function ProgressBar({ 
  progress, 
  color = 'bg-blue-500', 
  height = 'h-2',
  showLabel = true,
  className,
  animated = true,
  delay = 0
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className={cn('w-full bg-white/[0.06] rounded-full overflow-hidden', height)}>
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ 
            duration: animated ? 1 : 0, 
            delay, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{clampedProgress}%</span>
          {clampedProgress === 100 && (
            <span className="text-[10px] text-emerald-400 font-medium">Complete</span>
          )}
        </div>
      )}
    </div>
  );
}
