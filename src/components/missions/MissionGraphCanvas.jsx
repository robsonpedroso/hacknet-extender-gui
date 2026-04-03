import React, { useRef, useEffect, useState, useCallback } from 'react';

const NODE_W = 200;
const NODE_H = 72;
const PORT_R = 7;

function getInitialPositions(missions) {
  const posMap = {};
  const inDegree = {};
  const children = {};

  missions.forEach(m => {
    inDegree[m.mission_id] = 0;
    children[m.mission_id] = [];
  });
  missions.forEach(m => {
    if (m.next_mission_id) {
      const target = missions.find(x => x.mission_id === m.next_mission_id);
      if (target) {
        inDegree[m.next_mission_id] = (inDegree[m.next_mission_id] || 0) + 1;
        children[m.mission_id].push(m.next_mission_id);
      }
    }
  });

  // BFS layers
  const layers = [];
  const visited = new Set();
  let queue = missions.filter(m => inDegree[m.mission_id] === 0).map(m => m.mission_id);
  if (queue.length === 0 && missions.length > 0) queue = [missions[0].mission_id];

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach(id => visited.add(id));
    const next = [];
    queue.forEach(id => {
      (children[id] || []).forEach(cid => {
        if (!visited.has(cid)) next.push(cid);
      });
    });
    queue = [...new Set(next)];
  }

  // Place unvisited missions
  missions.forEach(m => {
    if (!visited.has(m.mission_id)) {
      layers.push([m.mission_id]);
    }
  });

  const PADDING_X = 80;
  const PADDING_Y = 60;
  const H_GAP = 260;
  const V_GAP = 110;

  layers.forEach((layer, col) => {
    const totalH = layer.length * V_GAP;
    layer.forEach((id, row) => {
      posMap[id] = {
        x: PADDING_X + col * H_GAP,
        y: PADDING_Y + row * V_GAP - (totalH - V_GAP) / 2 + 200,
      };
    });
  });

  return posMap;
}

function getGoalColor(goalType) {
  const colors = {
    filedownload: '#22c55e',
    filedelete: '#ef4444',
    filechange: '#f59e0b',
    getadmin: '#8b5cf6',
    getstring: '#06b6d4',
    delay: '#6b7280',
    hasflag: '#f97316',
  };
  return colors[goalType] || '#22c55e';
}

const goalLabels = {
  filedownload: 'Download',
  filedelete: 'Delete',
  filechange: 'Change',
  getadmin: 'Admin',
  getstring: 'String',
  delay: 'Delay',
  hasflag: 'Flag',
};

export default function MissionGraphCanvas({ missions, onUpdateNextMission, onEditMission }) {
  const canvasRef = useRef(null);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null); // { id, offsetX, offsetY }
  const [connecting, setConnecting] = useState(null); // { fromId, mouseX, mouseY }
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredPort, setHoveredPort] = useState(null); // { id, type: 'out'|'in' }
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const animRef = useRef(null);
  const stateRef = useRef({});

  // Keep stateRef in sync for use in event handlers without stale closure
  stateRef.current = { positions, dragging, connecting, hoveredNode, hoveredPort, pan, isPanning, panStart, zoom };

  // Initialize positions when missions change
  useEffect(() => {
    if (missions.length === 0) return;
    setPositions(prev => {
      const newPos = { ...prev };
      const initial = getInitialPositions(missions);
      missions.forEach(m => {
        if (!newPos[m.mission_id]) {
          newPos[m.mission_id] = initial[m.mission_id] || { x: 100, y: 100 };
        }
      });
      // Remove stale
      Object.keys(newPos).forEach(id => {
        if (!missions.find(m => m.mission_id === id)) delete newPos[id];
      });
      return newPos;
    });
  }, [missions.map(m => m.mission_id).join(',')]);

  const toCanvas = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { pan, zoom } = stateRef.current;
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, []);

  const getOutPortPos = (id) => {
    const pos = stateRef.current.positions[id];
    if (!pos) return null;
    return { x: pos.x + NODE_W, y: pos.y + NODE_H / 2 };
  };

  const getInPortPos = (id) => {
    const pos = stateRef.current.positions[id];
    if (!pos) return null;
    return { x: pos.x, y: pos.y + NODE_H / 2 };
  };

  const getNodeAtPoint = useCallback((x, y) => {
    const { positions } = stateRef.current;
    for (let i = missions.length - 1; i >= 0; i--) {
      const m = missions[i];
      const pos = positions[m.mission_id];
      if (!pos) continue;
      if (x >= pos.x && x <= pos.x + NODE_W && y >= pos.y && y <= pos.y + NODE_H) {
        return m;
      }
    }
    return null;
  }, [missions]);

  const getPortAtPoint = useCallback((x, y) => {
    const { positions } = stateRef.current;
    for (const m of missions) {
      const pos = positions[m.mission_id];
      if (!pos) continue;
      const outX = pos.x + NODE_W;
      const outY = pos.y + NODE_H / 2;
      if (Math.hypot(x - outX, y - outY) <= PORT_R + 4) return { id: m.mission_id, type: 'out' };
      const inX = pos.x;
      const inY = pos.y + NODE_H / 2;
      if (Math.hypot(x - inX, y - inY) <= PORT_R + 4) return { id: m.mission_id, type: 'in' };
    }
    return null;
  }, [missions]);

  // Draw loop
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { positions, connecting, hoveredNode, hoveredPort, pan, zoom } = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const gridSize = 30;
      const gridColor = 'rgba(34,197,94,0.06)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize - gridSize;
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize - gridSize;
      const endX = startX + W / zoom + gridSize * 2;
      const endY = startY + H / zoom + gridSize * 2;
      for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
      }
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
      }

      // Draw edges
      missions.forEach(m => {
        if (!m.next_mission_id) return;
        const fromPos = positions[m.mission_id];
        const toPos = positions[m.next_mission_id];
        if (!fromPos || !toPos) return;

        const x1 = fromPos.x + NODE_W;
        const y1 = fromPos.y + NODE_H / 2;
        const x2 = toPos.x;
        const y2 = toPos.y + NODE_H / 2;
        const cp = Math.abs(x2 - x1) * 0.5;

        const isHovered = hoveredNode === m.mission_id || hoveredNode === m.next_mission_id;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2);
        ctx.strokeStyle = isHovered ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,0.4)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.setLineDash(isHovered ? [] : [6, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const angle = Math.atan2(y2 - (toPos.y + NODE_H / 2 - 0.01), x2 - (x2 - 0.01));
        const aw = 8;
        ctx.fillStyle = isHovered ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,0.4)';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - aw * Math.cos(angle - 0.4), y2 - aw * Math.sin(angle - 0.4));
        ctx.lineTo(x2 - aw * Math.cos(angle + 0.4), y2 - aw * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // In-progress connection line
      if (connecting) {
        const fromPos = positions[connecting.fromId];
        if (fromPos) {
          const x1 = fromPos.x + NODE_W;
          const y1 = fromPos.y + NODE_H / 2;
          const x2 = connecting.mouseX;
          const y2 = connecting.mouseY;
          const cp = Math.abs(x2 - x1) * 0.5;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(x1 + cp, y1, x2 - cp, y2, x2, y2);
          ctx.strokeStyle = 'rgba(34,197,94,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // Draw nodes
      missions.forEach(m => {
        const pos = positions[m.mission_id];
        if (!pos) return;
        const isHov = hoveredNode === m.mission_id;
        const goalColor = getGoalColor(m.goal_type);
        const radius = 8;

        ctx.save();

        // Node shadow/glow
        if (isHov) {
          ctx.shadowColor = 'rgba(34,197,94,0.4)';
          ctx.shadowBlur = 18;
        }

        // Node background
        ctx.fillStyle = isHov ? 'rgba(17,37,25,1)' : 'rgba(11,24,16,0.97)';
        ctx.strokeStyle = isHov ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,0.25)';
        ctx.lineWidth = isHov ? 1.5 : 1;
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, NODE_W, NODE_H, radius);
        ctx.fill();
        ctx.stroke();

        // Left accent bar
        ctx.fillStyle = goalColor;
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y + 12, 3, NODE_H - 24, 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Mission ID badge
        ctx.fillStyle = 'rgba(34,197,94,0.12)';
        ctx.beginPath();
        ctx.roundRect(pos.x + 12, pos.y + 10, NODE_W - 24, 18, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(34,197,94,0.7)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(m.mission_id, pos.x + 16, pos.y + 22);

        // Goal type pill
        const pillW = 52;
        ctx.fillStyle = goalColor + '22';
        ctx.beginPath();
        ctx.roundRect(pos.x + NODE_W - pillW - 8, pos.y + 10, pillW, 18, 4);
        ctx.fill();
        ctx.fillStyle = goalColor;
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(goalLabels[m.goal_type] || m.goal_type, pos.x + NODE_W - pillW / 2 - 8, pos.y + 22);

        // Title
        ctx.fillStyle = isHov ? 'rgba(230,255,240,1)' : 'rgba(180,240,200,0.9)';
        ctx.font = `500 12px Space Grotesk, sans-serif`;
        ctx.textAlign = 'left';
        const maxTitleW = NODE_W - 20;
        let title = m.title;
        if (ctx.measureText(title).width > maxTitleW) {
          while (ctx.measureText(title + '…').width > maxTitleW && title.length > 0) title = title.slice(0, -1);
          title += '…';
        }
        ctx.fillText(title, pos.x + 12, pos.y + 46);

        // Next mission indicator
        if (m.next_mission_id) {
          const target = missions.find(x => x.mission_id === m.next_mission_id);
          const label = target ? `→ ${target.title}` : `→ ${m.next_mission_id}`;
          ctx.fillStyle = 'rgba(34,197,94,0.4)';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          let nl = label;
          const maxW = NODE_W - 20;
          if (ctx.measureText(nl).width > maxW) {
            while (ctx.measureText(nl + '…').width > maxW && nl.length > 0) nl = nl.slice(0, -1);
            nl += '…';
          }
          ctx.fillText(nl, pos.x + 12, pos.y + 62);
        } else {
          ctx.fillStyle = 'rgba(34,197,94,0.2)';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText('sem próxima', pos.x + 12, pos.y + 62);
        }

        // OUT port
        const outX = pos.x + NODE_W;
        const outY = pos.y + NODE_H / 2;
        const isOutHov = hoveredPort?.id === m.mission_id && hoveredPort?.type === 'out';
        ctx.beginPath();
        ctx.arc(outX, outY, isOutHov ? PORT_R + 2 : PORT_R, 0, Math.PI * 2);
        ctx.fillStyle = isOutHov ? '#22c55e' : 'rgba(34,197,94,0.6)';
        ctx.fill();
        ctx.strokeStyle = '#0a1a0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // IN port
        const inX = pos.x;
        const inY = pos.y + NODE_H / 2;
        const isInHov = hoveredPort?.id === m.mission_id && hoveredPort?.type === 'in';
        ctx.beginPath();
        ctx.arc(inX, inY, isInHov ? PORT_R + 2 : PORT_R, 0, Math.PI * 2);
        ctx.fillStyle = isInHov ? '#22c55e' : 'rgba(34,197,94,0.3)';
        ctx.fill();
        ctx.strokeStyle = '#0a1a0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      ctx.restore();
    };

    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop); };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [missions]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || e.button === 2) return;
    const { pan, zoom } = stateRef.current;
    const canvasPos = toCanvas(e.clientX, e.clientY);

    const port = getPortAtPoint(canvasPos.x, canvasPos.y);
    if (port?.type === 'out') {
      setConnecting({ fromId: port.id, mouseX: canvasPos.x, mouseY: canvasPos.y });
      return;
    }

    const node = getNodeAtPoint(canvasPos.x, canvasPos.y);
    if (node) {
      const pos = stateRef.current.positions[node.mission_id];
      setDragging({ id: node.mission_id, offsetX: canvasPos.x - pos.x, offsetY: canvasPos.y - pos.y });
      return;
    }

    // Pan
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [toCanvas, getPortAtPoint, getNodeAtPoint]);

  const handleMouseMove = useCallback((e) => {
    const { dragging, connecting, isPanning, panStart } = stateRef.current;
    const canvasPos = toCanvas(e.clientX, e.clientY);

    if (dragging) {
      setPositions(prev => ({
        ...prev,
        [dragging.id]: { x: canvasPos.x - dragging.offsetX, y: canvasPos.y - dragging.offsetY },
      }));
      return;
    }

    if (connecting) {
      setConnecting(prev => ({ ...prev, mouseX: canvasPos.x, mouseY: canvasPos.y }));
      // Highlight hovered in-port
      const port = getPortAtPoint(canvasPos.x, canvasPos.y);
      if (port?.type === 'in' && port.id !== connecting.fromId) {
        setHoveredPort(port);
      } else {
        setHoveredPort(null);
      }
      return;
    }

    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const port = getPortAtPoint(canvasPos.x, canvasPos.y);
    if (port) {
      setHoveredPort(port);
      setHoveredNode(null);
    } else {
      setHoveredPort(null);
      const node = getNodeAtPoint(canvasPos.x, canvasPos.y);
      setHoveredNode(node ? node.mission_id : null);
    }
  }, [toCanvas, getPortAtPoint, getNodeAtPoint]);

  const handleMouseUp = useCallback((e) => {
    const { dragging, connecting } = stateRef.current;
    const canvasPos = toCanvas(e.clientX, e.clientY);

    if (connecting) {
      const port = getPortAtPoint(canvasPos.x, canvasPos.y);
      if (port?.type === 'in' && port.id !== connecting.fromId) {
        onUpdateNextMission(connecting.fromId, port.id);
      } else {
        // Drop on a node body (target node)
        const node = getNodeAtPoint(canvasPos.x, canvasPos.y);
        if (node && node.mission_id !== connecting.fromId) {
          onUpdateNextMission(connecting.fromId, node.mission_id);
        }
      }
      setConnecting(null);
      setHoveredPort(null);
      return;
    }

    if (dragging) {
      setDragging(null);
      return;
    }

    setIsPanning(false);
    setPanStart(null);
  }, [toCanvas, getPortAtPoint, getNodeAtPoint, onUpdateNextMission]);

  const handleDoubleClick = useCallback((e) => {
    const canvasPos = toCanvas(e.clientX, e.clientY);
    const node = getNodeAtPoint(canvasPos.x, canvasPos.y);
    if (node) onEditMission(node);
  }, [toCanvas, getNodeAtPoint, onEditMission]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const { zoom, pan } = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2.5, zoom * delta));
    // Zoom toward mouse
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const canvasPos = toCanvas(e.clientX, e.clientY);
    const node = getNodeAtPoint(canvasPos.x, canvasPos.y);
    if (node && node.next_mission_id) {
      onUpdateNextMission(node.mission_id, '');
    }
  }, [toCanvas, getNodeAtPoint, onUpdateNextMission]);

  const getCursor = () => {
    const { dragging, connecting, hoveredNode, hoveredPort, isPanning } = stateRef.current;
    if (dragging) return 'grabbing';
    if (connecting) return 'crosshair';
    if (isPanning) return 'grabbing';
    if (hoveredPort?.type === 'out') return 'crosshair';
    if (hoveredPort?.type === 'in') return 'cell';
    if (hoveredNode) return 'grab';
    return 'grab';
  };

  const fitAll = () => {
    if (!canvasRef.current || missions.length === 0) return;
    const canvas = canvasRef.current;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const { positions } = stateRef.current;
    const xs = missions.map(m => positions[m.mission_id]?.x).filter(Boolean);
    const ys = missions.map(m => positions[m.mission_id]?.y).filter(Boolean);
    if (!xs.length) return;
    const minX = Math.min(...xs) - 40;
    const minY = Math.min(...ys) - 40;
    const maxX = Math.max(...xs) + NODE_W + 40;
    const maxY = Math.max(...ys) + NODE_H + 40;
    const scaleX = W / (maxX - minX);
    const scaleY = H / (maxY - minY);
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({ x: -minX * newZoom + (W - (maxX - minX) * newZoom) / 2, y: -minY * newZoom + (H - (maxY - minY) * newZoom) / 2 });
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setDragging(null); setConnecting(null); setIsPanning(false); setHoveredNode(null); setHoveredPort(null); }}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    />
  );
}