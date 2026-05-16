import { motion } from 'framer-motion';
import {
  FolderKanban,
  ListChecks,
  Users,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  AlertCircle,
  Zap,
  Target,
  MessageSquare,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { MetricCard } from '@/components/custom/MetricCard';
import { GlassCard } from '@/components/custom/GlassCard';
import { ActivityFeed } from '@/components/custom/ActivityFeed';
import MagicBento from '@/components/custom/MagicBento';
import { ProgressBar } from '@/components/custom/ProgressBar';
import { StatusBadge, PriorityBadge } from '@/components/custom/StatusBadge';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { TaskDialog } from '@/components/custom/TaskDialog';
import { ProjectDialog } from '@/components/custom/ProjectDialog';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const taskTrendData: { name: string; completed: number; created: number }[] = [];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { projects, tasks, teamMembers, activities, user, attendanceRecords, fetchAttendance } = useStore();
  const { canManageTasks, isAdmin } = useRole();
  const navigate = useNavigate();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Fetch attendance for admin
  useState(() => { if (isAdmin) fetchAttendance(); });

  // Derive project chart data from real projects
  const projectData = projects.map(p => ({ name: p.name.split(' ')[0], tasks: p.taskCount }));

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalMembers = teamMembers.length;

  // For members: scope metrics to their own tasks
  const myTasks = canManageTasks ? tasks : tasks.filter(t => t.assignee?.id === user?.id);
  const myCompleted = myTasks.filter(t => t.status === 'done').length;
  const myInProgress = myTasks.filter(t => t.status === 'in_progress').length;
  const myOverdue = myTasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < new Date();
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening with your projects today
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={canManageTasks ? 'Active Projects' : 'My Projects'}
          value={canManageTasks ? activeProjects : projects.filter(p => p.members.some(m => m.id === user?.id)).length}
          change={canManageTasks ? `${activeProjects} active` : 'assigned to you'}
          changeType="positive"
          icon={FolderKanban}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          delay={0}
        />
        <MetricCard
          title="Tasks Completed"
          value={myCompleted}
          change={myTasks.length > 0 ? `${Math.round((myCompleted / myTasks.length) * 100)}% rate` : '0% rate'}
          changeType="positive"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.05}
        />
        <MetricCard
          title="In Progress"
          value={myInProgress}
          change="on track"
          changeType="neutral"
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          delay={0.1}
        />
        <MetricCard
          title={canManageTasks ? 'Team Members' : 'Overdue Tasks'}
          value={canManageTasks ? totalMembers : myOverdue.length}
          change={canManageTasks ? `${teamMembers.filter(m => (m as any).status === 'online').length} online` : myOverdue.length > 0 ? 'needs attention' : 'all on time'}
          changeType={canManageTasks ? 'positive' : myOverdue.length > 0 ? 'negative' : 'positive'}
          icon={canManageTasks ? Users : Clock}
          iconColor={canManageTasks ? 'text-violet-400' : myOverdue.length > 0 ? 'text-red-400' : 'text-emerald-400'}
          iconBg={canManageTasks ? 'bg-violet-500/10' : myOverdue.length > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
          delay={0.15}
        />
      </motion.div>

      {/* MagicBento Quick Overview */}
      <motion.div variants={itemVariants}>
        <MagicBento
          cards={[
            { label: 'Projects', title: `${projects.length} Active`, description: 'Track progress across all your projects', icon: <FolderKanban className="w-4 h-4 text-blue-400" /> },
            { label: 'Tasks', title: `${myTasks.length} Total`, description: `${myCompleted} completed, ${myInProgress} in progress`, icon: <ListChecks className="w-4 h-4 text-violet-400" /> },
            { label: 'Performance', title: `${myTasks.length > 0 ? Math.round((myCompleted / myTasks.length) * 100) : 0}% Done`, description: 'Your task completion rate', icon: <Target className="w-4 h-4 text-emerald-400" /> },
            { label: 'Team', title: `${teamMembers.length} Members`, description: 'Collaborate with your team', icon: <Users className="w-4 h-4 text-amber-400" /> },
            { label: 'Velocity', title: 'On Track', description: 'Sprint progress looking good', icon: <Zap className="w-4 h-4 text-cyan-400" /> },
            { label: 'Reviews', title: `${myOverdue.length} Overdue`, description: myOverdue.length > 0 ? 'Tasks need attention' : 'All tasks on schedule', icon: <MessageSquare className="w-4 h-4 text-red-400" /> },
          ]}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={250}
          particleCount={8}
          glowColor="59, 130, 246"
        />
      </motion.div>

      {/* Admin: Team Attendance */}
      {isAdmin && attendanceRecords.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold font-display">Team Attendance</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Today's punch in/out records</p>
              </div>
              <button onClick={() => fetchAttendance()} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Punch In</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Punch Out</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {attendanceRecords.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-3 text-sm font-medium">{r.user.name}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground capitalize">{r.user.role.replace('_', ' ')}</td>
                      <td className="px-3 py-3 text-xs text-emerald-400">{new Date(r.punchIn).toLocaleTimeString()}</td>
                      <td className="px-3 py-3 text-xs">{r.punchOut ? <span className="text-blue-400">{new Date(r.punchOut).toLocaleTimeString()}</span> : <span className="text-amber-400">Active</span>}</td>
                      <td className="px-3 py-3 text-xs font-medium">{r.hours ? `${r.hours}h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Task Trend Chart */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold font-display">Task Velocity</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Tasks completed vs created this week</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  Created
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={taskTrendData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorCompleted)"
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorCreated)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Projects + Recent Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Tasks Distribution */}
            <GlassCard>
              <h3 className="text-lg font-semibold font-display mb-1">Task Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">Tasks per project</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={projectData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Overdue Tasks */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold font-display">Attention Needed</h3>
              </div>
              {myOverdue.length > 0 ? (
                <div className="space-y-3">
                  {myOverdue
                    .slice(0, 3)
                    .map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <StatusBadge status={task.status} />
                            <span className="text-xs text-red-400">
                              Due {format(new Date(task.dueDate!), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <UserAvatar user={task.assignee} size="sm" />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">No overdue tasks</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Recent Tasks */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold font-display">Recent Tasks</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Latest tasks across all projects</p>
              </div>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-400 transition-colors truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                    <UserAvatar user={task.assignee} size="sm" />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Right sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Quick Actions */}
          <GlassCard>
            <h3 className="text-lg font-semibold font-display mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {canManageTasks && (
                <button
                  onClick={() => setTaskDialogOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors">
                    <ListChecks className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">New Task</span>
                  <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              {canManageTasks && (
                <button
                  onClick={() => setProjectDialogOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors">
                    <FolderKanban className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm font-medium">New Project</span>
                  <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              <button
                onClick={() => navigate('/team')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">View Team</span>
                <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors">
                  <ListChecks className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-medium">My Tasks</span>
                <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </GlassCard>

          {/* Top Projects */}
          <GlassCard>
            <h3 className="text-lg font-semibold font-display mb-4">Project Progress</h3>
            <div className="space-y-4">
              {projects.slice(0, 4).map((project, index) => (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground">{project.progress}%</span>
                  </div>
                  <ProgressBar
                    progress={project.progress}
                    color={project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}
                    height="h-1.5"
                    showLabel={false}
                    delay={0.2 + index * 0.1}
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Activity Feed */}
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-lg font-semibold font-display">Activity</h3>
            </div>
            <div className="px-3 pb-3">
              <ActivityFeed activities={activities} maxItems={6} />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Dialogs */}
      <TaskDialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} />
      <ProjectDialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} />
    </motion.div>
  );
}
