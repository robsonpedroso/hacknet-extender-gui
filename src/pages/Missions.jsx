import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Trash2, Pencil, Mail, ArrowRight, List, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import MissionGraph from '@/components/missions/MissionGraph';
import { useTranslation } from 'react-i18next';

const defaultMission = { mission_id: '', title: '', posting_title: '', description: '', posting: '', email_sender: '', email_subject: '', email_body: '', email_attachments: [], mission_start: '', mission_end: '', target_node_id: '', goal_type: 'filedownload', goal_file: '', goal_path: '', goal_keyword: '', next_mission_id: '', faction_id: '', required_rank: 0 };
const goalTypes = ['filedownload', 'filedelete', 'filechange', 'getadmin', 'getstring', 'delay', 'hasflag'];

export default function Missions() {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultMission);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'graph'
  const queryClient = useQueryClient();

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', selectedExt],
    queryFn: () => selectedExt ? db.entities.Mission.filter({ extension_id: selectedExt }) : db.entities.Mission.list(),
  });
  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes', selectedExt],
    queryFn: () => selectedExt ? db.entities.HacknetNode.filter({ extension_id: selectedExt }) : [],
    enabled: !!selectedExt,
  });
  const { data: factions = [] } = useQuery({
    queryKey: ['factions', selectedExt],
    queryFn: () => selectedExt ? db.entities.Faction.filter({ extension_id: selectedExt }) : [],
    enabled: !!selectedExt,
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Mission.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['missions'] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Mission.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['missions'] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Mission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  });

  const closeDialog = () => { setShowForm(false); setEditingMission(null); setForm(defaultMission); };
  const openEdit = (m) => { setEditingMission(m); setForm({ ...defaultMission, ...m }); setViewMode('list'); };
  const handleSubmit = () => {
    if (editingMission) updateMut.mutate({ id: editingMission.id, data: form });
    else createMut.mutate(form);
  };
  const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title={t('missions.title')}
        subtitle={t('missions.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            {selectedExt && missions.length > 0 && (
              <div className="flex items-center bg-secondary rounded-md p-0.5 border border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List className="w-3.5 h-3.5" /> {t('missions.listView')}
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${viewMode === 'graph' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <GitBranch className="w-3.5 h-3.5" /> {t('missions.graphView')}
                </button>
              </div>
            )}
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> {t('missions.newMission')}
            </Button>
          </div>
        }
      />

      {viewMode === 'graph' && selectedExt ? (
        <div style={{ height: 'calc(100vh - 72px)' }} className="relative">
          <MissionGraph
            missions={missions}
            selectedExt={selectedExt}
            onEditMission={openEdit}
          />
        </div>
      ) : (
        <div className="p-6">
          {!selectedExt ? (
            <EmptyState icon={Target} title={t('missions.selectExtension')} description={t('missions.selectExtensionDesc')} />
          ) : missions.length === 0 && !isLoading ? (
            <EmptyState icon={Target} title={t('missions.noMissions')} description={t('missions.noMissionsDesc')} actionLabel={t('missions.newMission')} onAction={() => setShowForm(true)} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {missions.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-primary flex-shrink-0" />
                          <h3 className="font-sans font-semibold text-foreground text-sm">{m.title}</h3>
                          <Badge variant="outline" className="font-mono text-[10px]">{m.mission_id}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6 mb-2">{m.description || 'Sem descrição'}</p>
                        <div className="flex items-center gap-3 ml-6 text-xs font-mono text-muted-foreground">
                          <Badge className="bg-accent/20 text-accent text-[10px]">{t(`missions.goals.${m.goal_type}`)}</Badge>
                          {m.email_sender && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email_sender}</span>}
                          {m.next_mission_id && <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />→ {m.next_mission_id}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm || !!editingMission} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingMission ? t('missions.editMission') : t('missions.newMission')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('missions.missionId')}</Label>
                <Input value={form.mission_id} onChange={(e) => updateForm('mission_id', e.target.value)} placeholder="mission_01" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">{t('missions.title')}</Label>
                <Input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Primeira Missão" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs">{t('missions.description')}</Label>
              <Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Detalhes da missão..." className="font-mono text-sm mt-1 h-16" />
            </div>
            <div>
              <Label className="font-mono text-xs">{t('missions.postingTitle')}</Label>
              <Input value={form.posting_title} onChange={(e) => updateForm('posting_title', e.target.value)} placeholder="Título do board" className="font-mono text-sm mt-1" />
            </div>
            <div>
              <Label className="font-mono text-xs">{t('missions.posting')}</Label>
              <Textarea value={form.posting} onChange={(e) => updateForm('posting', e.target.value)} placeholder="Texto que aparece no board de missões..." className="font-mono text-sm mt-1 h-16" />
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Email</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">{t('missions.emailSender')}</Label>
                  <Input value={form.email_sender} onChange={(e) => updateForm('email_sender', e.target.value)} placeholder="Anônimo" className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">{t('missions.emailSubject')}</Label>
                  <Input value={form.email_subject} onChange={(e) => updateForm('email_subject', e.target.value)} placeholder="Missão importante" className="font-mono text-sm mt-1" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('missions.emailBody')}</Label>
                <Textarea value={form.email_body} onChange={(e) => updateForm('email_body', e.target.value)} placeholder="Conteúdo do email..." className="font-mono text-sm mt-1 h-16" />
              </div>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Objetivo</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">{t('missions.goalType')}</Label>
                  <Select value={form.goal_type} onValueChange={(v) => updateForm('goal_type', v)}>
                    <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{goalTypes.map(g => <SelectItem key={g} value={g} className="font-mono text-xs">{t(`missions.goals.${g}`)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-xs">{t('missions.targetNode')}</Label>
                  <Select value={form.target_node_id} onValueChange={(v) => updateForm('target_node_id', v)}>
                    <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>{nodes.map(n => <SelectItem key={n.id} value={n.node_id} className="font-mono text-xs">{n.name} ({n.node_id})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="font-mono text-xs">{t('missions.goalFile')}</Label>
                  <Input value={form.goal_file} onChange={(e) => updateForm('goal_file', e.target.value)} placeholder="secret.txt" className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">{t('missions.goalPath')}</Label>
                  <Input value={form.goal_path} onChange={(e) => updateForm('goal_path', e.target.value)} placeholder="/home" className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">{t('missions.goalKeyword')}</Label>
                  <Input value={form.goal_keyword} onChange={(e) => updateForm('goal_keyword', e.target.value)} className="font-mono text-sm mt-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('missions.missionStart')}</Label>
                <Input value={form.mission_start} onChange={(e) => updateForm('mission_start', e.target.value)} placeholder="Actions/StartingActions.xml" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">{t('missions.missionEnd')}</Label>
                <Input value={form.mission_end} onChange={(e) => updateForm('mission_end', e.target.value)} placeholder="Missions/EndActions.xml" className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 space-y-3">
              <Label className="font-mono text-xs">{t('missions.emailAttachments')}</Label>
              <Textarea value={(form.email_attachments || []).join('\n')} onChange={(e) => updateForm('email_attachments', e.target.value.split('\n').filter(Boolean))} className="font-mono text-sm mt-1 h-20" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('missions.nextMission')}</Label>
                <Select value={form.next_mission_id} onValueChange={(v) => updateForm('next_mission_id', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null} className="font-mono text-xs">Nenhuma</SelectItem>
                    {missions.filter(m => m.mission_id !== form.mission_id).map(m => <SelectItem key={m.id} value={m.mission_id} className="font-mono text-xs">{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('missions.faction')}</Label>
                <Select value={form.faction_id} onValueChange={(v) => updateForm('faction_id', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null} className="font-mono text-xs">Nenhuma</SelectItem>
                    {factions.map(f => <SelectItem key={f.id} value={f.faction_id} className="font-mono text-xs">{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('missions.requiredRank')}</Label>
                <Input type="number" min={0} value={form.required_rank} onChange={(e) => updateForm('required_rank', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-mono text-xs">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!form.mission_id || !form.title} className="font-mono text-xs">{editingMission ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} title={`${t('missions.deleteMission')} "${deleteTarget?.title}"?`} />
    </div>
  );
}