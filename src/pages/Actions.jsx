import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import { useTranslation } from 'react-i18next';

const ACTION_TYPES = [
  'LoadMission', 'RunFunction', 'AddAsset', 'CopyAsset',
  'AddMissionToHubServer', 'RemoveMissionFromHubServer',
  'AddIRCMessage', 'CrashComputer', 'DeleteFile',
  'SwitchToTheme', 'LaunchHackScript', 'StartScreenBleedEffect',
  'CancelScreenBleedEffect', 'AppendToFile', 'KillExe', 'AddConditionalActions',
];

const ACTION_COLORS = {
  LoadMission: 'bg-primary/20 text-primary',
  RunFunction: 'bg-accent/20 text-accent',
  AddAsset: 'bg-blue-500/20 text-blue-400',
  CopyAsset: 'bg-blue-500/20 text-blue-400',
  CrashComputer: 'bg-destructive/20 text-destructive',
  DeleteFile: 'bg-destructive/20 text-destructive',
  SwitchToTheme: 'bg-purple-500/20 text-purple-400',
  LaunchHackScript: 'bg-orange-500/20 text-orange-400',
  StartScreenBleedEffect: 'bg-red-700/20 text-red-400',
  KillExe: 'bg-destructive/20 text-destructive',
};

const defaultAction = {
  value_required: 0, action_type: 'LoadMission', delay: 0, delay_host: '', target_comp: '',
  mission_filepath: '', function_name: '', function_value: '', file_name: '', file_contents: '',
  file_path: '', source_comp: '', source_file_name: '', source_file_path: '', theme_path: '',
  flicker_duration: 1.0, script_filepath: '', require_logs_on_source: false,
  alert_title: '', total_duration: 10, content: '', exe_name: '', irc_author: '',
  faction_id: '', assignment_tag: '',
};

function ActionFields({ form, updateForm, factions }) {
  const { t } = useTranslation();
  const actionType = form.action_type;
  return (
    <div className="space-y-3">
      {/* Common: delay + delay_host + target_comp */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="font-mono text-xs">{t('actions.delay')}</Label>
          <Input type="number" step="0.1" value={form.delay} onChange={e => updateForm('delay', parseFloat(e.target.value))} className="font-mono text-sm mt-1" />
        </div>
        <div>
          <Label className="font-mono text-xs">{t('actions.delayHost')}</Label>
          <Input value={form.delay_host} onChange={e => updateForm('delay_host', e.target.value)} placeholder="advExamplePC" className="font-mono text-sm mt-1" />
        </div>
        <div>
          <Label className="font-mono text-xs">{t('actions.faction')}</Label>
          <Select value={form.faction_id} onValueChange={v => updateForm('faction_id', v)}>
            <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null} className="font-mono text-xs">Qualquer</SelectItem>
              {factions.map(f => <SelectItem key={f.id} value={f.faction_id} className="font-mono text-xs">{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(t === 'LoadMission') && (
        <div><Label className="font-mono text-xs">Caminho da Missão</Label>
          <Input value={form.mission_filepath} onChange={e => updateForm('mission_filepath', e.target.value)} placeholder="Missions/MyMission.xml" className="font-mono text-sm mt-1" /></div>
      )}

      {(t === 'RunFunction') && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-mono text-xs">Nome da Função</Label>
            <Input value={form.function_name} onChange={e => updateForm('function_name', e.target.value)} placeholder="changeSong" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">Valor</Label>
            <Input value={form.function_value} onChange={e => updateForm('function_value', e.target.value)} placeholder="6" className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {(t === 'AddAsset') && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">Nome do Arquivo</Label>
              <Input value={form.file_name} onChange={e => updateForm('file_name', e.target.value)} placeholder="MemForensics.exe" className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">Caminho no Nó</Label>
              <Input value={form.file_path} onChange={e => updateForm('file_path', e.target.value)} placeholder="bin" className="font-mono text-sm mt-1" /></div>
          </div>
          <div><Label className="font-mono text-xs">Conteúdo (pode usar wildcards)</Label>
            <Input value={form.file_contents} onChange={e => updateForm('file_contents', e.target.value)} placeholder="#MEM_FORENSICS_EXE#" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">Nó Alvo (ID)</Label>
            <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} placeholder="advExamplePC" className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {(t === 'CopyAsset') && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">Nó Destino</Label>
              <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">Caminho Destino</Label>
              <Input value={form.file_path} onChange={e => updateForm('file_path', e.target.value)} className="font-mono text-sm mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="font-mono text-xs">Nó Fonte</Label>
              <Input value={form.source_comp} onChange={e => updateForm('source_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">Arquivo Fonte</Label>
              <Input value={form.source_file_name} onChange={e => updateForm('source_file_name', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">Caminho Fonte</Label>
              <Input value={form.source_file_path} onChange={e => updateForm('source_file_path', e.target.value)} className="font-mono text-sm mt-1" /></div>
          </div>
        </div>
      )}

      {(t === 'AddMissionToHubServer' || t === 'RemoveMissionFromHubServer') && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-mono text-xs">Caminho da Missão</Label>
            <Input value={form.mission_filepath} onChange={e => updateForm('mission_filepath', e.target.value)} placeholder="Missions/MyMission.xml" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">Nó Alvo</Label>
            <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
        </div>
      )}
      {t === 'AddMissionToHubServer' && (
        <div><Label className="font-mono text-xs">Assignment Tag (opcional)</Label>
          <Input value={form.assignment_tag} onChange={e => updateForm('assignment_tag', e.target.value)} placeholder="top ou ID de usuário" className="font-mono text-sm mt-1" /></div>
      )}

      {t === 'AddIRCMessage' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">Autor</Label>
              <Input value={form.irc_author} onChange={e => updateForm('irc_author', e.target.value)} placeholder="HA0" className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">Nó Alvo</Label>
              <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
          </div>
          <div><Label className="font-mono text-xs">Mensagem</Label>
            <Textarea value={form.content} onChange={e => updateForm('content', e.target.value)} placeholder="Hey @#PLAYERNAME#..." className="font-mono text-sm mt-1 h-16" /></div>
        </div>
      )}

      {(form.action_type === 'CrashComputer') && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-mono text-xs">{t('actions.targetComp')}</Label>
            <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} placeholder="playerComp" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">{t('actions.sourceComp')}</Label>
            <Input value={form.source_comp} onChange={e => updateForm('source_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {form.action_type === 'DeleteFile' && (
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="font-mono text-xs">{t('actions.targetComp')}</Label>
            <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">{t('actions.filePath')}</Label>
            <Input value={form.file_path} onChange={e => updateForm('file_path', e.target.value)} placeholder="bin" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">{t('actions.fileName')}</Label>
            <Input value={form.file_name} onChange={e => updateForm('file_name', e.target.value)} className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {form.action_type === 'SwitchToTheme' && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="font-mono text-xs">{t('actions.themePath')}</Label>
            <Input value={form.theme_path} onChange={e => updateForm('theme_path', e.target.value)} placeholder="HackerGreen" className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">{t('actions.flickerDuration')}</Label>
            <Input type="number" step="0.5" value={form.flicker_duration} onChange={e => updateForm('flicker_duration', parseFloat(e.target.value))} className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {form.action_type === 'LaunchHackScript' && (
        <div className="space-y-3">
          <div><Label className="font-mono text-xs">{t('actions.scriptFilepath')}</Label>
            <Input value={form.script_filepath} onChange={e => updateForm('script_filepath', e.target.value)} placeholder="HackerScripts/ExampleHack.txt" className="font-mono text-sm mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">{t('actions.sourceComp')}</Label>
              <Input value={form.source_comp} onChange={e => updateForm('source_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">{t('actions.targetComp')}</Label>
              <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} placeholder="playerComp" className="font-mono text-sm mt-1" /></div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-mono text-xs">{t('actions.requireLogsOnSource')}</Label>
            <Switch checked={form.require_logs_on_source} onCheckedChange={v => updateForm('require_logs_on_source', v)} />
          </div>
        </div>
      )}

      {form.action_type === 'StartScreenBleedEffect' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">{t('actions.alertTitle')}</Label>
              <Input value={form.alert_title} onChange={e => updateForm('alert_title', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">{t('actions.totalDuration')}</Label>
              <Input type="number" value={form.total_duration} onChange={e => updateForm('total_duration', parseFloat(e.target.value))} className="font-mono text-sm mt-1" /></div>
          </div>
          <div><Label className="font-mono text-xs">{t('actions.content')}</Label>
            <Textarea value={form.content} onChange={e => updateForm('content', e.target.value)} className="font-mono text-sm mt-1 h-16" /></div>
        </div>
      )}

      {(form.action_type === 'AppendToFile') && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="font-mono text-xs">{t('actions.targetComp')}</Label>
              <Input value={form.target_comp} onChange={e => updateForm('target_comp', e.target.value)} className="font-mono text-sm mt-1" /></div>
            <div><Label className="font-mono text-xs">{t('actions.fileName')}</Label>
              <Input value={form.file_name} onChange={e => updateForm('file_name', e.target.value)} className="font-mono text-sm mt-1" /></div>
          </div>
          <div><Label className="font-mono text-xs">{t('actions.filePath')}</Label>
            <Input value={form.file_path} onChange={e => updateForm('file_path', e.target.value)} className="font-mono text-sm mt-1" /></div>
          <div><Label className="font-mono text-xs">{t('actions.contentToAdd')}</Label>
            <Input value={form.content} onChange={e => updateForm('content', e.target.value)} placeholder="#PLAYER_IP#" className="font-mono text-sm mt-1" /></div>
        </div>
      )}

      {form.action_type === 'KillExe' && (
        <div><Label className="font-mono text-xs">{t('actions.exeName')}</Label>
          <Input value={form.exe_name} onChange={e => updateForm('exe_name', e.target.value)} placeholder="ssh" className="font-mono text-sm mt-1" /></div>
      )}

      {form.action_type === 'AddConditionalActions' && (
        <div><Label className="font-mono text-xs">{t('actions.actionsFilePath')}</Label>
          <Input value={form.script_filepath} onChange={e => updateForm('script_filepath', e.target.value)} placeholder="Actions/MyActions.xml" className="font-mono text-sm mt-1" /></div>
      )}
    </div>
  );
}

export default function Actions() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultAction);
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['actions', selectedExt],
    queryFn: () => selectedExt ? db.entities.NodeAction.filter({ extension_id: selectedExt }) : db.entities.NodeAction.list(),
  });
  const { data: factions = [] } = useQuery({
    queryKey: ['factions', selectedExt],
    queryFn: () => selectedExt ? db.entities.Faction.filter({ extension_id: selectedExt }) : [],
    enabled: !!selectedExt,
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.NodeAction.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actions'] }); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.NodeAction.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['actions'] }); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.NodeAction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(defaultAction); };
  const openEdit = (a) => { setEditing(a); setForm({ ...defaultAction, ...a }); };
  const handleSubmit = () => {
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };
  const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title={t('actions.title')}
        subtitle={t('actions.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> {t('actions.newAction')}
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={Zap} title={t('actions.selectExtension')} description={t('actions.selectExtensionDesc')} />
        ) : actions.length === 0 && !isLoading ? (
          <EmptyState icon={Zap} title={t('actions.noActions')} description={t('actions.noActionsDesc')} actionLabel={t('actions.newAction')} onAction={() => setShowForm(true)} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {actions.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-lg px-5 py-3 hover:border-primary/30 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                    <Badge className={`font-mono text-[10px] flex-shrink-0 ${ACTION_COLORS[a.action_type] || 'bg-muted text-muted-foreground'}`}>{a.action_type}</Badge>
                    {a.faction_id && <span className="font-mono text-xs text-muted-foreground truncate">{t('actions.faction')}: {a.faction_id}</span>}
                    <span className="font-mono text-xs text-muted-foreground">val≥{a.value_required ?? 0}</span>
                    {a.delay > 0 && <span className="font-mono text-xs text-muted-foreground">+{a.delay}s</span>}
                    {a.target_comp && <span className="font-mono text-xs text-muted-foreground truncate">→ {a.target_comp}</span>}
                    {a.mission_filepath && <span className="font-mono text-xs text-muted-foreground truncate">{a.mission_filepath}</span>}
                    {a.theme_path && <span className="font-mono text-xs text-muted-foreground">{a.theme_path}</span>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editing} onOpenChange={close}>
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editing ? t('actions.editAction') : t('actions.newAction')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('actions.actionType')}</Label>
                <Select value={form.action_type} onValueChange={v => updateForm('action_type', v)}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t} value={t} className="font-mono text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('actions.valueRequired')}</Label>
                <Input type="number" value={form.value_required} onChange={e => updateForm('value_required', parseInt(e.target.value))} className="font-mono text-sm mt-1" />
              </div>
            </div>
            <ActionFields form={form} updateForm={updateForm} factions={factions} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} className="font-mono text-xs">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} className="font-mono text-xs">{editing ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
        title={t('actions.deleteConfirm', { actionType: deleteTarget?.action_type })} />
    </div>
  );
}