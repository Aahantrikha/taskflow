import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useStore, type Task, type Status, type Priority } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  defaultProjectId?: string;
}

const statusOptions: { value: Status; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-slate-500' },
  { value: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { value: 'done', label: 'Done', color: 'bg-emerald-500' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function TaskDialog({ open, onClose, task, defaultProjectId }: TaskDialogProps) {
  const { addTask, updateTask, projects, teamMembers, user, remarks, addRemark, fetchRemarks } = useStore();
  const { canManageTasks, canReviewTasks, canUpdateOwnTask } = useRole();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkType, setRemarkType] = useState<'review' | 'feedback' | 'issue'>('review');
  const [tab, setTab] = useState<'details' | 'remarks'>('details');

  const isEditing = !!task;
  const taskRemarks = task ? remarks.filter(r => r.taskId === task.id) : [];
  const canEditThis = canManageTasks || canReviewTasks || (task && canUpdateOwnTask(task.assignee?.id));

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setStatus(task?.status ?? 'todo');
      setPriority(task?.priority ?? 'medium');
      setAssigneeId(task?.assignee?.id ?? user?.id ?? '');
      setProjectId(task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? '');
      setDueDate(task?.dueDate ? task.dueDate.split('T')[0] : '');
      setError('');
      setRemarkText('');
      setTab('details');
      if (task) fetchRemarks({ taskId: task.id });
      // Always fetch team members when dialog opens to ensure dropdown is populated
      const { fetchTeamMembers } = useStore.getState();
      fetchTeamMembers();
    }
  }, [open, task]);

  const handleAddRemark = async () => {
    if (!remarkText.trim() || !task) return;
    try {
      await addRemark({ taskId: task.id, content: remarkText.trim(), type: remarkType });
      setRemarkText('');
    } catch { /* handled in store */ }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canManageTasks && !title.trim()) { setError('Title is required.'); return; }
    if (canManageTasks && !projectId) { setError('Please select a project.'); return; }

    const assignee = teamMembers.find(m => m.id === assigneeId) ?? null;

    if (isEditing) {
      if (canManageTasks) {
        updateTask(task.id, { title: title.trim(), description: description.trim(), status, priority, assignee, projectId, dueDate: dueDate || null });
      } else {
        updateTask(task.id, { status });
      }
    } else {
      addTask({ title: title.trim(), description: description.trim(), status, priority, assignee, projectId, dueDate: dueDate || null, tags: [] });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                <div>
                  <h2 className="text-lg font-semibold font-display">
                    {isEditing ? (canManageTasks ? 'Edit Task' : 'Task Details') : 'New Task'}
                  </h2>
                  {isEditing && task && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assigned to {task.assignee?.name || 'Unassigned'}
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs — only show when editing */}
              {isEditing && (
                <div className="flex border-b border-white/[0.06] px-6 shrink-0">
                  <button onClick={() => setTab('details')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Details</span>
                  </button>
                  <button onClick={() => setTab('remarks')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'remarks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <span className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Remarks {taskRemarks.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-[10px]">{taskRemarks.length}</span>}</span>
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {tab === 'details' && (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Task info — read-only for non-managers when editing */}
                    {isEditing && !canManageTasks && (
                      <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <h3 className="text-base font-semibold">{task?.title}</h3>
                        {task?.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.05]">{task?.priority}</span>
                          {task?.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    )}

                    {/* Title — managers creating/editing */}
                    {(!isEditing || canManageTasks) && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Title *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all" />
                      </div>
                    )}

                    {canManageTasks && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the task..." className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all resize-none" />
                      </div>
                    )}

                    {/* STATUS — prominent for everyone */}
                    {canEditThis && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-blue-400">Update Status</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {statusOptions.map(o => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => setStatus(o.value)}
                              className={`px-2 py-2.5 rounded-xl text-[11px] font-medium text-center transition-all border ${
                                status === o.value
                                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                  : 'bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:bg-white/[0.05]'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Priority & Assignee — managers only */}
                    {canManageTasks && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Priority</label>
                          <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 cursor-pointer">
                            {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Assignee</label>
                          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 cursor-pointer">
                            <option value="">Unassigned</option>
                            {teamMembers.length === 0 && <option disabled>Loading users...</option>}
                            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_', ' ')})</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {canManageTasks && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Project</label>
                          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 cursor-pointer">
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Due Date</label>
                          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 transition-all" />
                        </div>
                      </div>
                    )}

                    {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3">
                      {!canManageTasks && isEditing && (
                        <p className="text-[11px] text-muted-foreground">
                          {canReviewTasks ? '🔍 Reviewer — change status or add remarks' : '✏️ Tasker — update your task status'}
                        </p>
                      )}
                      {canManageTasks && <div />}
                      <div className="flex items-center gap-3 ml-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all">Cancel</button>
                        {canEditThis && (
                          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
                            {isEditing ? 'Save' : 'Create Task'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </form>
                )}

                {/* Remarks Tab */}
                {tab === 'remarks' && isEditing && (
                  <div className="p-6 space-y-4">
                    {/* Add remark — reviewer, lead, admin */}
                    {(canReviewTasks || canManageTasks) && (
                      <div className="space-y-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <h4 className="text-sm font-semibold text-blue-400">Add a Remark</h4>
                        <div className="flex gap-2">
                          <select
                            value={remarkType}
                            onChange={e => setRemarkType(e.target.value as any)}
                            className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm focus:outline-none focus:border-blue-500/30 cursor-pointer"
                          >
                            <option value="review">✅ Review</option>
                            <option value="feedback">💬 Feedback</option>
                            <option value="issue">⚠️ Issue</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={remarkText}
                            onChange={e => setRemarkText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRemark(); } }}
                            placeholder="Write your remark here..."
                            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 transition-all"
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddRemark}
                            disabled={!remarkText.trim()}
                            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                          >
                            Submit
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Existing remarks */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {taskRemarks.length > 0 ? `${taskRemarks.length} Remark${taskRemarks.length !== 1 ? 's' : ''}` : 'No remarks yet'}
                      </h4>
                      {taskRemarks.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No remarks on this task yet</p>
                          {(canReviewTasks || canManageTasks) && <p className="text-xs text-muted-foreground mt-1">Add a review or feedback above</p>}
                        </div>
                      )}
                      {taskRemarks.map(r => (
                        <div key={r.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-[9px] font-bold text-blue-300">
                              {r.author.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs font-medium">{r.author.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              r.type === 'issue' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                              r.type === 'feedback' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {r.type === 'issue' ? '⚠️ Issue' : r.type === 'feedback' ? '💬 Feedback' : '✅ Review'}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 pl-8">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
