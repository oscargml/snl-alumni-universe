'use client';

import { useMemo, useState } from 'react';
import {
  timelineMoments,
  triviaQuestions,
  universeEdges,
  universeNodes,
  type UniverseNode,
  type UniverseNodeType,
} from '@/lib/snl-universe';

const nodeTypeLabels: Record<UniverseNodeType, string> = {
  alumni: 'Alumni',
  movie: 'Movie',
  tv: 'TV',
  character: 'Character',
  creator: 'Creator',
  award: 'Award',
};

const nodePositions: Record<string, { x: number; y: number }> = {
  snl: { x: 50, y: 48 },
  'bill-murray': { x: 27, y: 29 },
  'dan-aykroyd': { x: 18, y: 51 },
  'eddie-murphy': { x: 26, y: 72 },
  'tina-fey': { x: 58, y: 25 },
  'amy-poehler': { x: 72, y: 34 },
  'maya-rudolph': { x: 83, y: 57 },
  'adam-sandler': { x: 39, y: 80 },
  'chris-rock': { x: 54, y: 84 },
  'andy-samberg': { x: 72, y: 78 },
  'kristen-wiig': { x: 88, y: 76 },
  'will-ferrell': { x: 39, y: 16 },
  'lorne-michaels': { x: 48, y: 10 },
  ghostbusters: { x: 10, y: 34 },
  'mean-girls': { x: 67, y: 13 },
  'thirty-rock': { x: 83, y: 19 },
  'parks-rec': { x: 89, y: 39 },
  bridesmaids: { x: 96, y: 67 },
  stefon: { x: 62, y: 67 },
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function findPath(startId: string, endId: string) {
  const queue: string[][] = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    const last = path[path.length - 1];
    if (last === endId) return path;

    universeEdges
      .filter((edge) => edge.source === last || edge.target === last)
      .map((edge) => (edge.source === last ? edge.target : edge.source))
      .forEach((next) => {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      });
  }

  return [];
}

export default function SnlUniverseExplorer() {
  const [activeId, setActiveId] = useState('bill-murray');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UniverseNodeType | 'all'>('all');
  const [gameStart, setGameStart] = useState('adam-sandler');
  const [gameEnd, setGameEnd] = useState('eddie-murphy');
  const [selectedTrivia, setSelectedTrivia] = useState<string | null>(null);

  const nodeById = useMemo(() => new Map(universeNodes.map((node) => [node.id, node])), []);
  const activeNode = nodeById.get(activeId) ?? universeNodes[0];
  const activeConnections = universeEdges
    .filter((edge) => edge.source === activeNode.id || edge.target === activeNode.id)
    .map((edge) => ({
      edge,
      node: nodeById.get(edge.source === activeNode.id ? edge.target : edge.source),
    }))
    .filter((item): item is { edge: (typeof universeEdges)[number]; node: UniverseNode } =>
      Boolean(item.node),
    );

  const filteredNodes = universeNodes.filter((node) => {
    const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || node.type === filter;
    return matchesQuery && matchesFilter;
  });

  const gamePath = findPath(gameStart, gameEnd);
  const trivia = triviaQuestions[0];
  const isCorrect = selectedTrivia === trivia.answer;

  return (
    <main className="min-h-screen overflow-hidden bg-[#111112] text-stone-100">
      <section className="relative min-h-[92vh] border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(222,49,49,0.22),transparent_28%),linear-gradient(135deg,#111112_0%,#171717_42%,#2b1711_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_360px]">
          <div className="min-h-[620px] rounded-lg border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/30 backdrop-blur">
            <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-300">
                  Interactive comedy database
                </p>
                <h1 className="mt-2 max-w-3xl text-4xl font-black leading-none text-white sm:text-6xl lg:text-7xl">
                  Saturday Night Live Alumni Universe
                </h1>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['19', 'Nodes'],
                  ['31', 'Links'],
                  ['6', 'Modes'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                    <div className="text-xl font-black text-white">{value}</div>
                    <div className="text-[11px] uppercase tracking-widest text-stone-400">{label}</div>
                  </div>
                ))}
              </div>
            </header>

            <div className="relative h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[#151515]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {universeEdges.map((edge) => {
                  const source = nodePositions[edge.source];
                  const target = nodePositions[edge.target];
                  const isActive = edge.source === activeNode.id || edge.target === activeNode.id;

                  return (
                    <line
                      key={`${edge.source}-${edge.target}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isActive ? '#f7c948' : 'rgba(255,255,255,0.22)'}
                      strokeWidth={isActive ? 0.42 : 0.18}
                    />
                  );
                })}
              </svg>

              {universeNodes.map((node) => {
                const position = nodePositions[node.id];
                const isActive = node.id === activeNode.id;
                const isConnected = activeConnections.some((connection) => connection.node.id === node.id);

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-2 py-1 text-left text-xs font-bold shadow-lg transition ${
                      isActive
                        ? 'z-20 border-amber-200 bg-amber-300 text-black shadow-amber-500/30'
                        : isConnected
                          ? 'z-10 border-white/35 bg-white text-black'
                          : 'border-white/10 bg-black/70 text-stone-200 hover:border-white/40'
                    }`}
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    aria-label={`Open ${node.name}`}
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${node.imageTone} text-[10px] font-black text-white`}
                    >
                      {initials(node.name)}
                    </span>
                    <span className="hidden max-w-[96px] truncate sm:block">{node.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#181818] p-4 shadow-2xl shadow-black/30">
            <div
              className={`mb-4 grid aspect-[16/9] place-items-end rounded-lg bg-gradient-to-br ${activeNode.imageTone} p-4`}
            >
              <div className="w-full">
                <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  {nodeTypeLabels[activeNode.type]}
                </span>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white">{activeNode.name}</h2>
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-200">
              {activeNode.role} {activeNode.years ? `| ${activeNode.years}` : ''}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-300">{activeNode.bio}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeNode.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/8 px-3 py-1 text-xs text-stone-200">
                  {tag}
                </span>
              ))}
            </div>

            <section className="mt-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Connected to</h3>
              <div className="mt-3 space-y-2">
                {activeConnections.slice(0, 6).map(({ edge, node }) => (
                  <button
                    key={`${edge.source}-${edge.target}`}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-amber-300/70"
                  >
                    <span>
                      <span className="block text-sm font-bold text-white">{node.name}</span>
                      <span className="block text-xs text-stone-400">{edge.relation}</span>
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {edge.project ?? nodeTypeLabels[node.type]}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="bg-[#f4efe6] px-4 py-12 text-[#181818] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[320px_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">Discovery console</p>
            <h2 className="mt-2 text-3xl font-black">Search the seed universe</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              This MVP starts with a curated set of alumni, films, shows, characters, and producer links.
            </p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-5 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-700"
              placeholder="Search Bill, Tina, Ghostbusters..."
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['all', 'alumni', 'movie', 'tv', 'character', 'creator'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                    filter === item
                      ? 'border-[#181818] bg-[#181818] text-white'
                      : 'border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  {item === 'all' ? 'All' : nodeTypeLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveId(node.id)}
                className="rounded-lg border border-stone-300 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-700"
              >
                <div
                  className={`mb-4 grid aspect-[16/7] place-items-center rounded-lg bg-gradient-to-br ${node.imageTone}`}
                >
                  <span className="text-3xl font-black text-white">{initials(node.name)}</span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-red-700">
                  {nodeTypeLabels[node.type]}
                </p>
                <h3 className="mt-1 text-xl font-black">{node.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{node.bio}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#181818] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Six Degrees mode</p>
            <h2 className="mt-2 text-3xl font-black">Connection Chains</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <select
                value={gameStart}
                onChange={(event) => setGameStart(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#111112] px-3 py-3 text-sm"
              >
                {universeNodes
                  .filter((node) => node.type === 'alumni')
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
              </select>
              <select
                value={gameEnd}
                onChange={(event) => setGameEnd(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#111112] px-3 py-3 text-sm"
              >
                {universeNodes
                  .filter((node) => node.type === 'alumni')
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {gamePath.map((id, index) => {
                const node = nodeById.get(id);
                if (!node) return null;

                return (
                  <span key={id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveId(id)}
                      className="rounded-full bg-amber-300 px-3 py-2 text-xs font-black text-black"
                    >
                      {node.name}
                    </button>
                    {index < gamePath.length - 1 ? <span className="text-stone-500">/</span> : null}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-stone-400">
              Score preview: {Math.max(1000 - gamePath.length * 125, 250)} points for a{' '}
              {gamePath.length - 1}-link path.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Trivia mode</p>
            <h2 className="mt-2 text-3xl font-black">Hardcore fan check</h2>
            <p className="mt-4 text-lg font-bold">{trivia.prompt}</p>
            <div className="mt-5 grid gap-2">
              {trivia.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedTrivia(option)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-bold ${
                    selectedTrivia === option
                      ? option === trivia.answer
                        ? 'border-emerald-300 bg-emerald-300 text-black'
                        : 'border-red-300 bg-red-300 text-black'
                      : 'border-white/10 bg-[#111112] text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {selectedTrivia ? (
              <p className="mt-4 text-sm font-bold text-stone-300">
                {isCorrect
                  ? 'Correct. That is a clean read of the map.'
                  : 'Not quite. Follow the Tina Fey node and try again.'}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-[#f4efe6] px-4 py-12 text-[#181818] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">Timeline mode</p>
          <h2 className="mt-2 text-3xl font-black">Comedy eras from 1975 onward</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {timelineMoments.map((moment) => (
              <article key={moment.year} className="rounded-lg border border-stone-300 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-3xl font-black text-red-700">{moment.year}</span>
                  <span className="rounded-full bg-[#181818] px-3 py-1 text-xs font-bold text-white">
                    {moment.era}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black">{moment.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{moment.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
