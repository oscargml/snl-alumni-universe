'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  timelineMoments,
  triviaQuestions,
  universeEdges,
  universeNodes,
  type UniverseNode,
} from '../lib/snl-universe';

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

const SPONSOR_ADS = [
  {
    title: "Old Glory Insurance",
    text: "Protecting you from metal monster robot attacks since 1995. 'They eat medicine for fuel... and they're strong!' Get covered today.",
    cta: "Request Old Glory Quote"
  },
  {
    title: "Colon Blow Cereal",
    text: "The high-fiber oat bran breakfast sensation. Warning: It takes over 30,000 bowls of regular cereal to match a single serving of Colon Blow!",
    cta: "Calculate Fiber Intake"
  },
  {
    title: "Bass-O-Matic '76",
    text: "Incredible raw fish purée speed. Clean, seamless, and completely blended directly into a beautiful glass beverage. 'Mmm, that's great bass!'",
    cta: "Watch Demonstration Video"
  }
];

export default function SnlUniverseExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Refs for stable paint callbacks (avoid stale closures in rAF loop)
  const highlightNodesRef = useRef<Set<string>>(new Set());
  const highlightLinksRef = useRef<Set<string>>(new Set());
  const activeNodeRef = useRef<UniverseNode | null>(null);
  const modeRef = useRef<Mode>('explore');
  const nodeByIdRef = useRef<Map<string, UniverseNode>>(new Map());
  const typeFilterRef = useRef<UniverseNode['type'] | null>(null);

  const [mounted, setMounted] = useState(false);
  const [dims, setDims] = useState({ w: 800, h: 500 });
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
  const [typeFilter, setTypeFilter] = useState<UniverseNode['type'] | null>(null);

  // --- Premium AI & Monetization Simulator States ---
  const [monetizeHubOpen, setMonetizeHubOpen] = useState(false);
  const [simAds, setSimAds] = useState(true);
  const [simAffiliates, setSimAffiliates] = useState(true);
  const [simPremiumUnlocked, setSimPremiumUnlocked] = useState(false);
  const [sponsorIdx, setSponsorIdx] = useState(0);

  // Dynamic interactive feed log matches design "Recent Discoveries"
  const [logs, setLogs] = useState<Array<{ id: string; type: 'info' | 'ai' | 'success' | 'click'; text: string; subText?: string }>>([
    { id: '1', type: 'info', text: 'SNL Alumni Universe initialized', subText: '164 directory entries matched' },
    { id: '2', type: 'success', text: 'D3 Core Force Engine loaded', subText: 'Operational @ 60fps' },
    { id: '3', type: 'ai', text: 'Gemini AI Live Grounding active', subText: 'Ready for interactive prompts' },
  ]);

  const addLog = useCallback((type: 'info' | 'ai' | 'success' | 'click', text: string, subText?: string) => {
    setLogs((prev) => [
      { id: Date.now().toString() + Math.random().toString().slice(2, 6), type, text, subText },
      ...prev.slice(0, 19)
    ]);
  }, []);

  // AI Comedy Historian states
  const [historianLoading, setHistorianLoading] = useState(false);
  const [historianResponse, setHistorianResponse] = useState<string | null>(null);
  const [historianQuery, setHistorianQuery] = useState("");

  // AI Trivia states
  const [aiTriviaLoading, setAiTriviaLoading] = useState(false);
  const [aiTriviaQuestion, setAiTriviaQuestion] = useState<any | null>(null);
  const [isAiTrivia, setIsAiTrivia] = useState(false);

  // Rotate through simulated ads for witty retro vibes
  useEffect(() => {
    if (!simAds) return;
    const interval = setInterval(() => {
      setSponsorIdx((s) => (s + 1) % SPONSOR_ADS.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [simAds]);

  // Clears AI reports when swapping active node
  useEffect(() => {
    setHistorianResponse(null);
    setHistorianQuery("");
  }, [activeNode]);

  // Keep refs in sync with state so stable paint callbacks see latest values
  useEffect(() => { highlightNodesRef.current = highlightNodes; }, [highlightNodes]);
  useEffect(() => { highlightLinksRef.current = highlightLinks; }, [highlightLinks]);
  useEffect(() => { activeNodeRef.current = activeNode; }, [activeNode]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { typeFilterRef.current = typeFilter; }, [typeFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ResizeObserver for responsive canvas scaling matching layout bounds
  useEffect(() => {
    if (!mounted || !resizeRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({
          w: width || 800,
          h: height || 500,
        });
      }
    });
    observer.observe(resizeRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  // Keep track of window mouse for custom tooltip positioning
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
      const filter = typeFilterRef.current;
      const uNode = node as UniverseNode;
      const color = nodeColor(uNode);
      const isSNL = node.id === 'snl';
      const isActive = active?.id === node.id;
      const passesFilter = !filter || uNode.type === filter || isSNL;
      const isHighlighted = (hl.size === 0 || hl.has(node.id)) && passesFilter;

      const baseSize = isSNL ? 11 : 6;
      const size = isActive ? baseSize * 1.45 : baseSize;
      const alpha = isHighlighted ? 1 : 0.1;

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
      addLog('click', `Selected ${uNode.name}`, `${uNode.role || uNode.type}`);
    },
    [addLog],
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
        .backgroundColor('#0A0C10')
        .nodeCanvasObject(paintNode)
        .nodeCanvasObjectMode(() => 'replace')
        .linkCanvasObject(paintLink)
        .linkCanvasObjectMode(() => 'replace')
        .onNodeClick(handleNodeClick)
        .onNodeHover(handleNodeHover)
        .nodePointerAreaPaint(paintPointerArea)
        .nodeLabel('')
        .autoPauseRedraw(false) // keep painting so filter/highlight/link-pulse stay live
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

  // Update dimensions when size updates occur
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
      addLog('info', `Swapped focus mode to ${m.toUpperCase()}`);
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
    },
    [addLog],
  );

  const flyToNode = useCallback((id: string) => {
    const gNode = (graphData.nodes as any[]).find((n: any) => n.id === id);
    if (gNode && graphRef.current) {
      graphRef.current.centerAt(gNode.x, gNode.y, 600);
      graphRef.current.zoom(3.5, 600);
    }
  }, [graphData]);

  const surpriseMe = useCallback(() => {
    const pool = universeNodes.filter((n) => n.id !== 'snl');
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setMode('explore');
    setActiveNode(pick);
    setSidebarOpen(true);
    flyToNode(pick.id);
    addLog('click', `Casino surprise match picked ${pick.name}`);
  }, [flyToNode, addLog]);

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

  // Group alumni dynamically by eras matching high-density mock catalog
  const groupedAlumni = useMemo(() => {
    const groups: Record<string, UniverseNode[]> = {
      "The Golden Age (1975-1980)": [],
      "The Transition Era (1980-1986)": [],
      "The Renaissance (1986-1995)": [],
      "The Millennium Cast (1995-2010)": [],
      "The Modern Era (2010-Pres)": []
    };

    const pool = universeNodes.filter(n => n.type === 'alumni' || n.type === 'creator');
    
    for (const n of pool) {
      const start = parseInt(n.years?.split('-')[0] || '1975');
      if (start < 1980) {
        groups["The Golden Age (1975-1980)"].push(n);
      } else if (start < 1986) {
        groups["The Transition Era (1980-1986)"].push(n);
      } else if (start < 1995) {
        groups["The Renaissance (1986-1995)"].push(n);
      } else if (start < 2010) {
        groups["The Millennium Cast (1995-2010)"].push(n);
      } else {
        groups["The Modern Era (2010-Pres)"].push(n);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const filtered: Record<string, UniverseNode[]> = {};
      for (const [key, list] of Object.entries(groups)) {
        const match = list.filter(item => item.name.toLowerCase().includes(q));
        if (match.length > 0) {
          filtered[key] = match;
        }
      }
      return filtered;
    }

    return groups;
  }, [search]);

  const trivia = triviaQuestions[triviaIndex];
  const currentTrivia = isAiTrivia && aiTriviaQuestion ? aiTriviaQuestion : trivia;
  const triviaCorrect = triviaAnswer === currentTrivia.answer;
  const alumniNodes = universeNodes.filter((n) => n.type === 'alumni');

  // Lazy fetchers, topologically safe here
  const askAIHistorian = async (nodeName: string, nodeType: string, customQuery?: string) => {
    setHistorianLoading(true);
    setHistorianResponse(null);
    try {
      const parentConnections = activeConnections.map(c => ({ name: c.node.name, relation: c.edge.relation }));
      const res = await fetch("/api/comedy-historian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeName,
          nodeType,
          query: customQuery || null,
          currentConnections: parentConnections
        })
      });
      const data = await res.json();
      if (data.error) {
        setHistorianResponse(`Error: ${data.error}`);
      } else {
        setHistorianResponse(data.result);
      }
    } catch (e: any) {
      setHistorianResponse(`Error connecting: ${e.message}`);
    } finally {
      setHistorianLoading(false);
    }
  };

  const fetchAiTrivia = async () => {
    setAiTriviaLoading(true);
    setTriviaAnswer(null);
    try {
      const res = await fetch("/api/generate-trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answeredIds: [],
          category: "SNL Alumni connections, characters, and comedy films"
        })
      });
      const data = await res.json();
      if (data.prompt && data.options && data.answer) {
        setAiTriviaQuestion(data);
        setIsAiTrivia(true);
      }
    } catch (e: any) {
      console.error("AI Trivia error: ", e);
      addLog('info', 'Fall back to static questions due to backend offline');
    } finally {
      setAiTriviaLoading(false);
    }
  };

  const activeSponsor = SPONSOR_ADS[sponsorIdx];

  return (
    <div className="flex flex-col h-screen w-full bg-[#0F1115] text-slate-300 font-sans overflow-hidden select-none">
      
      {/* Header / Navigation */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#161920] shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center font-bold text-[#0F1115] font-display">
            SNL
          </div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-tight flex items-center gap-1">
            Alumni Universe <span className="text-[10px] font-mono text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded ml-2">V2.4.0</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {(['explore', 'path', 'trivia', 'timeline'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`cursor-pointer pb-4 mt-4 transition-colors ${
                  mode === m ? 'text-amber-500 border-b-2 border-amber-500 font-bold' : 'hover:text-white'
                }`}
              >
                {m === 'explore' ? 'Relationship Map' : m === 'path' ? 'Six Degrees' : m === 'trivia' ? 'Interactive Trivia' : 'Comedy Eras'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={surpriseMe}
              title="Jump to a random corner of the universe"
              className="px-3 py-1.5 rounded bg-slate-800 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            >
              🎲 Surprise Me
            </button>
            <button
              onClick={() => setMonetizeHubOpen(true)}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded text-xs font-bold hover:bg-amber-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
            >
              💰 Monetize Hub
            </button>
          </div>
        </div>
      </header>

      {/* Retro comedy mock sponsor banner if enabled */}
      {simAds && (
        <div className="bg-amber-500/5 border-b border-amber-500/10 p-2 px-6 flex items-center justify-between text-xs text-amber-500 select-text shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-500 text-black text-[8px] font-black rounded uppercase tracking-wider font-mono">
              Sponsor AD
            </span>
            <p className="font-sans leading-tight text-[11px]">
              <strong>{activeSponsor.title}:</strong> {activeSponsor.text}
            </p>
          </div>
          <button 
            onClick={() => { setSimAds(false); addLog('info', 'Deactivated fake Sponsor banners'); }} 
            className="text-slate-500 hover:text-amber-500 px-2 font-bold cursor-pointer select-none"
            title="Dismiss Spammer Feed"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Alumni Catalog */}
        <aside className="w-64 border-r border-slate-800 bg-[#12151C] flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 164 Alumni..."
                className="w-full bg-[#1A1E26] border border-slate-700/60 rounded px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer select-none"
                >
                  ×
                </button>
              )}
            </div>
            {/* Legend buttons inside Catalog */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
              <span className="font-bold">FILTER CATEGORY:</span>
              {typeFilter && (
                <button onClick={() => setTypeFilter(null)} className="text-amber-500 hover:underline cursor-pointer">
                  clear ×
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(typeFilter === type ? null : type as any)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all select-none cursor-pointer border ${
                    typeFilter === type
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto text-[11px] divide-y divide-slate-800/30">
            {Object.entries(groupedAlumni).map(([eraName, list]) => (
              <div key={eraName} className="py-2.5">
                <div className="px-4 py-1.5 uppercase text-[9px] font-extrabold text-slate-500 tracking-wider font-mono">
                  {eraName}
                </div>
                <div className="space-y-0.5 mt-1">
                  {(list as UniverseNode[]).map((n) => {
                    const isActive = activeNode?.id === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          setActiveNode(n);
                          setSidebarOpen(true);
                          flyToNode(n.id);
                          addLog('click', `Selected ${n.name}`, `${n.role || n.type}`);
                        }}
                        className={`w-full px-4 py-1.5 text-left flex justify-between items-center hover:bg-slate-800/45 transition-colors cursor-pointer border-l-2 ${
                          isActive 
                            ? 'bg-slate-800/70 border-amber-500 text-white font-bold' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{n.name}</span>
                        <span className="text-[9px] text-amber-500/60 font-mono">
                          {n.years?.slice(0, 4) || 'Cast'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groupedAlumni).length === 0 && (
              <div className="p-4 text-center text-slate-500">
                No matching directory entities.
              </div>
            )}
          </div>
        </aside>

        {/* Center: Relationship & Character Visualization */}
        <section className="flex-1 flex flex-col bg-[#0A0C10] p-6 gap-6 overflow-y-auto">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <div className="bg-[#161920] border border-slate-800 p-3 rounded">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-1 font-mono">TOTAL DATA POINTS</div>
              <div className="text-xl font-bold font-mono text-white leading-none">
                {universeNodes.length + universeEdges.length}
              </div>
              <div className="text-[9px] text-green-500 mt-1 flex items-center gap-1 font-mono">
                <span>⚡</span> {universeNodes.length} nodes · {universeEdges.length} links
              </div>
            </div>
            
            <div className="bg-[#161920] border border-slate-800 p-3 rounded">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-1 font-mono">UNIQUE CHARACTERS</div>
              <div className="text-xl font-bold font-mono text-white leading-none">
                {universeNodes.filter(n => n.type === 'character').length}
              </div>
              <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>★</span> Recurring sketch adaptations
              </div>
            </div>

            <div className="bg-[#161920] border border-slate-800 p-3 rounded">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-1 font-mono">TRIVIA MATCH SCORE</div>
              <div className="text-xl font-bold font-mono text-amber-500 leading-none">
                {triviaScore} pts
              </div>
              <div className="text-[9px] text-amber-500 mt-1 flex items-center gap-1 font-mono">
                <span>{isAiTrivia ? '✨ AI Mode active' : '✓ Static Level active'}</span>
              </div>
            </div>

            <div className="bg-[#161920] border border-slate-800 p-3 rounded">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold mb-1 font-mono">AI GROUNDING STATUS</div>
              <div className="text-xl font-bold font-mono text-cyan-400 leading-none">
                ONLINE
              </div>
              <div className="text-[9px] text-cyan-400 mt-1 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Gemini-3.5-Flash Active
              </div>
            </div>
          </div>

          {/* Interactive Graph Box */}
          <div ref={resizeRef} className="flex-1 bg-[#12151C] border border-slate-800 rounded-lg relative overflow-hidden min-h-[320px]">
            {/* Graph Absolute Canvas */}
            <div ref={containerRef} className="absolute inset-0 z-0" />
            
            {/* SVG Overlays and Labels */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            <div className="absolute top-4 left-4 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-[#161920]/80 px-2.5 py-1 rounded border border-slate-800 z-10 pointer-events-none select-none">
              D3 Live Physics Force Graph Map
            </div>

            {/* Hover tooltip for node summary */}
            {hoveredNode && (
              <div
                className="absolute z-40 pointer-events-none max-w-[220px] rounded-xl bg-[#161920]/96 border border-slate-700 p-3 shadow-2xl font-sans"
                style={{
                  left: Math.min(mousePos.x - (resizeRef.current?.getBoundingClientRect().left || 0) + 14, dims.w - 240),
                  top: Math.min(mousePos.y - (resizeRef.current?.getBoundingClientRect().top || 0) + 14, dims.h - 190),
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: nodeColor(hoveredNode), boxShadow: `0 0 5px ${nodeColor(hoveredNode)}` }}
                  />
                  <span
                    className="text-[8px] font-extrabold uppercase tracking-widest"
                    style={{ color: nodeColor(hoveredNode) }}
                  >
                    {hoveredNode.type}
                  </span>
                </div>
                <p className="font-extrabold text-white text-[12px] leading-tight font-display">{hoveredNode.name}</p>
                {hoveredNode.years && <p className="text-[9px] text-slate-400 font-mono mt-0.5">{hoveredNode.years}</p>}
                {hoveredNode.catchphrases?.[0] && (
                  <p className="mt-1.5 text-[9px] text-amber-300 italic leading-snug">
                    &ldquo;{hoveredNode.catchphrases[0]}&rdquo;
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-slate-400 leading-snug line-clamp-2">{hoveredNode.bio}</p>
              </div>
            )}

            {/* Lower-left screen selector buttons inside graph for mobile */}
            <div className="absolute bottom-4 left-4 z-10 flex gap-1.5 lg:hidden select-none">
              {(['explore', 'path', 'trivia', 'timeline'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                    mode === m 
                      ? 'bg-amber-500 text-black font-extrabold' 
                      : 'bg-[#161920]/90 text-slate-400 border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Lower-right user interactions hints */}
            <div className="absolute bottom-4 right-4 z-10 text-[9px] font-mono text-slate-500 text-right space-y-0.5 pointer-events-none select-none">
              <p>Drag to Pan · Pinch Zoom Wheel</p>
              <p>Select Nodes to Ground Gemini AI</p>
            </div>
          </div>

          {/* Lower Matrix & Controls Rows inside High Density workspace */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            
            {/* Left/Middle Column of Bottom Workspace: Active Mode details */}
            <div className="md:col-span-2 bg-[#161920] border border-slate-800 rounded p-4 flex flex-col justify-between min-h-[160px]">
              
              {mode === 'explore' && (
                <>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5 font-display flex items-center gap-1.5 select-none">
                      <span>👥</span> Popular Recurring Sketches
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {[
                        { id: 'stefon', name: 'Stefon (Bill Hader)', count: '14 Weekend Update spots' },
                        { id: 'matt-foley', name: 'Matt Foley (Chris Farley)', count: '8 Motivational Speeches' },
                        { id: 'wayne-campbell', name: 'Wayne Campbell (Mike Myers)', count: '11 Wayne\'s Worlds' },
                        { id: 'roseanne-roseannadanna', name: 'Roseanne Roseannadanna (Gilda Radner)', count: '12 News Rants' }
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            const node = universeNodes.find(un => un.id === c.id);
                            if (node) {
                              setActiveNode(node);
                              setSidebarOpen(true);
                              flyToNode(node.id);
                              addLog('click', `Focused Character: ${node.name}`, 'Sketch Highlight');
                            }
                          }}
                          className="flex justify-between items-center text-left py-1.5 px-2.5 rounded bg-slate-900/60 border border-slate-800/80 hover:border-amber-400/40 hover:bg-slate-800/20 text-slate-300 transition-all cursor-pointer"
                        >
                          <span className="font-semibold">{c.name}</span>
                          <span className="font-mono text-[9px] text-amber-500">{c.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">
                    Click any signature character to light up their creator and connected movie adapters on the active graph canvas.
                  </p>
                </>
              )}

              {mode === 'path' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2 font-display select-none">
                      Six Degrees · Cast Path Finder
                    </h3>
                    <div className="flex items-center gap-2 select-none">
                      <select
                        value={gameStart}
                        onChange={(e) => { setGameStart(e.target.value); addLog('info', `Changed start node to ${e.target.value}`); }}
                        className="flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        {alumniNodes.map((n) => (
                          <option key={n.id} value={n.id} className="bg-slate-950 font-sans">{n.name}</option>
                        ))}
                      </select>
                      <span className="text-slate-500 text-xs font-mono">→</span>
                      <select
                        value={gameEnd}
                        onChange={(e) => { setGameEnd(e.target.value); addLog('info', `Changed end node to ${e.target.value}`); }}
                        className="flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        {alumniNodes.map((n) => (
                          <option key={n.id} value={n.id} className="bg-slate-950 font-sans">{n.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="my-2 flex-1 min-h-[40px] flex items-center">
                    {gamePath.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        {gamePath.map((id, i) => {
                          const n = nodeById.get(id);
                          if (!n) return null;
                          return (
                            <span key={id} className="flex items-center gap-1">
                              <button
                                onClick={() => { setActiveNode(n); setSidebarOpen(true); flyToNode(id); }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-black cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                style={{ background: nodeColor(n) }}
                              >
                                {n.name}
                              </button>
                              {i < gamePath.length - 1 && (
                                <span className="text-slate-600 font-mono text-[9px]">→</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-sans">No connection path found.</p>
                    )}
                  </div>
                  <p className="text-[9px] font-mono text-slate-500">
                    Path Result: {gamePath.length > 0 ? `${gamePath.length - 1} connections total · Value: ${Math.max(1000 - (gamePath.length - 1) * 125, 250)} pts` : 'Calculating relational coordinates'}
                  </p>
                </div>
              )}

              {mode === 'trivia' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider font-display flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {isAiTrivia ? "✨ Infinite AI Mode" : `Static Index ${triviaIndex + 1}/${triviaQuestions.length}`}
                    </h3>
                    <button
                      onClick={() => {
                        if (isAiTrivia) {
                          setIsAiTrivia(false);
                          setTriviaAnswer(null);
                          addLog('info', 'Swapped back to classic static questions');
                        } else {
                          if (!simPremiumUnlocked) {
                            setMonetizeHubOpen(true);
                          } else {
                            fetchAiTrivia();
                            addLog('ai', 'Triggered Gemini AI to compile connected trivia');
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1 cursor-pointer border bg-slate-900 text-amber-500 border-amber-500/30 hover:bg-slate-800"
                    >
                      {isAiTrivia ? "← Classic Mode" : "✨ Launch AI Trivia"}
                    </button>
                  </div>

                  {aiTriviaLoading ? (
                    <div className="py-2 flex items-center justify-center gap-2 text-center text-[11px] text-cyan-400">
                      <span className="animate-spin">🌀</span> Drafting new connected question...
                    </div>
                  ) : (
                    <div className="space-y-2 select-text">
                      <p className="font-bold text-white text-[12px] leading-relaxed line-clamp-2">{currentTrivia.prompt}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {currentTrivia.options.map((opt) => (
                          <button
                            key={opt}
                            disabled={!!triviaAnswer}
                            onClick={() => {
                              setTriviaAnswer(opt);
                              const isCorrect = opt === currentTrivia.answer;
                              if (isCorrect) {
                                setTriviaScore((s) => s + 250);
                                addLog('success', 'Correct! Answered Trivia', `+250 pts`);
                              } else {
                                addLog('info', 'Incorrect Trivia Answer', `Correct: ${currentTrivia.answer}`);
                              }
                            }}
                            className={`w-full px-2 py-1.5 rounded text-[10px] font-semibold text-left transition-all truncate cursor-pointer ${
                              triviaAnswer === opt
                                ? opt === currentTrivia.answer
                                  ? 'bg-emerald-500 text-white border border-emerald-400'
                                  : 'bg-red-500/40 text-white border border-red-400/40'
                                : triviaAnswer && opt === currentTrivia.answer
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 disabled:cursor-default'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {triviaAnswer && (
                        <div className="flex items-center justify-between text-[11px] mt-2 border-t border-slate-800 pt-1.5 select-none">
                          <span className={triviaCorrect ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                            {triviaCorrect ? 'Valid Connection!' : `Correct: ${currentTrivia.answer}`}
                          </span>
                          {isAiTrivia ? (
                            <button onClick={fetchAiTrivia} className="text-[10px] font-black text-cyan-400 hover:underline cursor-pointer">
                              Deploy Next AI Question →
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (triviaIndex < triviaQuestions.length - 1) {
                                  setTriviaIndex((idx) => idx + 1);
                                } else {
                                  setTriviaIndex(0);
                                  setTriviaScore(0);
                                }
                                setTriviaAnswer(null);
                              }}
                              className="text-[10px] font-black text-amber-500 hover:underline cursor-pointer"
                            >
                              {triviaIndex < triviaQuestions.length - 1 ? 'Next Question →' : 'Restart Challenge'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {mode === 'timeline' && (
                <div>
                  <h3 className="text-xs font-black uppercase text-red-400 tracking-wider mb-2 font-display select-none">
                    Comedy Eras Index & Key Turning Points
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] select-text">
                    {timelineMoments.slice(0, 3).map((moment) => (
                      <div key={moment.year} className="min-w-[170px] bg-slate-900/60 border border-slate-800 rounded p-2.5 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-rose-400 font-black font-mono text-sm">{moment.year}</span>
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">{moment.era}</span>
                        </div>
                        <p className="font-bold text-white text-[11px] truncate">{moment.title}</p>
                        <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5">{moment.detail}</p>
                      </div>
                    ))}
                    <div className="min-w-[120px] bg-slate-900 border border-dashed border-rose-500/10 hover:border-rose-500/30 rounded flex flex-col justify-center items-center text-center p-2">
                      <p className="text-[9px] text-rose-300 font-bold uppercase select-none">Full Matrix</p>
                      <button onClick={() => switchMode('timeline')} className="text-[10px] text-slate-500 mt-1 hover:underline cursor-pointer select-none">
                        Browse Eras →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column of Bottom Workspace: Premium Monetization Hook */}
            <div className="bg-gradient-to-br from-amber-600/90 to-amber-900/90 border border-amber-600/30 rounded p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
              <div>
                <div className="flex items-center gap-1.5 select-none">
                  <span className="text-sm">👑</span>
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider font-display">Monetize Core Research</h3>
                </div>
                <p className="text-amber-100 text-[10px] leading-relaxed mt-1.5 select-text">
                  Unlock fully responsive AI-Grounding endpoints, unreleased character matrices, and unlisted movie collaborations today.
                </p>
              </div>
              <button
                onClick={() => { setMonetizeHubOpen(true); addLog('info', 'Opened Sandbox monetization center'); }}
                className="w-full bg-black hover:bg-zinc-950 text-white py-2 rounded text-[10px] font-black uppercase tracking-wider mt-3 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer shadow-lg select-none"
              >
                GET SANDBOX PRO API ACCESS
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Feed & Active Node Metadata */}
        <aside className="w-64 border-l border-slate-800 bg-[#12151C] flex flex-col shrink-0 overflow-hidden text-[11px]">
          
          {activeNode && mode !== 'timeline' ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              
              {/* Node selection card header */}
              <div className="relative shrink-0">
                <button
                  onClick={() => { setActiveNode(null); addLog('info', 'Cleared active selection'); }}
                  className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-black/40 hover:bg-black/85 flex items-center justify-center text-xs text-white/70 hover:text-white transition-colors cursor-pointer select-none"
                  title="Clear selection"
                >
                  ×
                </button>
                <div className={`h-24 bg-gradient-to-br ${activeNode.imageTone} p-4 flex flex-col justify-end relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-white bg-black/30 px-1.5 py-0.5 rounded">
                      {activeNode.type}
                    </span>
                    <h2 className="text-base font-black text-white leading-tight mt-1 truncate">{activeNode.name}</h2>
                    {activeNode.years && <p className="text-[10px] text-white/70 font-mono mt-0.5">{activeNode.years}</p>}
                  </div>
                </div>
              </div>

              {/* Node parameters */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto select-text">
                {activeNode.role && <p className="text-xs font-bold text-amber-400 font-display leading-tight">{activeNode.role}</p>}
                
                <p className="text-[11px] text-slate-300 leading-normal font-sans">{activeNode.bio}</p>

                {activeNode.catchphrases?.length ? (
                  <div className="rounded border border-slate-800 bg-slate-950/40 p-2.5 text-slate-300 italic font-sans">
                    {activeNode.catchphrases.map((c) => (
                      <p key={c} className="text-[10px] text-amber-300 leading-tight">
                        &ldquo;{c}&rdquo;
                      </p>
                    ))}
                  </div>
                ) : null}

                {activeNode.highlights?.length ? (
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 font-mono">HIGHLIGHT SKETCHES</p>
                    <div className="space-y-0.5">
                      {activeNode.highlights.map((h) => (
                        <p key={h} className="text-[10px] text-slate-400 py-0.5 border-b border-slate-800/20">· {h}</p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Simulated Affiliate Bookstore if active */}
                {simAffiliates && (
                  <div className="rounded border border-[#FF9900]/20 bg-[#FF9900]/5 p-3 space-y-2 select-text font-sans">
                    <p className="text-[8px] font-extrabold uppercase tracking-widest text-[#FF9900] flex items-center gap-1 font-mono">
                      🛒 BOOKSHOP COMPLIANT
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📚</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{activeNode.name}&apos;s Biography</p>
                        <p className="text-[8px] text-slate-400 truncate">Oral History of late-night comedy</p>
                      </div>
                    </div>
                    <a
                      href="https://amazon.com"
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center bg-[#FF9900] hover:bg-[#FF9900]/90 text-black text-[9px] font-extrabold py-1 px-2 rounded transition-colors cursor-pointer select-none"
                    >
                      View on Amazon (10% affiliate split)
                    </a>
                  </div>
                )}

                {/* Simulated AI Comedy Historian portal */}
                <div className="rounded border border-dashed border-amber-400/25 bg-amber-400/5 p-3 space-y-2 relative overflow-hidden font-sans">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/5 blur-xl rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1 font-mono">
                      <span>✨</span> AI Comedy Historian
                    </p>
                    {!simPremiumUnlocked && (
                      <span className="text-[8px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-1 py-0.5 rounded font-bold font-mono">
                        PRO
                      </span>
                    )}
                  </div>

                  {!simPremiumUnlocked ? (
                    <div className="text-center py-1 space-y-2">
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Enable Pro AI Historian to compile collaborations and unlisted backstage credits.
                      </p>
                      <button
                        onClick={() => { setSimPremiumUnlocked(true); addLog('success', 'Unlocked Pro Universe plus Tier'); }}
                        className="inline-block w-full py-1 px-2 rounded bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black transition-all cursor-pointer select-none"
                      >
                        Unlock Sandbox Premium
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historianResponse ? (
                        <div className="rounded bg-[#0A0C10] border border-slate-800 p-2 text-[10px] text-slate-300 leading-normal max-h-36 overflow-y-auto whitespace-pre-line text-left">
                          {historianResponse}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Ask unlisted credits or obscure collaborations matching {activeNode.name} compiled using Gemini.
                        </p>
                      )}

                      {historianLoading ? (
                        <div className="flex items-center justify-center gap-1.5 py-1">
                          <span className="animate-spin text-amber-400 text-xs">🌀</span>
                          <span className="text-[9px] text-amber-400 font-bold font-mono">Searching comedy archives...</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              askAIHistorian(activeNode.name, activeNode.type);
                              addLog('ai', `Querying Gemini Historian about ${activeNode.name}`);
                            }}
                            className="w-full py-1 text-center rounded bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 text-amber-300 text-[9px] font-black tracking-wide cursor-pointer select-none font-mono"
                          >
                            🔍 Discover Obscure Facts
                          </button>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={historianQuery}
                              onChange={(e) => setHistorianQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && historianQuery.trim()) {
                                  askAIHistorian(activeNode.name, activeNode.type, historianQuery);
                                  addLog('ai', `Custom Query: '${historianQuery}' about ${activeNode.name}`);
                                }
                              }}
                              placeholder="Ask credits, facts..."
                              className="flex-1 min-w-0 bg-black/50 border border-slate-800 rounded px-2 py-1 text-[10px] text-white placeholder:text-slate-600 outline-none focus:border-amber-400/40"
                            />
                            <button
                              disabled={!historianQuery.trim()}
                              onClick={() => {
                                askAIHistorian(activeNode.name, activeNode.type, historianQuery);
                                addLog('ai', `Custom Query: '${historianQuery}'`);
                              }}
                              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 rounded text-black text-[10px] font-black disabled:opacity-40 cursor-pointer select-none"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connections section */}
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 font-mono">
                    CONNECTIONS ({activeConnections.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {activeConnections.map(({ edge, node: n }) => (
                      <button
                        key={`${edge.source as string}-${edge.target as string}`}
                        onClick={() => { setActiveNode(n); flyToNode(n.id); addLog('click', `Traversed path: ${activeNode.name} → ${n.name}`); }}
                        className="flex w-full items-center gap-2 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 hover:border-amber-400/35 text-left transition-colors cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: nodeColor(n) }} />
                        <span className="flex-1 min-w-0 font-sans">
                          <span className="block text-[11px] font-bold text-white truncate leading-tight">{n.name}</span>
                          <span className="block text-[9px] text-slate-400 truncate leading-none mt-0.5">{edge.relation}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Default right sidebar panel: Discoveries log and uptime matrix */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-3 text-[10px] font-extrabold text-slate-500 uppercase border-b border-slate-800 font-mono tracking-wider select-none">
                Interactive Discoveries Log
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-[9px] select-text">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/20 hover:bg-slate-950/50 transition-colors">
                    <div className="flex items-center gap-1.5 leading-none select-none">
                      <span className={`w-1 h-1 rounded-full shrink-0 ${
                        log.type === 'click' ? 'bg-amber-500' :
                        log.type === 'ai' ? 'bg-cyan-400' :
                        log.type === 'success' ? 'bg-green-400' : 'bg-slate-400'
                      }`} />
                      <span className={`text-[7px] font-extrabold uppercase ${
                        log.type === 'click' ? 'text-amber-500' :
                        log.type === 'ai' ? 'text-cyan-400' :
                        log.type === 'success' ? 'text-green-500' : 'text-slate-500'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                    <div className="text-white mt-1 leading-snug">{log.text}</div>
                    {log.subText && <div className="text-slate-500 text-[8px] mt-0.5 italic">{log.subText}</div>}
                  </div>
                ))}
              </div>

              {/* Client diagnostics */}
              <div className="p-3 bg-[#161920] border-t border-slate-800 font-mono space-y-1 text-slate-500 select-text">
                <div className="flex justify-between">
                  <span>DB Uptime</span>
                  <span className="text-green-400 font-bold">99.98%</span>
                </div>
                <div className="flex justify-between">
                  <span>Grounding Hook</span>
                  <span className="text-green-400">Operational</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>Vitals Index</span>
                  <span>AFK-9902</span>
                </div>
              </div>

            </div>
          )}

          {/* Full eras timeline overlay if selected */}
          {mode === 'timeline' && (
            <div className="absolute inset-0 bg-[#12151C] z-20 flex flex-col overflow-hidden border-l border-slate-800">
              <div className="p-3 text-[10px] font-extrabold text-[#888] uppercase border-b border-slate-800 font-mono tracking-wider select-none">
                SNL Comedy Eras Matrix
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {timelineMoments.map((moment) => (
                  <article key={moment.year} className="rounded border border-slate-800 bg-slate-900/35 p-3 select-text hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-start justify-between gap-1 mb-1 font-mono">
                      <span className="text-base font-black text-rose-500 leading-none">{moment.year}</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-800 px-1 py-0.5 rounded leading-none">
                        {moment.era}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white leading-tight mb-1">{moment.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{moment.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

        </aside>

      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-amber-500 text-black flex items-center justify-between px-4 text-[9px] font-bold uppercase shrink-0 font-mono select-none">
        <div className="flex gap-4">
          <span>Project: snl-alumni-universe</span>
          <span className="hidden sm:inline">Repository: oscargml/snl-alumni-universe</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">Client Module: D3-Graph</span>
          <span>Session Sync: LIVE</span>
        </div>
      </footer>

      {/* Monetize Hub Modal Overlay */}
      {monetizeHubOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12151C] border border-slate-800 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl relative select-text font-sans">
            <div className="bg-[#161920] border-b border-slate-800 p-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm">💰</span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Research Monetization</h2>
              </div>
              <button
                onClick={() => setMonetizeHubOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-lg select-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-normal font-sans">
                Toggle simulated paywalls or ads in your sandbox environment. These replicate real-world monetized interfaces inside the browser client.
              </p>

              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                {/* Paywall Tier toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={simPremiumUnlocked}
                    onChange={(e) => {
                      setSimPremiumUnlocked(e.target.checked);
                      addLog('success', e.target.checked ? 'Unlocked Universe+ PRO Access' : 'Reactivated PRO paywall gate');
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-bold text-white group-hover:text-amber-500 transition-colors">
                      Unlock Universe+ PRO Gate
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Grants absolute access to live Gemini-powered AI historian and connected infinite trivia.
                    </p>
                  </div>
                </label>

                {/* Sponsor Advertisement Banner toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={simAds}
                    onChange={(e) => {
                      setSimAds(e.target.checked);
                      addLog('info', e.target.checked ? 'Sponsor banners enabled' : 'Sponsor banners disabled');
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-bold text-white group-hover:text-amber-500 transition-colors">
                      Serve Sponsor Banners
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Renders witty retro Saturday Night Live promotional slots (Old Glory, Colon Blow) at the header.
                    </p>
                  </div>
                </label>

                {/* Amazon Affiliate link banner toggle */}
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={simAffiliates}
                    onChange={(e) => {
                      setSimAffiliates(e.target.checked);
                      addLog('info', e.target.checked ? 'Bookshop split activated' : 'Bookshop split deactivated');
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-bold text-white group-hover:text-amber-500 transition-colors">
                      Bookshop Bookstore Affiliates
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Renders Amazon biography links when select cast memories are loaded.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-[#161920] border-t border-slate-800 p-3 flex justify-end gap-2 select-none">
              <button
                onClick={() => {
                  setSimPremiumUnlocked(true);
                  setSimAds(true);
                  setSimAffiliates(true);
                  addLog('success', 'Maximized Sandbox performance options');
                  setMonetizeHubOpen(false);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 text-[10px] font-black uppercase transition-all cursor-pointer rounded"
              >
                Maximize All
              </button>
              <button
                onClick={() => setMonetizeHubOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 text-[10px] font-bold transition-all cursor-pointer rounded font-mono"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
