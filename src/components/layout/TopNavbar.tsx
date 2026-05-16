import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Command, X, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function TopNavbar() {
  const { searchQuery, setSearchQuery, setCommandOpen, activities, isPunchedIn, punchIn, punchOut, notifications, user } = useStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [punching, setPunching] = useState(false);

  const recentActivities = activities.slice(0, 5);
  const allNotifs = [...notifications.map(n => ({ id: n.id, title: n.message, time: n.timestamp, type: n.type })), ...recentActivities.map(a => ({ id: a.id, title: `${a.user.name} ${a.action}`, time: a.timestamp, type: 'info' as const }))].slice(0, 10);

  const handlePunch = async () => {
    setPunching(true);
    try {
      if (isPunchedIn) await punchOut();
      else await punchIn();
    } catch { /* handled */ }
    finally { setPunching(false); }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-background/50 backdrop-blur-xl z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <motion.div
          animate={{
            boxShadow: isSearchFocused ? '0 0 0 1px hsl(217 91% 60% / 0.3)' : 'none'
          }}
          className={cn(
            'relative flex items-center rounded-xl border transition-colors duration-200',
            isSearchFocused 
              ? 'border-blue-500/30 bg-white/[0.05]' 
              : 'border-white/[0.08] bg-white/[0.02]'
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks, projects, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandOpen(true);
              }
            }}
            className="w-full bg-transparent pl-9 pr-20 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-muted-foreground border border-white/[0.08]">
              <Command className="w-2.5 h-2.5 mr-0.5" />
              K
            </kbd>
          </div>
        </motion.div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Punch In/Out */}
        {(
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePunch}
            disabled={punching}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              isPunchedIn
                ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            {punching ? '...' : isPunchedIn ? 'Punch Out' : 'Punch In'}
          </motion.button>
        )}

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative p-2.5 rounded-xl transition-colors',
              showNotifications 
                ? 'bg-blue-500/10 text-blue-400' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
            )}
          >
            <Bell className="w-5 h-5" />
            {allNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-medium">
                {allNotifs.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 w-80 rounded-2xl bg-[#111827] border border-white/[0.08] shadow-2xl shadow-black/40 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    {allNotifs.length > 0 ? allNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-3 rounded-xl transition-colors',
                          notif.type === 'punch_in' ? 'bg-emerald-500/5' :
                          notif.type === 'punch_out' ? 'bg-blue-500/5' :
                          'hover:bg-white/[0.02]'
                        )}
                      >
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notif.time).toLocaleString()}
                        </p>
                      </div>
                    )) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
