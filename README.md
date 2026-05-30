# SNL Alumni Universe 🌌

An interactive, galaxy-style map of the *Saturday Night Live* extended universe — cast
members, writers, the films and TV shows they spun off, their most famous recurring
characters, the awards they won, and the web of collaborations that ties five decades
of comedy together.

It renders as a dark, force-directed graph you can fly through, plus four modes:

| Mode | What it does |
| --- | --- |
| **Explore** | Click any node to open a detail panel: bio, catchphrases, tags, highlights, awards, and clickable connections. |
| **Path Finder** | "Six Degrees of SNL" — pick two alumni and the app BFS-searches the shortest chain of connections between them, scored by hops. |
| **Trivia** | A quick multiple-choice game drawn from the universe data. |
| **Timeline** | Scroll the comedy eras, from the 1975 original cast to the streaming-era diaspora. |

Extras: a 🎲 **Surprise me** button drops you on a random corner of the universe, the
**legend doubles as a filter** (click a node type to spotlight just alumni, movies,
characters, etc.), live search, and hover tooltips.

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **[`force-graph`](https://github.com/vasturiano/force-graph)** — canvas 2D force-directed graph (lightweight; no WebGL/three.js)

The graph is painted with custom canvas callbacks that read from refs (not state), so the
render loop never sees stale closures. The whole dataset lives in a single typed module —
[`lib/snl-universe.ts`](lib/snl-universe.ts) — as `universeNodes`, `universeEdges`,
`timelineMoments`, and `triviaQuestions`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Adding to the universe

Everything is data-driven, so growing the universe means editing one file:

1. **Add a node** to `universeNodes` (`type` is `alumni | movie | tv | character | creator | award`).
   Give it a unique `id`, a `bio`, an `imageTone` (a Tailwind gradient for the detail header),
   and optional `catchphrases` / `awards`.
2. **Connect it** by adding `universeEdges` entries. `source`/`target` are node ids,
   `strength` (1–5) controls link weight, and `relation` is the human-readable label.
3. Both endpoints of every edge must reference a real node id, ids must be unique, and
   each trivia `answer` must appear in its own `options`. (A quick Node script over the
   exports catches all four; the production build typechecks the shapes.)

Current size: **120 nodes / 208 edges** across 45 alumni, 32 films, 18 shows, 17 characters,
5 creators, and 3 awards.

---

# 💰 Monetization plan

The product is a niche-but-passionate fandom toy with strong shareability ("look how
Bill Murray connects to Pete Davidson in 3 hops"). The strategy is to grow free reach
first, then layer revenue without breaking the free explore experience.

### Phase 0 — Foundation (now → launch)
- Ship the free site, get it indexed (sitemap/robots already present), and instrument
  analytics + event tracking (path searches run, trivia completions, shares).
- Add **Open Graph share images** per node/path so a found connection generates a
  rich social card — this is the primary free-growth loop.

### Phase 1 — Ads & affiliate (lowest-effort revenue)
- **Display ads** (Google AdSense / Mediavine once traffic qualifies) in non-intrusive
  slots: the timeline panel and below trivia results, never over the canvas.
- **Affiliate links** on every movie/TV node — "Watch *Ghostbusters*" → JustWatch /
  Amazon / Apple TV affiliate deep links. High intent, contextually perfect, and the
  data model already has a node per title.
- **Merch** print-on-demand: "Six Degrees of SNL" tees, the catchphrase lines, the
  galaxy map poster. Zero inventory risk via Printful/Printify.

### Phase 2 — Premium tier ("Universe+", ~$3–5/mo or one-time unlock)
- Unlimited / advanced **Path Finder** (filter by era, force a path through a specific
  movie, "longest path" challenges).
- **Daily challenge + leaderboard** (Wordle-style): one connection puzzle a day, streaks,
  shareable score grid — the proven viral + retention mechanic.
- Personal **collections / watchlists**, custom node notes, and ad-free browsing.
- Trivia **expansion packs** and a timed survival mode.

### Phase 3 — Licensing & B2B (highest ceiling)
- The real asset is the **structured comedy-relationship dataset + the reusable graph
  explorer**. Package it as:
  - A **white-label "universe explorer"** template other fandoms can license (Marvel
    actors, music collabs, sports rosters, a company org chart) — the code is already
    fully data-driven.
  - A **data/API licensing** play for entertainment sites and trivia-night businesses.
- Sponsored/branded universes (a studio paying to map *their* roster ahead of a release).

### What I'd build first
Daily challenge + shareable result card. It's the cheapest thing that drives both the
free-growth loop (Phase 0) and the premium hook (Phase 2), and it reuses the Path Finder
that already exists. Ads + JustWatch affiliate links are the fastest no-friction dollars
to turn on alongside it.

> Note on rights: the underlying facts (who was in what) aren't copyrightable, but names,
> logos, and likenesses are publicity/trademark-sensitive. Keep it editorial/informational,
> avoid official SNL/NBC branding, and get counsel before any paid/merch tier.
