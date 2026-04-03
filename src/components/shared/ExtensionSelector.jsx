import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/db/database';
import { useQuery } from '@tanstack/react-query';

export default function ExtensionSelector({ value, onChange }) {
  const { data: extensions = [] } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => db.entities.Extension.list('-created_date'),
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[240px] font-mono text-xs bg-card border-border">
        <SelectValue placeholder="Selecionar extensão..." />
      </SelectTrigger>
      <SelectContent>
        {extensions.map((ext) => (
          <SelectItem key={ext.id} value={ext.id} className="font-mono text-xs">
            {ext.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}