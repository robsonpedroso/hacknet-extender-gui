// @ts-nocheck
import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Code, Trash2, Pencil, GripVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';

const CMD_TYPES = ['delay', 'connect', 'openPort', 'delete', 'reboot', 'forkbomb', 'disconnect', 'systakeover', 'clearTerminal', 'write', 'writel', 'hideNetMap', 'hideRam', 'hideDisplay', 'stopMusic', 'trackseq', 'instanttrace', 'flash'];
const CMD_ARGS = {
  delay: ['tempo (s)', ''],
  openPort: ['número da porta', ''],
  delete: ['diretório', 'arquivo'],
  write: ['texto', ''],
  writel: ['texto', ''],
};
const CMD_COLORS = {
  connect: 'text-primary', disconnect: 'text-muted-foreground', reboot: 'text-destructive',
  forkbomb: 'text-destructive', delete: 'text-destructive', delay: 'text-accent',
  openPort: 'text-blue-400', write: 'text-foreground', writel: 'text-foreground',
  systakeover: 'text-red-400', clearTerminal: 'text-muted-foreground',
  hideNetMap: 'text-orange-400', hideRam: 'text-orange-400', hideDisplay: 'text-orange-400',
  stopMusic: 'text-muted-foreground', flash: 'text-yellow-400',
};

const defaultScript = { script_name: '', description: '', player_comp: 'playerComp', target_comp_name_or_ip: '', config_delay: 0, commands: [] };
const defaultCmd = { type: 'delay', arg1: '', arg2: '' };

function ScriptPreview({ script }) {
  const lines = [];
  lines.push(`config playerComp ${script.target_comp_name_or_ip || 'target'} ${script.config_delay ?? 0} $#%#$`);
  (script.commands || []).forEach(cmd => {
    let line = cmd.type;
    if (cmd.arg1) line += ` ${cmd.arg1}`;
    if (cmd.arg2) line += ` ${cmd.arg2}`;
    lines.push(`${line} $#%#$`);
  });
  return (
    <pre className="bg-background border border-border rounded-lg p-3 text-xs font-mono text-foreground/70 overflow-x-auto max-h-32 overflow-y-auto">
      {lines.join('\r\n')}
    </pre>
  );
}

export default function HackerScripts() {
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedExt, setSelectedExt] = useState(urlParams.get('ext') || '');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultScript);
  const [newCmd, setNewCmd] = useState(defaultCmd);
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['scripts', selectedExt],
    queryFn: () => selectedExt ? db.entities.HackerScript.filter({ extension_id: selectedExt }) : db.entities.HackerScript.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.HackerScript.create({ ...data, extension_id: selectedExt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scripts'] }); close(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.HackerScript.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scripts'] }); close(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.HackerScript.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scripts'] }),
  });

  const close = () => { setShowForm(false); setEditing(null); setForm(defaultScript); setNewCmd(defaultCmd); };
  const openEdit = (s) => { setEditing(s); setForm({ ...defaultScript, ...s, commands: s.commands || [] }); };
  const handleSubmit = () => {
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCmd = () => {
    setForm(p => ({ ...p, commands: [...(p.commands || []), { ...newCmd }] }));
    setNewCmd(defaultCmd);
  };
  const removeCmd = (idx) => setForm(p => ({ ...p, commands: p.commands.filter((_, i) => i !== idx) }));
  const updateCmd = (idx, key, val) => setForm(p => {
    const cmds = [...p.commands];
    cmds[idx] = { ...cmds[idx], [key]: val };
    return { ...p, commands: cmds };
  });

  const downloadScript = (script) => {
    const lines = [];
    lines.push(`config playerComp ${script.target_comp_name_or_ip || 'target'} ${script.config_delay ?? 0} $#%#$\r\n`);
    (script.commands || []).forEach(cmd => {
      let line = cmd.type;
      if (cmd.arg1) line += ` ${cmd.arg1}`;
      if (cmd.arg2) line += ` ${cmd.arg2}`;
      lines.push(`${line} $#%#$\r\n`);
    });
    const blob = new Blob([lines.join('')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.script_name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title="HackerScripts"
        subtitle="Scripts de ataque e automação para NPCs"
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            <Button onClick={() => setShowForm(true)} disabled={!selectedExt} className="font-mono text-xs gap-2">
              <Plus className="w-3.5 h-3.5" /> Novo Script
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {!selectedExt ? (
          <EmptyState icon={Code} title="Selecione uma extensão" description="Escolha uma extensão para gerenciar HackerScripts." />
        ) : scripts.length === 0 && !isLoading ? (
          <EmptyState icon={Code} title="Nenhum script" description="Crie scripts de hack para NPCs atacarem o jogador." actionLabel="Novo Script" onAction={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {scripts.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-primary" />
                        <h3 className="font-mono text-sm font-semibold text-foreground">{s.script_name}.txt</h3>
                      </div>
                      {s.description && <p className="text-xs text-muted-foreground mt-1 ml-6">{s.description}</p>}
                      <div className="flex gap-2 mt-1 ml-6">
                        <Badge variant="outline" className="font-mono text-[10px]">→ {s.target_comp_name_or_ip || '?'}</Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">{(s.commands || []).length} cmds</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => downloadScript(s)} title="Download .txt">
                        <Code className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <ScriptPreview script={s} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showForm || !!editing} onOpenChange={close}>
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editing ? 'Editar Script' : 'Novo HackerScript'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-mono text-xs">Nome do Script</Label>
                <Input value={form.script_name} onChange={e => upd('script_name', e.target.value)} placeholder="ExampleHack" className="font-mono text-sm mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs">Descrição</Label>
                <Input value={form.description} onChange={e => upd('description', e.target.value)} className="font-mono text-sm mt-1" />
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 space-y-3">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Configuração (config)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs">Alvo (nome ou IP)</Label>
                  <Input value={form.target_comp_name_or_ip} onChange={e => upd('target_comp_name_or_ip', e.target.value)} placeholder="advExamplePC" className="font-mono text-sm mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-xs">Delay inicial (s)</Label>
                  <Input type="number" step="0.5" value={form.config_delay} onChange={e => upd('config_delay', parseFloat(e.target.value))} className="font-mono text-sm mt-1" />
                </div>
              </div>
            </div>

            {/* Commands list */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Comandos</h4>
              {(form.commands || []).length === 0 && (
                <p className="text-xs font-mono text-muted-foreground">Nenhum comando. Adicione abaixo.</p>
              )}
              <AnimatePresence>
                {(form.commands || []).map((cmd, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-background rounded px-3 py-2">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className={`font-mono text-xs w-24 flex-shrink-0 ${CMD_COLORS[cmd.type] || 'text-foreground'}`}>{cmd.type}</span>
                    {CMD_ARGS[cmd.type]?.[0] && (
                      <Input value={cmd.arg1} onChange={e => updateCmd(idx, 'arg1', e.target.value)}
                        placeholder={CMD_ARGS[cmd.type][0]} className="font-mono text-xs h-7 flex-1" />
                    )}
                    {CMD_ARGS[cmd.type]?.[1] && (
                      <Input value={cmd.arg2} onChange={e => updateCmd(idx, 'arg2', e.target.value)}
                        placeholder={CMD_ARGS[cmd.type][1]} className="font-mono text-xs h-7 flex-1" />
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => removeCmd(idx)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add command row */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Select value={newCmd.type} onValueChange={v => setNewCmd(p => ({ ...p, type: v, arg1: '', arg2: '' }))}>
                  <SelectTrigger className="font-mono text-xs w-40 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{CMD_TYPES.map(t => <SelectItem key={t} value={t} className="font-mono text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
                {CMD_ARGS[newCmd.type]?.[0] && (
                  <Input value={newCmd.arg1} onChange={e => setNewCmd(p => ({ ...p, arg1: e.target.value }))}
                    placeholder={CMD_ARGS[newCmd.type][0]} className="font-mono text-xs h-8 flex-1" />
                )}
                {CMD_ARGS[newCmd.type]?.[1] && (
                  <Input value={newCmd.arg2} onChange={e => setNewCmd(p => ({ ...p, arg2: e.target.value }))}
                    placeholder={CMD_ARGS[newCmd.type][1]} className="font-mono text-xs h-8 flex-1" />
                )}
                <Button size="sm" onClick={addCmd} className="font-mono text-xs h-8 px-3 flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Live preview */}
            <div>
              <Label className="font-mono text-xs text-muted-foreground">Preview do arquivo</Label>
              <div className="mt-1"><ScriptPreview script={form} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} className="font-mono text-xs">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.script_name} className="font-mono text-xs">{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
        title={`Excluir script "${deleteTarget?.script_name}"?`} />
    </div>
  );
}