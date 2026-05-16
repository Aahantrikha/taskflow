import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import StaggeredMenu from '@/components/custom/StaggeredMenu';

export function AppLayout() {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard', onClick: () => navigate('/dashboard') },
    { label: 'Projects', ariaLabel: 'View projects', link: '/projects', onClick: () => navigate('/projects') },
    { label: 'Tasks', ariaLabel: 'View tasks', link: '/tasks', onClick: () => navigate('/tasks') },
    { label: 'Team', ariaLabel: 'View team', link: '/team', onClick: () => navigate('/team') },
    { label: 'Settings', ariaLabel: 'Settings', link: '/settings', onClick: () => navigate('/settings') },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile StaggeredMenu */}
      <div className="md:hidden">
        <StaggeredMenu
          position="left"
          items={menuItems}
          displaySocials={false}
          displayItemNumbering={true}
          menuButtonColor="#fff"
          openMenuButtonColor="#fff"
          changeMenuColorOnOpen={true}
          colors={['#0a0e1a', '#1e1b4b']}
          accentColor="#3b82f6"
          isFixed={true}
          closeOnClickAway={true}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto scrollbar-thin"
        >
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
