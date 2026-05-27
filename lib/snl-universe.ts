export type UniverseNodeType = 'alumni' | 'movie' | 'tv' | 'character' | 'creator' | 'award';

export type UniverseNode = {
  id: string;
  name: string;
  type: UniverseNodeType;
  years?: string;
  role?: string;
  bio: string;
  imageTone: string;
  tags: string[];
  highlights: string[];
  catchphrases?: string[];
  awards?: string[];
};

export type UniverseEdge = {
  source: string;
  target: string;
  relation: string;
  project?: string;
  strength: number;
};

export type TimelineMoment = {
  year: string;
  title: string;
  detail: string;
  era: string;
};

export const universeNodes: UniverseNode[] = [
  {
    id: 'snl',
    name: 'Saturday Night Live',
    type: 'tv',
    years: '1975-present',
    role: 'NBC sketch institution',
    bio: 'The live comedy engine that connects generations of performers, writers, hosts, musicians, and recurring characters.',
    imageTone: 'from-slate-900 via-red-700 to-amber-300',
    tags: ['Sketches', 'Weekend Update', 'Live TV'],
    highlights: ['Late-night comedy launchpad', 'Political satire archive', 'Recurring character factory'],
  },
  {
    id: 'bill-murray',
    name: 'Bill Murray',
    type: 'alumni',
    years: '1977-1980',
    role: 'Cast member',
    bio: 'Deadpan SNL star who became a film icon through comedy, melancholy, and collaborations spanning Ghostbusters to Wes Anderson.',
    imageTone: 'from-sky-800 via-cyan-600 to-amber-200',
    tags: ['Deadpan', 'Film icon', 'Original era'],
    highlights: ['Nick the Lounge Singer', 'Ghostbusters', 'Lost in Translation'],
    catchphrases: ['No one will ever believe you.'],
    awards: ['Emmy Award', 'Golden Globe'],
  },
  {
    id: 'dan-aykroyd',
    name: 'Dan Aykroyd',
    type: 'alumni',
    years: '1975-1979',
    role: 'Cast member and writer',
    bio: 'Original cast powerhouse whose characters and genre instincts helped bridge SNL sketches and blockbuster comedy.',
    imageTone: 'from-indigo-950 via-blue-600 to-lime-300',
    tags: ['Original cast', 'Writer', 'Blues Brothers'],
    highlights: ['Coneheads', 'The Blues Brothers', 'Ghostbusters'],
    awards: ['Emmy Award'],
  },
  {
    id: 'eddie-murphy',
    name: 'Eddie Murphy',
    type: 'alumni',
    years: '1980-1984',
    role: 'Cast member',
    bio: 'A breakout force who reshaped the early 1980s cast and carried SNL energy into stand-up, film, and character comedy.',
    imageTone: 'from-purple-950 via-fuchsia-700 to-yellow-300',
    tags: ['Character comedy', 'Stand-up', 'Movie star'],
    highlights: ['Mister Robinson', 'Gumby', 'Beverly Hills Cop'],
    catchphrases: ['I am Gumby.'],
    awards: ['Emmy Award', 'Golden Globe'],
  },
  {
    id: 'tina-fey',
    name: 'Tina Fey',
    type: 'alumni',
    years: '1997-2006',
    role: 'Writer, head writer, cast member',
    bio: 'Head writer and Weekend Update anchor whose SNL voice expanded into sitcoms, films, political impressions, and producer-led comedy.',
    imageTone: 'from-emerald-950 via-teal-600 to-rose-300',
    tags: ['Head writer', 'Weekend Update', 'Producer'],
    highlights: ['Weekend Update', '30 Rock', 'Mean Girls'],
    catchphrases: ['I want to go to there.'],
    awards: ['Emmy Awards', 'Mark Twain Prize'],
  },
  {
    id: 'amy-poehler',
    name: 'Amy Poehler',
    type: 'alumni',
    years: '2001-2008',
    role: 'Cast member and Weekend Update anchor',
    bio: 'High-energy performer and improviser whose SNL run connects to Upright Citizens Brigade, Parks and Recreation, and broad ensemble comedy.',
    imageTone: 'from-red-950 via-orange-600 to-cyan-200',
    tags: ['Improv', 'Weekend Update', 'Ensemble comedy'],
    highlights: ['Weekend Update', 'Parks and Recreation', 'Baby Mama'],
    awards: ['Golden Globe'],
  },
  {
    id: 'maya-rudolph',
    name: 'Maya Rudolph',
    type: 'alumni',
    years: '2000-2007',
    role: 'Cast member',
    bio: 'A musical, elastic performer with a rare range across impressions, ensemble films, voice work, and prestige comedy.',
    imageTone: 'from-zinc-900 via-pink-700 to-green-300',
    tags: ['Impressions', 'Music', 'Voice acting'],
    highlights: ['Donatella Versace', 'Bridesmaids', 'Big Mouth'],
    awards: ['Emmy Awards'],
  },
  {
    id: 'adam-sandler',
    name: 'Adam Sandler',
    type: 'alumni',
    years: '1990-1995',
    role: 'Cast member and writer',
    bio: 'Musical sketch oddball turned box-office comedy anchor, with a collaboration network that became its own comedy ecosystem.',
    imageTone: 'from-blue-950 via-violet-700 to-orange-300',
    tags: ['Songs', '90s cast', 'Film franchise'],
    highlights: ['The Chanukah Song', 'Happy Gilmore', 'Grown Ups'],
    catchphrases: ['The price is wrong.'],
    awards: ['Independent Spirit Award'],
  },
  {
    id: 'chris-rock',
    name: 'Chris Rock',
    type: 'alumni',
    years: '1990-1993',
    role: 'Cast member',
    bio: 'Sharp stand-up voice whose SNL orbit links political comedy, film ensembles, HBO specials, and modern comedy influence.',
    imageTone: 'from-stone-950 via-red-800 to-sky-300',
    tags: ['Stand-up', 'Commentary', 'Film'],
    highlights: ['New Jack City', 'Everybody Hates Chris', 'Grown Ups'],
    awards: ['Emmy Awards', 'Grammy Awards'],
  },
  {
    id: 'andy-samberg',
    name: 'Andy Samberg',
    type: 'alumni',
    years: '2005-2012',
    role: 'Cast member and digital short creator',
    bio: 'Digital-era star who helped make SNL clips native to the internet, then carried that rhythm into sitcoms and music comedy.',
    imageTone: 'from-cyan-950 via-blue-500 to-yellow-200',
    tags: ['Digital shorts', 'Music comedy', 'Brooklyn Nine-Nine'],
    highlights: ['Lazy Sunday', 'The Lonely Island', 'Brooklyn Nine-Nine'],
    awards: ['Golden Globe', 'Emmy Award'],
  },
  {
    id: 'kristen-wiig',
    name: 'Kristen Wiig',
    type: 'alumni',
    years: '2005-2012',
    role: 'Cast member',
    bio: 'Character-driven performer who turned awkwardness, commitment, and ensemble chemistry into a modern SNL signature.',
    imageTone: 'from-neutral-950 via-emerald-700 to-pink-200',
    tags: ['Characters', 'Film writing', 'Ensemble'],
    highlights: ['Target Lady', 'Bridesmaids', 'MacGruber'],
    awards: ['Oscar nomination', 'Emmy nominations'],
  },
  {
    id: 'will-ferrell',
    name: 'Will Ferrell',
    type: 'alumni',
    years: '1995-2002',
    role: 'Cast member',
    bio: 'A maximalist sketch performer whose SNL characters fed directly into a run of dominant studio comedies.',
    imageTone: 'from-amber-950 via-red-600 to-sky-200',
    tags: ['Physical comedy', 'Characters', 'Studio comedy'],
    highlights: ['Celebrity Jeopardy', 'More Cowbell', 'Anchorman'],
    catchphrases: ['More cowbell.'],
    awards: ['Mark Twain Prize'],
  },
  {
    id: 'lorne-michaels',
    name: 'Lorne Michaels',
    type: 'creator',
    years: '1975-present',
    role: 'Creator and producer',
    bio: 'The producer whose casting, writing rooms, and alumni pipeline make SNL feel like an expandable comedy universe.',
    imageTone: 'from-black via-zinc-700 to-red-300',
    tags: ['Producer', 'Talent pipeline', 'Broadway Video'],
    highlights: ['Created SNL', 'Produced 30 Rock', 'Launched generations'],
    awards: ['Emmy Awards', 'Kennedy Center Honors'],
  },
  {
    id: 'ghostbusters',
    name: 'Ghostbusters',
    type: 'movie',
    years: '1984',
    role: 'Supernatural comedy film',
    bio: 'A major bridge from early SNL talent into blockbuster genre comedy.',
    imageTone: 'from-gray-950 via-emerald-700 to-white',
    tags: ['Film', 'Supernatural comedy', 'Franchise'],
    highlights: ['Bill Murray', 'Dan Aykroyd', 'Harold Ramis'],
  },
  {
    id: 'mean-girls',
    name: 'Mean Girls',
    type: 'movie',
    years: '2004',
    role: 'Teen comedy film',
    bio: 'Tina Fey-written comedy that extended SNL writing instincts into a quotable film and stage universe.',
    imageTone: 'from-pink-950 via-rose-500 to-white',
    tags: ['Film', 'Written by Tina Fey', 'Pop culture'],
    highlights: ['Tina Fey screenplay', 'Lorne Michaels production', 'Broadway adaptation'],
  },
  {
    id: 'thirty-rock',
    name: '30 Rock',
    type: 'tv',
    years: '2006-2013',
    role: 'Network sitcom',
    bio: 'A backstage comedy that channels SNL production culture into a rapid-fire sitcom.',
    imageTone: 'from-slate-950 via-teal-700 to-amber-200',
    tags: ['TV', 'Workplace comedy', 'NBC'],
    highlights: ['Tina Fey', 'Lorne Michaels', 'Emmy-winning sitcom'],
  },
  {
    id: 'parks-rec',
    name: 'Parks and Recreation',
    type: 'tv',
    years: '2009-2015',
    role: 'Workplace sitcom',
    bio: 'Amy Poehler-led ensemble comedy connected to SNL through performers, writers, and improv culture.',
    imageTone: 'from-green-950 via-lime-700 to-yellow-200',
    tags: ['TV', 'Ensemble', 'Workplace comedy'],
    highlights: ['Amy Poehler', 'Nick Offerman', 'Optimistic civic comedy'],
  },
  {
    id: 'bridesmaids',
    name: 'Bridesmaids',
    type: 'movie',
    years: '2011',
    role: 'Ensemble comedy film',
    bio: 'A major modern comedy ensemble connecting Kristen Wiig, Maya Rudolph, and the post-2000 SNL era.',
    imageTone: 'from-fuchsia-950 via-pink-600 to-yellow-200',
    tags: ['Film', 'Ensemble', 'Written by Kristen Wiig'],
    highlights: ['Kristen Wiig', 'Maya Rudolph', 'Oscar nominations'],
  },
  {
    id: 'stefon',
    name: 'Stefon',
    type: 'character',
    years: '2008-2013',
    role: 'Weekend Update character',
    bio: 'Bill Hader and John Mulaney created a nightlife correspondent who became one of SNLs defining Update characters.',
    imageTone: 'from-violet-950 via-fuchsia-600 to-lime-200',
    tags: ['Character', 'Weekend Update', 'Nightlife'],
    highlights: ['Performed by Bill Hader', 'Written with John Mulaney', 'Recurring Update favorite'],
    catchphrases: ['This place has everything.'],
  },
];

export const universeEdges: UniverseEdge[] = [
  { source: 'snl', target: 'bill-murray', relation: 'Cast member', strength: 5 },
  { source: 'snl', target: 'dan-aykroyd', relation: 'Cast member and writer', strength: 5 },
  { source: 'snl', target: 'eddie-murphy', relation: 'Cast member', strength: 5 },
  { source: 'snl', target: 'tina-fey', relation: 'Head writer and cast', strength: 5 },
  { source: 'snl', target: 'amy-poehler', relation: 'Cast and Update anchor', strength: 5 },
  { source: 'snl', target: 'maya-rudolph', relation: 'Cast member', strength: 4 },
  { source: 'snl', target: 'adam-sandler', relation: 'Cast member and writer', strength: 4 },
  { source: 'snl', target: 'chris-rock', relation: 'Cast member', strength: 4 },
  { source: 'snl', target: 'andy-samberg', relation: 'Digital shorts', strength: 4 },
  { source: 'snl', target: 'kristen-wiig', relation: 'Cast member', strength: 4 },
  { source: 'snl', target: 'will-ferrell', relation: 'Cast member', strength: 4 },
  { source: 'snl', target: 'lorne-michaels', relation: 'Created and produced', strength: 5 },
  { source: 'bill-murray', target: 'dan-aykroyd', relation: 'Co-starred', project: 'Ghostbusters', strength: 5 },
  { source: 'bill-murray', target: 'ghostbusters', relation: 'Starred in', strength: 5 },
  { source: 'dan-aykroyd', target: 'ghostbusters', relation: 'Co-wrote and starred', strength: 5 },
  { source: 'tina-fey', target: 'amy-poehler', relation: 'Update partners and co-stars', strength: 5 },
  { source: 'tina-fey', target: 'thirty-rock', relation: 'Created and starred', strength: 5 },
  { source: 'tina-fey', target: 'mean-girls', relation: 'Wrote and appeared', strength: 5 },
  { source: 'lorne-michaels', target: 'thirty-rock', relation: 'Produced', strength: 4 },
  { source: 'lorne-michaels', target: 'mean-girls', relation: 'Produced', strength: 4 },
  { source: 'amy-poehler', target: 'parks-rec', relation: 'Starred in', strength: 5 },
  { source: 'amy-poehler', target: 'maya-rudolph', relation: 'Frequent collaborators', strength: 4 },
  { source: 'maya-rudolph', target: 'bridesmaids', relation: 'Starred in', strength: 5 },
  { source: 'kristen-wiig', target: 'bridesmaids', relation: 'Co-wrote and starred', strength: 5 },
  { source: 'kristen-wiig', target: 'maya-rudolph', relation: 'Co-starred', project: 'Bridesmaids', strength: 5 },
  { source: 'adam-sandler', target: 'chris-rock', relation: 'Co-starred', project: 'Grown Ups', strength: 4 },
  { source: 'chris-rock', target: 'eddie-murphy', relation: 'Stand-up and film lineage', strength: 3 },
  { source: 'andy-samberg', target: 'lorne-michaels', relation: 'Produced digital era projects', strength: 3 },
  { source: 'will-ferrell', target: 'kristen-wiig', relation: 'SNL ensemble lineage', strength: 3 },
  { source: 'stefon', target: 'snl', relation: 'Recurring character', strength: 4 },
  { source: 'stefon', target: 'andy-samberg', relation: 'Shared digital-era cast orbit', strength: 2 },
];

export const timelineMoments: TimelineMoment[] = [
  {
    year: '1975',
    title: 'The original live experiment begins',
    detail: 'SNL launches a new grammar for late-night sketch comedy and immediately creates a reusable talent pipeline.',
    era: 'Original cast',
  },
  {
    year: '1980',
    title: 'Eddie Murphy changes the center of gravity',
    detail: 'The early-80s reset produces a star whose characters and stand-up voice carry the show into a new decade.',
    era: 'Rebuild',
  },
  {
    year: '1984',
    title: 'Ghostbusters proves the movie bridge',
    detail: 'Bill Murray and Dan Aykroyd help define how SNL alumni can move from sketches into blockbuster worlds.',
    era: 'Film crossover',
  },
  {
    year: '1997',
    title: 'Tina Fey enters the writers room',
    detail: 'A future head writer and Update anchor helps shape the voice of the late-90s and 2000s show.',
    era: 'Writer-producer era',
  },
  {
    year: '2005',
    title: 'Digital shorts go viral',
    detail: 'Andy Samberg and The Lonely Island make the web feel like a native SNL stage.',
    era: 'Digital era',
  },
  {
    year: '2011',
    title: 'Bridesmaids expands the ensemble map',
    detail: 'Kristen Wiig and Maya Rudolph connect SNL character work to a major modern comedy ensemble.',
    era: 'Modern ensemble',
  },
];

export const triviaQuestions = [
  {
    prompt: 'Which SNL alum wrote Mean Girls and later created 30 Rock?',
    answer: 'Tina Fey',
    options: ['Tina Fey', 'Amy Poehler', 'Kristen Wiig'],
  },
  {
    prompt: 'Which movie connects Bill Murray and Dan Aykroyd in this seed graph?',
    answer: 'Ghostbusters',
    options: ['Ghostbusters', 'Bridesmaids', 'Mean Girls'],
  },
  {
    prompt: 'Which recurring Weekend Update character is famous for absurd nightlife recommendations?',
    answer: 'Stefon',
    options: ['Stefon', 'Gumby', 'Target Lady'],
  },
];
