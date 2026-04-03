import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Trash2, Pencil, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';

const ACCOUNT_TYPES = ['ADMIN', 'ALL', 'MAIL', 'MISSIONLIST'];
const TYPE_LABELS = { ADMIN: 'Administrador', ALL: 'Completo', MAIL: 'Email', MISSIONLIST: 'Lista Missões' };
const TYPE_COLORS = { ADMIN: 'bg-destructive/20 text-destructive', ALL: 'bg-primary/20 text-primary', MAIL: 'bg-accent/20 text-accent', MISSIONLIST: 'bg-blue-500/20 text-blue-400' };

const defaultPerson = { node_id: '', username: '', password: '', account_type: 'ALL' };

export default function People() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultPerson);
  const queryClient = useQueryClient();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people', selectedExt],
    queryFn: () => selectedExt ? db.entities.NodePerson.filter({ extension_id: selectedExt }) : db.entities.NodePerson.list(),
  });
  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes', selectedExt],
    queryFn: () => selectedExt ? db.entities.HacknetNode.filter({ extension_id: selectedExt }) : [],
    enabled: !!selectedExt,
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.NodePerson.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['people'] }); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.NodePerson.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['people'] }); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.NodePerson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(defaultPerson); };
  const openEdit = (p) => { setEditing(p); setForm({ ...defaultPerson, ...p }); };
  const handleSubmit = () => {
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  // Group by node
  const grouped = nodes.reduce((acc, n) => {
    acc[n.node_id] = { node: n, people: people.filter(p => p.node_id === n.node_id) };
    return acc;
  }, {});
  const ungrouped = people.filter(p => !nodes.find(n => n.node_id === p.node_id));

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title="People"
        subtitle="Contas de usuário nos computadores da rede"
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> Nova Conta
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={User} title="Selecione uma extensão" description="Escolha uma extensão para gerenciar contas de usuário." />
        ) : people.length === 0 && !isLoading ? (
          <EmptyState icon={User} title="Nenhuma conta" description="Adicione contas de usuário aos computadores da rede." actionLabel="Nova Conta" onAction={() => setShowForm(true)} />
        ) : (
          <div className="space-y-4">
            {/* Grouped by node */}
            {Object.values(grouped).filter(g => g.people.length > 0).map(({ node, people: nodePeople }) => (
              <div key={node.node_id} className="space-y-2">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />
                  {node.name} <span className="text-muted-foreground/50">({node.node_id})</span>
                </h3>
                <AnimatePresence>
                  {nodePeople.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-mono text-sm text-foreground">{p.username}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground">{p.password}</span>
                          </div>
                        </div>
                        <Badge className={`font-mono text-[10px] ml-2 ${TYPE_COLORS[p.account_type] || ''}`}>
                          {TYPE_LABELS[p.account_type] || p.account_type}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Sem nó associado</h3>
                <AnimatePresence>
                  {ungrouped.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{p.username}</span>
                        <span className="font-mono text-xs text-muted-foreground">{p.node_id}</span>
                        <Badge className={`font-mono text-[10px] ${TYPE_COLORS[p.account_type] || ''}`}>{p.account_type}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editing} onOpenChange={close}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">{editing ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-xs">Nó (computador)</Label>
              <Select value={form.node_id} onValueChange={v => setForm(p => ({ ...p, node_id: v }))}>
                <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder="Selecionar nó..." /></SelectTrigger>
                <SelectContent>
                  {nodes.map(n => <SelectItem key={n.id} value={n.node_id} className="font-mono text-xs">{n.name} ({n.node_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">Usuário</Label>
                <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Matt" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Senha</Label>
                <Input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="testpass" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs">Tipo de Conta</Label>
              <Select value={form.account_type} onValueChange={v => setForm(p => ({ ...p, account_type: v }))}>
                <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="font-mono text-xs">
                      {t} — {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} className="font-mono text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.node_id || !form.username || !form.password} className="font-mono text-xs">{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
        title={`Excluir conta "${deleteTarget?.username}"?`} />
    </div>
  );
}