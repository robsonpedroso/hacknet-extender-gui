import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color || "bg-primary/10")}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-sans font-bold text-foreground">{value}</p>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}