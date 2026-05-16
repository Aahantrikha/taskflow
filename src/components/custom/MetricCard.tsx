import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  delay = 0,
  className 
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5',
        'transition-all duration-300',
        'hover:bg-white/[0.06] hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/20',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <motion.h3 
            className="text-2xl font-bold text-foreground font-display"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.1 }}
          >
            {value}
          </motion.h3>
          {change && (
            <p className={cn(
              'text-xs font-medium',
              changeType === 'positive' && 'text-emerald-400',
              changeType === 'negative' && 'text-red-400',
              changeType === 'neutral' && 'text-muted-foreground',
            )}>
              {changeType === 'positive' && '+'}
              {change}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
