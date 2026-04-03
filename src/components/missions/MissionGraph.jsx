// @ts-nocheck
import React, { useRef } from 'react';
import { db } from '@/db/database';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import MissionGraphCanvas from './MissionGraphCanvas';

export default function MissionGraph({ missions, selectedExt, onEditMission }) {
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);

  const updateMut = useMutation({
    mutationFn: ({ id, next_mission_id }) =>
      db.entities.Mission.update(id, { next_mission_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] }),
  });

  const handleUpdateNextMission = (fromMissionId, toMissionId) => {
    const mission = missions.find(m => m.mission_id === fromMissionId);
    if (!mission) return;
    const nextId = toMissionId || '';
    updateMut.mutate({ id: mission.id, next_mission_id: nextId });
    if (toMissionId) {
      const target = missions.find(m => m.mission_id === toMissionId);
      toast.success(`Conectado: "${mission.title}" → "${target?.title || toMissionId}"`);
    } else {
      toast.info(`Conexão removida de "${mission.title}"`);
    }
  };

  if (missions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-2xl">🗺️</span>
        </div>
        <p className="text-muted-foreground text-sm">Nenhuma missão para exibir.</p>
        <p className="text-muted-foreground text-xs">Crie missões para visualizar o grafo.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MissionGraphCanvas
        ref={canvasRef}
        missions={missions}
        onUpdateNextMission={handleUpdateNextMission}
        onEditMission={onEditMission}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs font-mono space-y-1.5 pointer-events-none">
        <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-2">Legenda</p>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#22c55e]" /> Download</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#ef4444]" /> Delete</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#f59e0b]" /> Change</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#8b5cf6]" /> Admin</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#06b6d4]" /> String</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-[#f97316]" /> Flag</div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs font-mono space-y-1 pointer-events-none">
        <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-2">Controles</p>
        <p className="text-muted-foreground">🖱️ Arrastar nó → mover</p>
        <p className="text-muted-foreground">⚫ Porta direita → conectar</p>
        <p className="text-muted-foreground">🖱️ Rolar → zoom</p>
        <p className="text-muted-foreground">Duplo clique → editar</p>
        <p className="text-muted-foreground">Clique direito → desconectar</p>
      </div>
    </div>
  );
}