import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  LayoutGrid,
  Table2,
  Clock,
  ArrowUpDown,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { GlassCard } from '@/components/custom/GlassCard';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { PriorityBadge } from '@/components/custom/StatusBadge';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { TaskDialog } from '@/components/custom/TaskDialog';
import { cn } from '@/lib/utils';
import type { Status, Priority, Task } from '@/store/useStore';

const statusColumns: { key: Status; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'border-t-slate-500' },
  { key: 'todo', label: 'To Do', color: 'border-t-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-amber-500' },
  { key: 'in_review', label: 'In Review', color: 'border-t-purple-500' },
  { key: 'done', label: 'Done', color: 'border-t-emerald-500' },
];

export default function Tasks() {
  const { tasks, projects, deleteTask, user } = useStore();
  const { canManageTasks, canReviewTasks, canUpdateOwnTask } = useRole();

  const [viewMode, setViewMode] = useState<'table' | 'board'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Taskers only see their own tasks; others see all
  const visibleTasks = canReviewTasks
    ? tasks
    : tasks.filter(t => t.assignee?.id === user?.id);

  const filteredTasks = visibleTasks.filter(task => {
    const matchesSearch = !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortField === 'priority') {
      const order = { urgent: 4, high: 3, medium: 2, low: 1 };
      return sortDir === 'asc'
        ? order[a.priority] - order[b.priority]
        : order[b.priority] - order[a.priority];
    }
    if (sortField === 'createdAt') {
      return sortDir === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const statusGroups = statusColumns.reduce((acc, col) => {
    acc[col.key] = filteredTasks.filter(t => t.status === col.key);
    return acc;
  }, {} as Record<Status, typeof tasks>);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const openNew = () => {
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}{!canReviewTasks && ' assigned to you'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                viewMode === 'board' ? 'bg-white/[0.08] text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                viewMode === 'table' ? 'bg-white/[0.08] text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Table2 className="w-4 h-4" />
              List
            </button>
          </div>

          {/* New Task — admin/project lead only */}
          {canManageTasks && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              New Task
            </motion.button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
          className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-blue-500/30 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
          className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-foreground focus:outline-none focus:border-blue-500/30 cursor-pointer"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'board' ? (
          <motion.div
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {statusColumns.map((column) => {
              const columnTasks = statusGroups[column.key];
              return (
                <div key={column.key} className="space-y-3">
                  <div className={`flex items-center justify-between pb-3 border-t-2 ${column.color} pt-3`}>
                    <span className="text-sm font-semibold">{column.label}</span>
                    <span className="text-xs text-muted-foreground bg-white/[0.05] px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.map((task, index) => {
                      const canEdit = canUpdateOwnTask(task.assignee?.id);
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

                          {/* Inline status update for taskers */}
                          {canEdit && (
                            <div className="mb-3" onClick={e => e.stopPropagation()}>
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  const { updateTask } = useStore.getState();
                                  updateTask(task.id, { status: e.target.value as any });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs font-medium focus:outline-none focus:border-blue-500/40 cursor-pointer transition-all"
                              >
                                <option value="backlog">Backlog</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                            <UserAvatar user={task.assignee} size="sm" />
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {canManageTasks && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                  className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard hover={false} className="overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Task
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Priority
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {sortedTasks.map((task, index) => {
                      const canEdit = canUpdateOwnTask(task.assignee?.id);
                      return (
                        <motion.tr
                          key={task.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-5 py-4">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={task.assignee} size="sm" />
                              <span className="text-sm">{task.assignee?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-muted-foreground">
                              {getProjectName(task.projectId)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {task.dueDate ? (
                              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEdit && (
                                <button
                                  onClick={() => openEdit(task)}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-blue-400 transition-colors"
                                  title="Edit task"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canManageTasks && (
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                {sortedTasks.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    No tasks found.
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => { setTaskDialogOpen(false); setEditingTask(undefined); }}
        task={editingTask}
      />
    </motion.div>
  );
}
