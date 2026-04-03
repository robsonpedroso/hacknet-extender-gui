import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, Target, Users, Download, ChevronLeft, ChevronRight, Terminal, Zap, User, Network, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navItems = [
  { path: '/', icon: LayoutDashboard, key: 'navigation.dashboard' },
  { path: '/nodes', icon: Server, key: 'navigation.nodes' },
  { path: '/people', icon: User, key: 'navigation.people' },
  { path: '/web', icon: Network, key: 'navigation.web' },
  { path: '/missions', icon: Target, key: 'navigation.missions' },
  { path: '/factions', icon: Users, key: 'navigation.factions' },
  { path: '/actions', icon: Zap, key: 'navigation.actions' },
  { path: '/hackerscripts', icon: Code, key: 'navigation.hackerScripts' },
  { path: '/export', icon: Download, key: 'navigation.export' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();

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
        {navItems.map(({ path, icon: Icon, key }) => {
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
              {!collapsed && <span>{t(key)}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-2 border-t border-border">
          <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
            <SelectTrigger className="w-full font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}