'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  timelineMoments,
  triviaQuestions,
  universeEdges,
  universeNodes,
  type UniverseNode,
} from '@/lib/snl-universe';

type Mode = 'explore' | 'path' | 'trivia' | 'timeline';

const NODE_COLORS: Record<string, string> = {
  alumni: '#F59E0B',
  movie: '#60A5FA',
  tv: '#A78BFA',
  character: '#34D399',
  creator: '#F87171',
  award: '#FCD34D',
};

function nodeColor(node: Pick<UniverseNode, 'id' | 'type'>): string {
  if (node.id === 'snl') return '#FFFFFF';
  return NODE_COLORS[node.type] ?? '#888';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function findPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  const queue: string[][] = [[startId]];
  const visited = new Set([startId]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    for (const { source, target } of universeEdges) {
      const src = source as string;
      const tgt = target as string;
      const neighbor = src === last ? tgt : tgt === last ? src : null;
      if (neighbor && !visited.has(neighbor)) {
        const newPath = [...path, neighbor];
        if (neighbor === endId) return newPath;
        visited.add(neighbor);
        queue.push(newPath);
      }
    }
  }
  return [];
}

export default function SnlUniverseExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Refs for stable paint callbacks (avoid stale closures in rAF loop)
  const highlightNodesRef = useRef<Set<string>>(new Set());
  const highlightLinksRef = useRef<Set<string>>(new Set());
  const activeNodeRef = useRef<UniverseNode | null>(null);
  const modeRef = useRef<Mode>('explore');
  const nodeByIdRef = useRef<Map<string, UniverseNode>>(new Map());

  const [mounted, setMounted] = useState(false);
  const [dims, setDims] = useState({ w: 1200, h: 800 });
  const [mode, setMode] = useState<Mode>('explore');
  const [activeNode, setActiveNode] = useState<UniverseNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<UniverseNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [gameStart, setGameStart] = useState('adam-sandler');
  const [gameEnd, setGameEnd] = useState('eddie-murphy');
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaAnswer, setTriviaAnswer] = useState<string | null>(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [search, setSearch] = useState('');

  // Keep refs in sync with state so stable paint callbacks see latest values
  useEffect(() => { highlightNodesRef.current = highlightNodes; }, [highlightNodes]);
  useEffect(() => { highlightLinksRef.current = highlightLinks; }, [highlightLinks]);
  useEffect(() => { activeNodeRef.current = activeNode; }, [activeNode]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    setMounted(true);
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Graph data — copies so original arrays stay pristine for BFS
  const graphData = useMemo(
    () => ({
      nodes: universeNodes.map((n) => ({ ...n })),
      links: universeEdges.map((e) => ({ ...e })),
    }),
    [],
  );

  const nodeById = useMemo(() => {
    const map = new Map(universeNodes.map((n) => [n.id, n]));
    nodeByIdRef.current = map;
    return map;
  }, []);

  // Stable paint callbacks — read from refs so they never go stale
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const hl = highlightNodesRef.current;
      const active = activeNodeRef.current;
      const uNode = node as UniverseNode;
      const color = nodeColor(uNode);
      const isSNL = node.id === 'snl';
      const isActive = active?.id === node.id;
      const isHighlighted = hl.size === 0 || hl.has(node.id);

      const baseSize = isSNL ? 11 : 6;
      const size = isActive ? baseSize * 1.45 : baseSize;
      const alpha = hl.size > 0 ? (isHighlighted ? 1 : 0.1) : 1;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (isHighlighted) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isActive ? 24 : isSNL ? 18 : 10;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? color : `${color}33`;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = isActive ? '#FFFFFF' : color;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();

      const fontSize = Math.max(size * 0.52, 3);
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(getInitials(node.name), node.x, node.y);

      if (globalScale >= 2 && isHighlighted) {
        const ls = Math.max(size * 0.4, 2.5);
        ctx.font = `${ls}px system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
        ctx.shadowBlur = 0;
        ctx.fillText(node.name, node.x, node.y + size + ls);
      }

      ctx.restore();
    },
    [],
  );

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const hl = highlightLinksRef.current;
    const m = modeRef.current;
    const srcId = typeof link.source === 'object' ? link.source.id : link.source;
    const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
    const srcNode = typeof link.source === 'object' ? link.source : null;
    const tgtNode = typeof link.target === 'object' ? link.target : null;
    if (!srcNode || !tgtNode) return;

    const isHighlighted = hl.has(`${srcId}-${tgtId}`) || hl.has(`${tgtId}-${srcId}`);
    const hasHL = hl.size > 0;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(srcNode.x, srcNode.y);
    ctx.lineTo(tgtNode.x, tgtNode.y);

    if (isHighlighted) {
      const col = m === 'path' ? '#FBBF24' : (NODE_COLORS[nodeByIdRef.current.get(srcId)?.type ?? ''] ?? '#FFFFFF');
      const pulse = Math.sin(Date.now() / 350) * 0.4 + 0.6;
      ctx.strokeStyle = col;
      ctx.lineWidth = m === 'path' ? 2 : 1.5;
      ctx.globalAlpha = pulse;
      ctx.shadowColor = col;
      ctx.shadowBlur = 6 + pulse * 6;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = hasHL ? 0.04 : 0.2;
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  const paintPointerArea = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.id === 'snl' ? 14 : 9, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const handleNodeClick = useCallback(
    (node: any) => {
      const uNode = nodeByIdRef.current.get(node.id);
      if (!uNode) return;
      setActiveNode(uNode);
      setSidebarOpen(true);
      graphRef.current?.centerAt(node.x, node.y, 600);
      graphRef.current?.zoom(3.5, 600);
    },
    [],
  );

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node ? (nodeByIdRef.current.get(node.id) ?? null) : null);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  // Init force-graph (2D-only package, no AFRAME dependency)
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let graph: any;
    import('force-graph').then(({ default: ForceGraph }) => {
      if (!containerRef.current) return;
      graph = (ForceGraph as any)()(containerRef.current)
        .graphData(graphData)
        .width(dims.w)
        .height(dims.h)
        .backgroundColor('#03030a')
        .nodeCanvasObject(paintNode)
        .nodeCanvasObjectMode(() => 'replace')
        .linkCanvasObject(paintLink)
        .linkCanvasObjectMode(() => 'replace')
        .onNodeClick(handleNodeClick)
        .onNodeHover(handleNodeHover)
        .nodePointerAreaPaint(paintPointerArea)
        .nodeLabel('')
        .d3AlphaDecay(0.025)
        .d3VelocityDecay(0.35)
        .cooldownTicks(180);

      graphRef.current = graph;
    });

    return () => {
      graph?._destructor?.();
      graphRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Update dimensions when window resizes
  useEffect(() => {
    graphRef.current?.width(dims.w).height(dims.h);
  }, [dims]);

  // Highlight active node + neighbors
  useEffect(() => {
    if (mode === 'path') return;
    if (!activeNode) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    const nodes = new Set<string>([activeNode.id]);
    const links = new Set<string>();
    for (const e of universeEdges) {
      if (e.source === activeNode.id || e.target === activeNode.id) {
        nodes.add(e.source as string);
        nodes.add(e.target as string);
        links.add(`${e.source}-${e.target}`);
        links.add(`${e.target}-${e.source}`);
      }
    }
    setHighlightNodes(nodes);
    setHighlightLinks(links);
  }, [activeNode, mode]);

  // Path computation
  const gamePath = useMemo(() => {
    if (mode !== 'path') return [];
    return findPath(gameStart, gameEnd);
  }, [mode, gameStart, gameEnd]);

  useEffect(() => {
    if (mode !== 'path') return;
    if (gamePath.length === 0) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    const nodes = new Set(gamePath);
    const links = new Set<string>();
    for (let i = 0; i < gamePath.length - 1; i++) {
      links.add(`${gamePath[i]}-${gamePath[i + 1]}`);
      links.add(`${gamePath[i + 1]}-${gamePath[i]}`);
    }
    setHighlightNodes(nodes);
    setHighlightLinks(links);
  }, [mode, gamePath]);

  const switchMode = useCallback(
    (m: Mode) => {
      setMode(m);
      if (m !== 'path' && modeRef.current === 'path') {
        if (activeNodeRef.current) {
          const an = activeNodeRef.current;
          const nodes = new Set<string>([an.id]);
          const links = new Set<string>();
          for (const e of universeEdges) {
            if (e.source === an.id || e.target === an.id) {
              nodes.add(e.source as string);
              nodes.add(e.target as string);
              links.add(`${e.source}-${e.target}`);
              links.add(`${e.target}-${e.source}`);
            }
          }
          setHighlightNodes(nodes);
          setHighlightLinks(links);
        } else {
          setHighlightNodes(new Set());
          setHighlightLinks(new Set());
        }
      }
      if (m === 'timeline') setSidebarOpen(false);
    },
    [],
  );

  const flyToNode = useCallback((id: string) => {
    const gNode = (graphData.nodes as any[]).find((n: any) => n.id === id);
    if (gNode && graphRef.current) {
      graphRef.current.centerAt(gNode.x, gNode.y, 600);
      graphRef.current.zoom(3.5, 600);
    }
  }, [graphData]);

  const activeConnections = useMemo(() => {
    if (!activeNode) return [];
    return universeEdges
      .filter((e) => e.source === activeNode.id || e.target === activeNode.id)
      .map((e) => {
        const otherId = (e.source === activeNode.id ? e.target : e.source) as string;
        const n = nodeById.get(otherId);
        return n ? { edge: e, node: n } : null;
      })
      .filter((x): x is { edge: (typeof universeEdges)[0]; node: UniverseNode } => x !== null);
  }, [activeNode, nodeById]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return universeNodes.filter((n) => n.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  const trivia = triviaQuestions[triviaIndex];
  const triviaCorrect = triviaAnswer === trivia.answer;
  const alumniNodes = universeNodes.filter((n) => n.type === 'alumni');

  return (
    <main className="w-full h-screen bg-black overflow-hidden relative select-none">
      {/* Graph canvas container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-30 px-4 pt-3 pb-10 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto flex-wrap">
          <div className="shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-amber-400">Interactive</p>
            <h1 className="text-base font-black text-white leading-none">SNL Universe</h1>
          </div>

          <div className="relative max-w-xs flex-1 min-w-[160px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearch(''), 200)}
              placeholder="Search alumni, films..."
              className="w-full rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-amber-400/60"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 rounded-xl bg-black/98 border border-white/10 overflow-hidden shadow-2xl z-30">
                {searchResults.map((n) => (
                  <button
                    key={n.id}
                    onMouseDown={() => {
                      setSearch('');
                      setActiveNode(n);
                      setSidebarOpen(true);
                      if (mode !== 'timeline') flyToNode(n.id);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 hover:bg-white/8 text-left"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: nodeColor(n), boxShadow: `0 0 5px ${nodeColor(n)}` }}
                    />
                    <span className="text-sm font-semibold text-white">{n.name}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-white/35">{n.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="hidden md:block text-xs text-white/25 shrink-0">
            {universeNodes.length} nodes · {universeEdges.length} links
          </span>

          <div className="ml-auto flex items-center gap-1 shrink-0 flex-wrap">
            {(
              [
                ['explore', 'Explore'],
                ['path', 'Path Finder'],
                ['trivia', 'Trivia'],
                ['timeline', 'Timeline'],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  mode === m
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
                    : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 space-y-1.5 pointer-events-none">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            <span className="text-[10px] capitalize text-white/35">{type}</span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-10 text-[10px] text-white/18 text-right space-y-0.5 pointer-events-none">
        <p>Scroll to zoom · Drag to pan</p>
        <p>Click node to explore</p>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none max-w-[200px] rounded-xl bg-black/96 border border-white/10 p-3 shadow-2xl"
          style={{
            left: Math.min(mousePos.x + 14, dims.w - 220),
            top: Math.min(mousePos.y + 14, dims.h - 180),
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: nodeColor(hoveredNode), boxShadow: `0 0 5px ${nodeColor(hoveredNode)}` }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: nodeColor(hoveredNode) }}
            >
              {hoveredNode.type}
            </span>
          </div>
          <p className="font-black text-white text-sm leading-tight">{hoveredNode.name}</p>
          {hoveredNode.years && <p className="text-[10px] text-white/40 mt-0.5">{hoveredNode.years}</p>}
          {hoveredNode.catchphrases?.[0] && (
            <p className="mt-1.5 text-[10px] text-amber-300 italic leading-relaxed">
              &ldquo;{hoveredNode.catchphrases[0]}&rdquo;
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-white/50 leading-relaxed line-clamp-2">{hoveredNode.bio}</p>
        </div>
      )}

      {/* Sidebar — node detail */}
      <aside
        className={`absolute top-0 right-0 bottom-0 z-10 w-[290px] bg-black/96 border-l border-white/8 overflow-y-auto transition-transform duration-300 ${
          sidebarOpen && activeNode && mode !== 'timeline' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {activeNode && (
          <>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm text-white/70"
              aria-label="Close"
            >
              ×
            </button>
            <div className={`h-28 bg-gradient-to-br ${activeNode.imageTone} p-4 flex flex-col justify-end`}>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/65 mb-1.5">
                {activeNode.type}
              </span>
              <h2 className="text-xl font-black text-white leading-tight">{activeNode.name}</h2>
              {activeNode.years && <p className="text-[11px] text-white/55 mt-0.5">{activeNode.years}</p>}
            </div>
            <div className="p-4 space-y-3.5">
              {activeNode.role && <p className="text-xs font-bold text-amber-300">{activeNode.role}</p>}
              <p className="text-[13px] text-white/62 leading-6">{activeNode.bio}</p>
              {activeNode.catchphrases?.length ? (
                <div className="rounded-lg bg-white/5 border border-white/8 p-3">
                  {activeNode.catchphrases.map((c) => (
                    <p key={c} className="text-sm text-amber-300 italic">
                      &ldquo;{c}&rdquo;
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {activeNode.tags.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/45">
                    {t}
                  </span>
                ))}
              </div>
              {activeNode.highlights.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/22 mb-2">Highlights</p>
                  {activeNode.highlights.map((h) => (
                    <p key={h} className="text-[12px] text-white/50 py-0.5">· {h}</p>
                  ))}
                </div>
              )}
              {activeNode.awards?.length ? (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/22 mb-1.5">Awards</p>
                  <div className="flex flex-wrap gap-1">
                    {activeNode.awards.map((a) => (
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-400/70">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/22 mb-2">
                  Connections ({activeConnections.length})
                </p>
                <div className="space-y-1.5">
                  {activeConnections.map(({ edge, node: n }) => (
                    <button
                      key={`${edge.source as string}-${edge.target as string}`}
                      onClick={() => { setActiveNode(n); flyToNode(n.id); }}
                      className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2 hover:border-amber-400/35 text-left transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: nodeColor(n) }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-white truncate">{n.name}</span>
                        <span className="block text-[10px] text-white/38 truncate">{edge.relation}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Path Finder panel */}
      {mode === 'path' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-black/96 border border-white/10 rounded-2xl p-4 shadow-2xl w-[500px] max-w-[calc(100vw-2rem)]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-2.5">
            Six Degrees · Path Finder
          </p>
          <div className="flex items-center gap-2">
            <select
              value={gameStart}
              onChange={(e) => setGameStart(e.target.value)}
              className="flex-1 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white outline-none"
            >
              {alumniNodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-[#111]">{n.name}</option>
              ))}
            </select>
            <span className="text-white/30 text-sm shrink-0">→</span>
            <select
              value={gameEnd}
              onChange={(e) => setGameEnd(e.target.value)}
              className="flex-1 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white outline-none"
            >
              {alumniNodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-[#111]">{n.name}</option>
              ))}
            </select>
          </div>
          {gamePath.length > 0 ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {gamePath.map((id, i) => {
                  const n = nodeById.get(id);
                  if (!n) return null;
                  return (
                    <span key={id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setActiveNode(n); setSidebarOpen(true); flyToNode(id); }}
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold text-black"
                        style={{ background: nodeColor(n) }}
                      >
                        {n.name}
                      </button>
                      {i < gamePath.length - 1 && (
                        <span className="text-white/25 text-[11px]">→</span>
                      )}
                    </span>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-white/35">
                {gamePath.length - 1} hop{gamePath.length !== 2 ? 's' : ''} ·{' '}
                {Math.max(1000 - (gamePath.length - 1) * 125, 250)} pts
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/35">No path found.</p>
          )}
        </div>
      )}

      {/* Trivia panel */}
      {mode === 'trivia' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-black/96 border border-white/10 rounded-2xl p-5 shadow-2xl w-[460px] max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">
              Trivia · {triviaIndex + 1} / {triviaQuestions.length}
            </p>
            {triviaScore > 0 && (
              <span className="text-xs font-bold text-amber-400">{triviaScore} pts</span>
            )}
          </div>
          <p className="font-bold text-white text-sm leading-6 mb-4">{trivia.prompt}</p>
          <div className="space-y-2">
            {trivia.options.map((opt) => (
              <button
                key={opt}
                disabled={!!triviaAnswer}
                onClick={() => {
                  setTriviaAnswer(opt);
                  if (opt === trivia.answer) setTriviaScore((s) => s + 250);
                }}
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all ${
                  triviaAnswer === opt
                    ? opt === trivia.answer
                      ? 'bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-red-500/40 text-white border border-red-400/40'
                    : triviaAnswer && opt === trivia.answer
                      ? 'bg-emerald-500/22 text-emerald-300 border border-emerald-400/30'
                      : 'bg-white/6 text-white border border-white/10 hover:bg-white/12 disabled:cursor-default'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {triviaAnswer && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-semibold">
                {triviaCorrect ? (
                  <span className="text-emerald-400">Correct!</span>
                ) : (
                  <span className="text-red-400">Answer: {trivia.answer}</span>
                )}
              </p>
              {triviaIndex < triviaQuestions.length - 1 ? (
                <button
                  onClick={() => { setTriviaIndex((i) => i + 1); setTriviaAnswer(null); }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => { setTriviaIndex(0); setTriviaAnswer(null); setTriviaScore(0); }}
                  className="text-xs font-bold text-white/45 hover:text-white/75"
                >
                  Restart
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline panel */}
      {mode === 'timeline' && (
        <div className="absolute top-0 right-0 bottom-0 z-20 w-[340px] bg-black/96 border-l border-white/8 overflow-y-auto">
          <div className="sticky top-0 bg-black/90 p-4 border-b border-white/8">
            <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">Timeline</p>
            <h2 className="text-lg font-black text-white">Comedy Eras</h2>
          </div>
          <div className="p-4 space-y-3">
            {timelineMoments.map((moment) => (
              <article key={moment.year} className="rounded-xl border border-white/8 bg-white/4 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl font-black text-red-400">{moment.year}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/35 bg-white/8 rounded-full px-2 py-0.5 mt-1">
                    {moment.era}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mb-1.5">{moment.title}</h3>
                <p className="text-[11px] text-white/52 leading-relaxed">{moment.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
