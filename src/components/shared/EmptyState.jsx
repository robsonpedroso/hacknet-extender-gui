import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-sans font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="font-mono text-xs gap-2">
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}