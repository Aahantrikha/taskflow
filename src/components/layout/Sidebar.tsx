import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Projects', icon: FolderKanban, path: '/projects' },
  { name: 'Tasks', icon: ListChecks, path: '/tasks' },
  { name: 'Team', icon: Users, path: '/team' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

const footerNav = [
  { name: 'Help & Support', icon: HelpCircle, path: '/settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, logout, user } = useStore();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-screen flex flex-col bg-[#0a0e1a]/80 backdrop-blur-2xl border-r border-white/[0.06] z-40"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-display font-bold text-lg text-foreground whitespace-nowrap"
              >
                TaskFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-card border border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-50 shadow-lg"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/10 rounded-xl border border-blue-500/20"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}

              {/* Hover indicator */}
              {!isActive && hoveredItem === item.name && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/[0.03] rounded-xl"
                  transition={{ duration: 0.15 }}
                />
              )}

              <Icon className={cn(
                'w-5 h-5 shrink-0 relative z-10',
                isActive && 'text-blue-400'
              )} />

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium relative z-10 whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active dot */}
              {isActive && !sidebarCollapsed && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        {footerNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
            >
              <Icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}

        {/* User section */}
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-300">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                    {user?.role === 'admin' && (
                      <Shield className="w-3 h-3 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role === 'admin' ? 'Admin' : user?.role === 'project_lead' ? 'Project Lead' : user?.role === 'quality_reviewer' ? 'Reviewer' : 'Tasker'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <LogOut className="w-4 h-4 shrink-0 opacity-50" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
