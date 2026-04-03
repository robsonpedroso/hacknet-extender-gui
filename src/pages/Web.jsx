import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Network, Trash2, Pencil, ArrowRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import { useTranslation } from 'react-i18next';

const defaultLink = { source_node_id: '', target_node_id: '', position_near: '', position: 1, total: 1, extra_distance: 0.1, force: false };

export default function Web() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultLink);
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['links', selectedExt],
    queryFn: () => selectedExt ? db.entities.NodeLink.filter({ extension_id: selectedExt }) : db.entities.NodeLink.list(),
  });
  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes', selectedExt],
    queryFn: () => selectedExt ? db.entities.HacknetNode.filter({ extension_id: selectedExt }) : [],
    enabled: !!selectedExt,
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.NodeLink.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['links'] }); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.NodeLink.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['links'] }); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.NodeLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['links'] }),
  });

  const { t } = useTranslation();

  const close = () => { setShowForm(false); setEditing(null); setForm(defaultLink); };
  const openEdit = (l) => { setEditing(l); setForm({ ...defaultLink, ...l }); };
  const handleSubmit = () => {
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const getNodeName = (id) => nodes.find(n => n.node_id === id)?.name || id;

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title={t('web.title')}
        subtitle={t('web.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> {t('web.newLink')}
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={Network} title={t('web.selectExtension')} description={t('web.selectExtensionDesc')} />
        ) : links.length === 0 && !isLoading ? (
          <EmptyState icon={Network} title={t('web.noLinks')} description={t('web.noLinksDesc')} actionLabel={t('web.newLink')} onAction={() => setShowForm(true)} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {links.map(l => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-lg px-5 py-3 hover:border-primary/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <Network className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-foreground">{getNodeName(l.source_node_id)}</span>
                      <span className="text-muted-foreground font-mono text-xs">({l.source_node_id})</span>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span className="text-foreground">{getNodeName(l.target_node_id)}</span>
                      <span className="text-muted-foreground font-mono text-xs">({l.target_node_id})</span>
                    </div>
                    {l.position_near && (
                      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{t('web.near')} {l.position_near} {t('web.position')}:{l.position}/{l.total}</span>
                        {l.force && <span className="text-accent">[{t('web.forced')}]</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(l)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editing} onOpenChange={close}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans">{editing ? t('web.editLink') : t('web.newLink')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('web.sourceNode')}</Label>
                <Select value={form.source_node_id} onValueChange={v => upd('source_node_id', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder={t('web.selectNode')} /></SelectTrigger>
                  <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.node_id} className="font-mono text-xs">{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('web.targetNode')}</Label>
                <Select value={form.target_node_id} onValueChange={v => upd('target_node_id', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder={t('web.selectNode')} /></SelectTrigger>
                  <SelectContent>{nodes.filter(n => n.node_id !== form.source_node_id).map(n => <SelectItem key={n.id} value={n.node_id} className="font-mono text-xs">{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('web.mapPositioning')}</h4>
              <div>
                <Label className="font-mono text-xs">{t('web.positionNear')}</Label>
                <Select value={form.position_near} onValueChange={v => upd('position_near', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder={t('web.none')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null} className="font-mono text-xs">{t('web.none')}</SelectItem>
                    {nodes.map(n => <SelectItem key={n.id} value={n.node_id} className="font-mono text-xs">{n.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.position_near && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="font-mono text-xs">{t('web.position')}</Label>
                      <Input type="number" min={1} value={form.position} onChange={e => upd('position', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="font-mono text-xs">{t('web.totalAround')}</Label>
                      <Input type="number" min={1} value={form.total} onChange={e => upd('total', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
                    </div>
                    <div>
                      <Label className="font-mono text-xs">{t('web.extraDistance')}</Label>
                      <Input type="number" step="0.05" value={form.extra_distance} onChange={e => upd('extra_distance', parseFloat(e.target.value))} className="font-mono text-sm mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-mono text-xs">{t('web.forcePosition')}</Label>
                    <Switch checked={form.force} onCheckedChange={v => upd('force', v)} />
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} className="font-mono text-xs">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!form.source_node_id || !form.target_node_id} className="font-mono text-xs">{editing ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
        title={t('web.deleteConfirm')} />
    </div>
  );
}