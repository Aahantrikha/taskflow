import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  ListChecks,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Search,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { GlassCard } from '@/components/custom/GlassCard';
import { ProgressBar } from '@/components/custom/ProgressBar';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { PriorityBadge } from '@/components/custom/StatusBadge';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { TaskDialog } from '@/components/custom/TaskDialog';
import { format } from 'date-fns';
import type { Task } from '@/store/useStore';

export default function SingleProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, tasks, teamMembers, deleteTask, removeMemberFromProject, addMemberToProject } = useStore();
  const { canManageTasks, canUpdateOwnTask } = useRole();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const project = projects.find(p => p.id === id);
  const projectTasks = tasks.filter(t => t.projectId === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const statusGroups = {
    backlog: projectTasks.filter(t => t.status === 'backlog'),
    todo: projectTasks.filter(t => t.status === 'todo'),
    in_progress: projectTasks.filter(t => t.status === 'in_progress'),
    in_review: projectTasks.filter(t => t.status === 'in_review'),
    done: projectTasks.filter(t => t.status === 'done'),
  };

  const statusColumns = [
    { key: 'backlog', label: 'Backlog', color: 'border-t-slate-500' },
    { key: 'todo', label: 'To Do', color: 'border-t-blue-500' },
    { key: 'in_progress', label: 'In Progress', color: 'border-t-amber-500' },
    { key: 'in_review', label: 'In Review', color: 'border-t-purple-500' },
    { key: 'done', label: 'Done', color: 'border-t-emerald-500' },
  ];

  // Members not yet in this project (for admin to add)
  const nonMembers = teamMembers.filter(m => !project.members.find(pm => pm.id === m.id));

  const openEdit = (task: Task) => {
    if (!canUpdateOwnTask(task.assignee?.id)) return;
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Project Header */}
      <GlassCard hover={false} glow>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${project.color}25` }}
            >
              <FolderKanban className="w-6 h-6" style={{ color: project.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold font-display">{project.name}</h1>
                <StatusBadge status={project.status} type="project" />
              </div>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>

          {/* Action buttons — role gated */}
          <div className="flex items-center gap-2 shrink-0">
            {canManageTasks && (
              <button
                onClick={() => setShowMemberPanel(!showMemberPanel)}
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Members
              </button>
            )}
            {canManageTasks && (
              <button
                onClick={() => { setEditingTask(undefined); setTaskDialogOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Member Management Panel — admin only */}
        {canManageTasks && showMemberPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Manage Members</h3>
              <button onClick={() => setShowMemberPanel(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Current members */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Current Members</p>
                <div className="space-y-2">
                  {project.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={m} size="sm" />
                        <div>
                          <p className="text-xs font-medium">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.role === 'admin' ? 'Admin' : 'Member'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMemberFromProject(project.id, m.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add members */}
              {nonMembers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Add Members</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {nonMembers
                      .filter(m => !memberSearchQuery || 
                        m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      )
                      .map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={m} size="sm" />
                          <div>
                            <p className="text-xs font-medium">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addMemberToProject(project.id, m.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="Add member"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ListChecks className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">{projectTasks.length}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">{projectTasks.filter(t => t.status === 'done').length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">{project.members.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {project.dueDate ? format(new Date(project.dueDate), 'MMM d') : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Due Date</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-semibold">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} color={project.color} height="h-3" />
        </div>
      </GlassCard>

      {/* Kanban Board */}
      <div>
        <h2 className="text-lg font-semibold font-display mb-4">Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusColumns.map((column) => {
            const columnTasks = statusGroups[column.key as keyof typeof statusGroups] || [];
            return (
              <div key={column.key} className="space-y-3">
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 border-t-2 ${column.color} pt-3`}>
                  <span className="text-sm font-semibold">{column.label}</span>
                  <span className="text-xs text-muted-foreground bg-white/[0.05] px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task, index) => {
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all cursor-pointer group"
                        onClick={() => openEdit(task)}
                      >
                        <h4 className="text-sm font-medium mb-2 group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                          <UserAvatar user={task.assignee} size="sm" />
                          <div className="flex items-center gap-1.5">
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                            {canManageTasks && (
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => { setTaskDialogOpen(false); setEditingTask(undefined); }}
        task={editingTask}
        defaultProjectId={id}
      />
    </motion.div>
  );
}
