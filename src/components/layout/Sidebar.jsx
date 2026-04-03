import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, Target, Users, Download, ChevronLeft, ChevronRight, Terminal, Zap, User, Network, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/nodes', icon: Server, label: 'Nós' },
  { path: '/people', icon: User, label: 'People' },
  { path: '/web', icon: Network, label: 'Web' },
  { path: '/missions', icon: Target, label: 'Missões' },
  { path: '/factions', icon: Users, label: 'Facções' },
  { path: '/actions', icon: Zap, label: 'Actions' },
  { path: '/hackerscripts', icon: Code, label: 'HackerScripts' },
  { path: '/export', icon: Download, label: 'Exportar' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border z-50 flex flex-col"
    >
      <div className="p-4 flex items-center gap-3 border-b border-border min-h-[64px]">
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-sm font-bold text-primary tracking-wider"
          >
            HACKNET_EXT
          </motion.span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono transition-all',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}