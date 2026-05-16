import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  MoreHorizontal,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRole } from '@/hooks/useRole';
import { GlassCard } from '@/components/custom/GlassCard';
import { ProgressBar } from '@/components/custom/ProgressBar';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { UserAvatar } from '@/components/custom/UserAvatar';
import { ProjectDialog } from '@/components/custom/ProjectDialog';
import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';

const statusFilters: { value: ProjectStatus | 'all'; label: string; icon: typeof CheckCircle2 }[] = [
  { value: 'all', label: 'All Projects', icon: FolderKanban },
  { value: 'active', label: 'Active', icon: TrendingUp },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'on_hold', label: 'On Hold', icon: PauseCircle },
  { value: 'cancelled', label: 'Cancelled', icon: AlertCircle },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

export default function Projects() {
  const { projects, user } = useStore();
  const { canManageProjects } = useRole();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Members only see projects they are a member of
  const visibleProjects = canManageProjects
    ? projects
    : projects.filter(p => p.members.some(m => m.id === user?.id));

  const filteredProjects = visibleProjects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your team's projects
          </p>
        </div>
        {canManageProjects && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setProjectDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </motion.button>
        )}
      </motion.div>

      {/* Filters and Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          {statusFilters.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  filter === s.value
                    ? 'bg-white/[0.08] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
            />
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <AnimatePresence mode="wait">
        {filteredProjects.length > 0 ? (
          <motion.div
            key="projects-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                layout
                transition={{ duration: 0.3 }}
              >
                <GlassCard hover delay={index * 0.05} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer">
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} type="project" />
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                        title="Manage project"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold mb-1.5">{project.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{project.progress}%</span>
                    </div>
                    <ProgressBar
                      progress={project.progress}
                      color={project.color}
                      height="h-2"
                      showLabel={false}
                      delay={0.1}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {project.completedTasks}/{project.taskCount} tasks
                    </span>
                    {project.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Members */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((member) => (
                        <UserAvatar key={member.id} user={member} size="sm" />
                      ))}
                      {project.members.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] text-muted-foreground ring-2 ring-background">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.members.length} members
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search or filters' 
                : 'Create your first project to get started'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Dialog — admin only */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
      />
    </motion.div>
  );
}
