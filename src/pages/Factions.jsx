import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Users, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';

const defaultFaction = { faction_id: '', name: '', player_value: 0, max_value: 100, neededValue: 0 };

export default function Factions() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editingFaction, setEditingFaction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultFaction);
  const queryClient = useQueryClient();

  const { data: factions = [], isLoading } = useQuery({
    queryKey: ['factions', selectedExt],
    queryFn: () => selectedExt ? db.entities.Faction.filter({ extension_id: selectedExt }) : db.entities.Faction.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Faction.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factions'] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Faction.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['factions'] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Faction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['factions'] }),
  });

  const closeDialog = () => { setShowForm(false); setEditingFaction(null); setForm(defaultFaction); };
  const openEdit = (f) => { setEditingFaction(f); setForm({ ...defaultFaction, ...f }); };
  const handleSubmit = () => {
    if (editingFaction) updateMut.mutate({ id: editingFaction.id, data: form });
    else createMut.mutate(form);
  };
  const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title="Facções"
        subtitle="Organizações e grupos da sua extensão"
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> Nova Facção
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={Users} title="Selecione uma extensão" description="Escolha uma extensão para gerenciar facções." />
        ) : factions.length === 0 && !isLoading ? (
          <EmptyState icon={Users} title="Nenhuma facção" description="Crie facções para sua extensão." actionLabel="Nova Facção" onAction={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {factions.map((f) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-sans font-semibold text-foreground text-sm">{f.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground">{f.faction_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Reputação Inicial</span>
                      <span className="text-foreground">{f.player_value || 0}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((f.player_value || 0) / (f.max_value || 100)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>0</span>
                      <span>Max: {f.max_value || 100}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="font-mono text-xs flex-1" onClick={() => openEdit(f)}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(f)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editingFaction} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingFaction ? 'Editar Facção' : 'Nova Facção'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">ID da Facção</Label>
                <Input value={form.faction_id} onChange={(e) => updateForm('faction_id', e.target.value)} placeholder="entropy" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Nome</Label>
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Entropy" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-mono text-xs">Valor Inicial</Label>
                <Input type="number" value={form.player_value} onChange={(e) => updateForm('player_value', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Valor Máximo</Label>
                <Input type="number" value={form.max_value} onChange={(e) => updateForm('max_value', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Valor Necessário</Label>
                <Input type="number" value={form.neededValue} onChange={(e) => updateForm('neededValue', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-mono text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.faction_id || !form.name} className="font-mono text-xs">{editingFaction ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} title={`Excluir facção "${deleteTarget?.name}"?`} />
    </div>
  );
}