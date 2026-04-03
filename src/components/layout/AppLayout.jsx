import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <motion.main
        animate={{ marginLeft: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}