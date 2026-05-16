import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Search, UserPlus, Check } from 'lucide-react';
import { useStore, type ProjectStatus } from '@/store/useStore';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b',
  '#10b981', '#ef4444', '#f97316', '#ec4899',
];

export function ProjectDialog({ open, onClose }: ProjectDialogProps) {
  const { addProject, teamMembers, user } = useStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [dueDate, setDueDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    user ? [user.id] : []
  );
  const [error, setError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setDueDate('');
      setSelectedMembers(user ? [user.id] : []);
      setError('');
      setMemberSearch('');
    }
  }, [open]);

  const toggleMember = (id: string) => {
    // Creator (current user) cannot be removed
    if (id === user?.id) return;
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }

    const members = teamMembers.filter(m => selectedMembers.includes(m.id));

    addProject({
      name: name.trim(),
      description: description.trim(),
      status: 'active' as ProjectStatus,
      progress: 0,
      members,
      color,
      dueDate: dueDate || null,
      taskCount: 0,
      completedTasks: 0,
      memberIds: selectedMembers,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold font-display">New Project</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Project Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What is this project about?"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Color */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className="w-7 h-7 rounded-lg transition-all"
                          style={{
                            backgroundColor: c,
                            outline: color === c ? `2px solid ${c}` : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Members</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
                    />
                  </div>

                  {/* Search Results */}
                  {memberSearch.trim() && (
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
                      {teamMembers
                        .filter(m => m.id !== user?.id && (
                          m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          m.email.toLowerCase().includes(memberSearch.toLowerCase())
                        ))
                        .map(m => {
                          const selected = selectedMembers.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleMember(m.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300 shrink-0">
                                {m.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{m.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{m.email} • {m.role.replace('_', ' ')}</p>
                              </div>
                              {selected ? (
                                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      {teamMembers.filter(m => m.id !== user?.id && (
                        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        m.email.toLowerCase().includes(memberSearch.toLowerCase())
                      )).length === 0 && (
                        <p className="px-3 py-3 text-xs text-muted-foreground text-center">No users found</p>
                      )}
                    </div>
                  )}

                  {/* Selected Members */}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedMembers.map(id => {
                        const m = teamMembers.find(tm => tm.id === id);
                        if (!m) return null;
                        const isCreator = m.id === user?.id;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25"
                          >
                            {m.name.split(' ')[0]}
                            {isCreator && <span className="opacity-60">(you)</span>}
                            {!isCreator && (
                              <button type="button" onClick={() => toggleMember(id)} className="ml-0.5 hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Create Project
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
