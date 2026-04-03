import React from 'react';

export default function TerminalHeader({ title, subtitle, actions }) {
  return (
    <div className="border-b border-border px-6 py-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-xs">{'>'}_</span>
          <h1 className="text-xl font-sans font-bold text-foreground">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-1 ml-6">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}