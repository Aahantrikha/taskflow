import { motion } from 'framer-motion';
import {
  Users,
  Search,
  ListChecks,
  CheckCircle2,
  Shield,
  Crown,
  Eye,
  Wrench,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Shield },
  project_lead: { label: 'Project Lead', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: Crown },
  quality_reviewer: { label: 'Reviewer', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Eye },
  tasker: { label: 'Tasker', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Wrench },
};

export default function Team() {
  const { teamMembers, tasks, updateUserRole, user } = useStore();
  const { isAdmin } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const totalAssigned = teamMembers.reduce((acc, m) => acc + m.tasksAssigned, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">
            {teamMembers.length} members • {totalAssigned} active tasks
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Size', value: teamMembers.length, icon: Users, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400' },
          { label: 'Tasks Active', value: totalAssigned, icon: ListChecks, color: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400' },
          { label: 'In Progress', value: inProgressTasks, icon: TrendingUp, color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400' },
          { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-white/[0.06] p-5',
                'bg-gradient-to-br', stat.color
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Icon className={cn('w-5 h-5', stat.iconColor)} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setRoleFilter('all')}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-medium transition-all border',
            roleFilter === 'all'
              ? 'bg-white/[0.1] border-white/[0.2] text-foreground'
              : 'bg-transparent border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]'
          )}
        >
          All ({teamMembers.length})
        </button>
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const count = teamMembers.filter(m => m.role === key).length;
          if (count === 0) return null;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all border',
                roleFilter === key
                  ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                  : 'bg-transparent border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]'
              )}
            >
              <Icon className="w-3 h-3" />
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMembers.map((member, index) => {
          const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.tasker;
          const RoleIcon = roleConfig.icon;
          const completionRate = (member.tasksCompleted + member.tasksAssigned) > 0
            ? Math.round((member.tasksCompleted / (member.tasksCompleted + member.tasksAssigned)) * 100)
            : 0;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
            >
              {/* Subtle top accent based on role */}
              <div className={cn('absolute top-0 left-0 right-0 h-[2px]', roleConfig.bg.replace('/10', '/40'))} />

              <div className="p-6">
                {/* Profile Section */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative">
                    <UserAvatar user={member} size="lg" showStatus status={member.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold truncate group-hover:text-white transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{member.jobTitle}</p>
                    <div className={cn(
                      'inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-medium',
                      roleConfig.bg, roleConfig.border, roleConfig.color, 'border'
                    )}>
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig.label}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-lg font-bold">{member.tasksAssigned}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Active</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-lg font-bold text-emerald-400">{member.tasksCompleted}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Done</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <p className="text-lg font-bold">{completionRate}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Rate</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={cn(
                        'h-full rounded-full',
                        completionRate >= 80 ? 'bg-emerald-500' : completionRate >= 50 ? 'bg-blue-500' : completionRate > 0 ? 'bg-amber-500' : 'bg-white/[0.1]'
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && member.id !== user?.id ? (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Role</span>
                      <div className="flex-1 relative">
                        <select
                          value={member.role}
                          onChange={(e) => updateUserRole(member.id, e.target.value as any)}
                          className="w-full appearance-none px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 cursor-pointer transition-all pr-8"
                        >
                          <option value="admin">Admin</option>
                          <option value="project_lead">Project Lead</option>
                          <option value="quality_reviewer">Quality Reviewer</option>
                          <option value="tasker">Tasker</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-xs text-muted-foreground">
                      {member.id === user?.id ? 'Your account' : `${member.tasksAssigned + member.tasksCompleted} total tasks`}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No members found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </motion.div>
  );
}
