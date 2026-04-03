import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Server, Trash2, Pencil, Shield, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';

const defaultNode = { node_id: '', name: '', ip: '', security_level: 1, ports_required: 0, ports: [], admin_pass: '', has_proxy: false, proxy_time: -1, has_firewall: false, firewall_level: -1, trace_time: -1, icon: 'laptop', node_type: 'standard', files: [] };
const iconOptions = ['laptop', 'chip', 'server', 'homepc', 'terminal', 'ePhone'];
const typeOptions = ['standard', 'corporate', 'government', 'medical', 'isp', 'empty'];

export default function Nodes() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultNode);
  const queryClient = useQueryClient();

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['nodes', selectedExt],
    queryFn: () => selectedExt ? db.entities.HacknetNode.filter({ extension_id: selectedExt }) : db.entities.HacknetNode.list(),
    enabled: true,
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.HacknetNode.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nodes'] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.HacknetNode.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nodes'] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.HacknetNode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nodes'] }),
  });

  const closeDialog = () => { setShowForm(false); setEditingNode(null); setForm(defaultNode); };
  const openEdit = (node) => { setEditingNode(node); setForm({ ...defaultNode, ...node, ports: node.ports || [], files: node.files || [] }); };
  const handleSubmit = () => {
    if (editingNode) updateMut.mutate({ id: editingNode.id, data: form });
    else createMut.mutate(form);
  };
  const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title="Nós de Rede"
        subtitle="Computadores e servidores da sua extensão"
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> Novo Nó
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={Server} title="Selecione uma extensão" description="Escolha uma extensão acima para ver e gerenciar seus nós." />
        ) : nodes.length === 0 && !isLoading ? (
          <EmptyState icon={Server} title="Nenhum nó" description="Adicione computadores à rede da sua extensão." actionLabel="Novo Nó" onAction={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {nodes.map((node) => (
                <motion.div key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Server className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-sans font-semibold text-foreground text-sm">{node.name}</h3>
                        <p className="text-xs font-mono text-muted-foreground">{node.ip || node.node_id}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">{node.node_type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Seg: {node.security_level}</span>
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Portas: {node.ports_required}</span>
                    {node.has_proxy && <Badge className="bg-accent/20 text-accent text-[10px]">Proxy</Badge>}
                    {node.has_firewall && <Badge className="bg-destructive/20 text-destructive text-[10px]">Firewall</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="font-mono text-xs flex-1" onClick={() => openEdit(node)}>
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(node)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editingNode} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingNode ? 'Editar Nó' : 'Novo Nó'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">ID do Nó</Label>
                <Input value={form.node_id} onChange={(e) => updateForm('node_id', e.target.value)} placeholder="advExNode01" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Nome</Label>
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Servidor Corp" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">IP</Label>
                <Input value={form.ip} onChange={(e) => updateForm('ip', e.target.value)} placeholder="100.100.100.10" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Senha Admin</Label>
                <Input value={form.admin_pass} onChange={(e) => updateForm('admin_pass', e.target.value)} placeholder="password" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-mono text-xs">Segurança</Label>
                <Input type="number" min={1} max={5} value={form.security_level} onChange={(e) => updateForm('security_level', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Portas Req.</Label>
                <Input type="number" min={0} value={form.ports_required} onChange={(e) => updateForm('ports_required', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Trace Time</Label>
                <Input type="number" value={form.trace_time} onChange={(e) => updateForm('trace_time', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Campos do arquivo de nó (BlankExtension)</h4>
              <div>
                <Label className="font-mono text-xs">Portas</Label>
                <Input
                  value={(form.ports || []).map(p => p.port_number).join(',')}
                  onChange={(e) => updateForm('ports', e.target.value.split(',').map(v => parseInt(v.trim())).filter(n => !Number.isNaN(n)).map(pn => ({ port_number: pn, cracked: false })))}
                  placeholder="22,21,25"
                  className="font-mono text-sm mt-1"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">Arquivos (path|name|content por linha)</Label>
                <Textarea
                  value={(form.files || []).map(f => `${f.path || 'home'}|${f.name}|${f.content || ''}`).join('\n')}
                  onChange={(e) => updateForm('files', e.target.value.split('\n').filter(Boolean).map(line => {
                    const [path = 'home', name = '', content = ''] = line.split('|');
                    return { path: path.trim(), name: name.trim(), content: content.trim() };
                  }))}
                  className="font-mono text-sm mt-1 h-24"
                />
                <p className="text-[10px] text-muted-foreground">Formato: path|name|content (cada arquivo em uma linha)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">Ícone</Label>
                <Select value={form.icon} onValueChange={(v) => updateForm('icon', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i} className="font-mono text-xs">{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">Tipo</Label>
                <Select value={form.node_type} onValueChange={(v) => updateForm('node_type', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{typeOptions.map(t => <SelectItem key={t} value={t} className="font-mono text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs">Proxy</Label>
                <Switch checked={form.has_proxy} onCheckedChange={(v) => updateForm('has_proxy', v)} />
              </div>
              {form.has_proxy && (
                <div>
                  <Label className="font-mono text-xs">Tempo do Proxy (s)</Label>
                  <Input type="number" value={form.proxy_time} onChange={(e) => updateForm('proxy_time', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs">Firewall</Label>
                <Switch checked={form.has_firewall} onCheckedChange={(v) => updateForm('has_firewall', v)} />
              </div>
              {form.has_firewall && (
                <div>
                  <Label className="font-mono text-xs">Nível do Firewall</Label>
                  <Input type="number" value={form.firewall_level} onChange={(e) => updateForm('firewall_level', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-mono text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.node_id || !form.name} className="font-mono text-xs">{editingNode ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} title={`Excluir nó "${deleteTarget?.name}"?`} />
    </div>
  );
}