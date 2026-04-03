import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Server, Target, Users, Trash2, Pencil, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import StatCard from '@/components/shared/StatCard';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import { useTranslation } from 'react-i18next';

const statusLabels = { draft: 'Rascunho', in_progress: 'Em Progresso', completed: 'Completa' };
const statusColors = { draft: 'bg-muted text-muted-foreground', in_progress: 'bg-accent/20 text-accent', completed: 'bg-primary/20 text-primary' };

export default function Dashboard() {
  const { t } = useTranslation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingExt, setEditingExt] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    language: 'en-us',
    starting_theme: 'green',
    starting_music: '',
    starting_mission_id: '',
    player_comp_name: 'PlayerComp',
    allow_saves: true,
    starting_visible_nodes: '',
    starting_actions: '',
    faction: '',
    starts_with_tutorial: false,
    has_intro_startup: false,
    intro_startup_song: '',
    workshop_description: '',
    workshop_language: 'English',
    workshop_visibility: '2',
    workshop_tags: 'Extension',
    workshop_preview_image_path: 'Logo.png',
    workshop_publish_id: 'NONE',
    status: 'draft'
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: extensions = [], isLoading } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => db.entities.Extension.list('-created_date'),
  });
  const { data: nodes = [] } = useQuery({ queryKey: ['nodes'], queryFn: () => db.entities.HacknetNode.list() });
  const { data: missions = [] } = useQuery({ queryKey: ['missions'], queryFn: () => db.entities.Mission.list() });
  const { data: factions = [] } = useQuery({ queryKey: ['factions'], queryFn: () => db.entities.Faction.list() });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Extension.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['extensions'] }); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Extension.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['extensions'] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Extension.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extensions'] }),
  });

  const closeDialog = () => {
    setShowCreate(false);
    setEditingExt(null);
    setForm({
      name: '',
      description: '',
      language: 'en-us',
      starting_theme: 'green',
      starting_music: '',
      starting_mission_id: '',
      player_comp_name: 'PlayerComp',
      allow_saves: true,
      starting_visible_nodes: '',
      starting_actions: '',
      faction: '',
      starts_with_tutorial: false,
      has_intro_startup: false,
      intro_startup_song: '',
      workshop_description: '',
      workshop_language: 'English',
      workshop_visibility: '2',
      workshop_tags: 'Extension',
      workshop_preview_image_path: 'Logo.png',
      workshop_publish_id: 'NONE',
      status: 'draft'
    });
  };

  const openEdit = (ext) => {
    setEditingExt(ext);
    setForm({
      name: ext.name,
      description: ext.description || '',
      language: ext.language || 'en-us',
      starting_theme: ext.starting_theme || 'green',
      starting_music: ext.starting_music || '',
      starting_mission_id: ext.starting_mission_id || '',
      player_comp_name: ext.player_comp_name || 'PlayerComp',
      allow_saves: ext.allow_saves ?? true,
      starting_visible_nodes: ext.starting_visible_nodes || '',
      starting_actions: ext.starting_actions || '',
      faction: ext.faction || '',
      starts_with_tutorial: ext.starts_with_tutorial ?? false,
      has_intro_startup: ext.has_intro_startup ?? false,
      intro_startup_song: ext.intro_startup_song || '',
      workshop_description: ext.workshop_description || '',
      workshop_language: ext.workshop_language || 'English',
      workshop_visibility: ext.workshop_visibility || '2',
      workshop_tags: ext.workshop_tags || 'Extension',
      workshop_preview_image_path: ext.workshop_preview_image_path || 'Logo.png',
      workshop_publish_id: ext.workshop_publish_id || 'NONE',
      status: ext.status || 'draft'
    });
  };

  const handleSubmit = () => {
    if (editingExt) updateMutation.mutate({ id: editingExt.id, data: form });
    else createMutation.mutate(form);
  };

  const getExtStats = (extId) => ({
    nodes: nodes.filter(n => n.extension_id === extId).length,
    missions: missions.filter(m => m.extension_id === extId).length,
    factions: factions.filter(f => f.extension_id === extId).length,
  });

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button onClick={() => setShowCreate(true)} className="font-mono text-xs gap-2">
            <Plus className="w-3.5 h-3.5" /> {t('dashboard.newExtension')}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderOpen} label={t('dashboard.extensions')} value={extensions.length} />
          <StatCard icon={Server} label={t('dashboard.nodes')} value={nodes.length} />
          <StatCard icon={Target} label={t('dashboard.missions')} value={missions.length} />
          <StatCard icon={Users} label={t('dashboard.factions')} value={factions.length} />
        </div>

        {extensions.length === 0 && !isLoading ? (
          <EmptyState
            icon={FolderOpen}
            title={t('dashboard.noExtensions')}
            description={t('dashboard.noExtensionsDesc')}
            actionLabel={t('dashboard.newExtension')}
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {extensions.map((ext) => {
                const stats = getExtStats(ext.id);
                return (
                  <motion.div
                    key={ext.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-semibold text-foreground truncate">{ext.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ext.description || 'Sem descrição'}</p>
                      </div>
                      <Badge className={`${statusColors[ext.status || 'draft']} font-mono text-[10px] ml-2 flex-shrink-0`}>
                        {t(`status.${ext.status || 'draft'}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Server className="w-3 h-3" />{stats.nodes}</span>
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" />{stats.missions}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{stats.factions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="font-mono text-xs flex-1" onClick={() => navigate(`/nodes?ext=${ext.id}`)}>
                        {t('common.open')}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ext)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(ext)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showCreate || !!editingExt} onOpenChange={closeDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingExt ? t('dashboard.editExtension') : t('dashboard.newExtension')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[78vh] p-4">
            <div>
              <Label className="font-mono text-xs">{t('common.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Minha Extensão" className="font-mono text-sm mt-1" />
            </div>
            <div>
              <Label className="font-mono text-xs">{t('common.description')}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Sobre esta extensão..." className="font-mono text-sm mt-1 h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">{t('dashboard.language')}</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-us">English</SelectItem>
                    <SelectItem value="pt-br">Português</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-xs">{t('dashboard.theme')}</Label>
                <Select value={form.starting_theme} onValueChange={(v) => setForm({ ...form, starting_theme: v })}>
                  <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['green', 'white', 'yellow', 'teal', 'base', 'purple', 'mint'].map(t => (
                      <SelectItem key={t} value={t} className="font-mono text-xs capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Completa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Configuração da ExtensionInfo</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">AllowSaves</Label>
                  <Select value={form.allow_saves ? 'true' : 'false'} onValueChange={(v) => setForm({ ...form, allow_saves: v === 'true' })}>
                    <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-xs">StartsWithTutorial</Label>
                  <Select value={form.starts_with_tutorial ? 'true' : 'false'} onValueChange={(v) => setForm({ ...form, starts_with_tutorial: v === 'true' })}>
                    <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">False</SelectItem>
                      <SelectItem value="true">True</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">HasIntroStartup</Label>
                  <Select value={form.has_intro_startup ? 'true' : 'false'} onValueChange={(v) => setForm({ ...form, has_intro_startup: v === 'true' })}>
                    <SelectTrigger className="mt-1 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">False</SelectItem>
                      <SelectItem value="true">True</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-xs">Starting Mission</Label>
                  <Input value={form.starting_mission_id} onChange={(e) => setForm({ ...form, starting_mission_id: e.target.value })} placeholder="Missions/StartingMission.xml" className="font-mono text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">Starting Actions</Label>
                  <Input value={form.starting_actions} onChange={(e) => setForm({ ...form, starting_actions: e.target.value })} placeholder="Actions/StartingActions.xml" className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Starting Theme</Label>
                  <Input value={form.starting_theme} onChange={(e) => setForm({ ...form, starting_theme: e.target.value })} placeholder="green" className="font-mono text-sm mt-1" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">Starting Visible Nodes</Label>
                <Input value={form.starting_visible_nodes} onChange={(e) => setForm({ ...form, starting_visible_nodes: e.target.value })} placeholder="node01,node02" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Intro Startup Song</Label>
                <Input value={form.intro_startup_song} onChange={(e) => setForm({ ...form, intro_startup_song: e.target.value })} placeholder="The_Quickening" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Workshop Description</Label>
                <Textarea value={form.workshop_description} onChange={(e) => setForm({ ...form, workshop_description: e.target.value })} className="font-mono text-sm mt-1 h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">Workshop Language</Label>
                  <Input value={form.workshop_language} onChange={(e) => setForm({ ...form, workshop_language: e.target.value })} className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Workshop Visibility</Label>
                  <Input value={form.workshop_visibility} onChange={(e) => setForm({ ...form, workshop_visibility: e.target.value })} className="font-mono text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">Workshop Tags</Label>
                  <Input value={form.workshop_tags} onChange={(e) => setForm({ ...form, workshop_tags: e.target.value })} className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Workshop Preview Path</Label>
                  <Input value={form.workshop_preview_image_path} onChange={(e) => setForm({ ...form, workshop_preview_image_path: e.target.value })} className="font-mono text-sm mt-1" />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">Workshop Publish ID</Label>
                <Input value={form.workshop_publish_id} onChange={(e) => setForm({ ...form, workshop_publish_id: e.target.value })} className="font-mono text-sm mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-mono text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.name} className="font-mono text-xs">
              {editingExt ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        title={`Excluir "${deleteTarget?.name}"?`}
        description="Todos os nós, missões e facções associados permanecerão, mas perderão a referência."
      />
    </div>
  );
}