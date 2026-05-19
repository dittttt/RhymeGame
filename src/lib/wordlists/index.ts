// Wordlists for the rhyme picker. Family-safe, ~20–40 words each.
// These are simple inspiration pools; the rhyme engine still owns the
// rhyme-grouping logic via game-data.ts. Selecting a wordlist here
// surfaces a label in the round UI and is exposed via game state for
// the rhyme engine to consume later.

export type WordlistId =
  | "basic"
  | "food"
  | "places"
  | "romantic"
  | "sad"
  | "party"
  | "money"
  | "nature"
  | "tech"
  | "slang"
  | "syl1"
  | "syl2"
  | "syl3";

export type Wordlist = {
  id: WordlistId;
  label: string;
  words: string[];
};

export const WORDLISTS: Wordlist[] = [
  {
    id: "basic",
    label: "Basic",
    words: [
      "time","prime","crime","dime","line","nine","shine","find","mind","grind",
      "back","track","stack","pack","rock","block","clock","talk","walk","cash",
      "flash","trash","fight","night","light","tight","right","flow","glow","show",
      "name","game","flame","chain","rain","brain",
    ],
  },
  {
    id: "food",
    label: "Food / Cooking",
    words: [
      "snack","cake","steak","bake","plate","grate","grill","chill","spice","rice",
      "slice","dice","stew","brew","crust","crunch","lunch","brunch","dough","toast",
      "roast","bread","spread","sauce","glaze","plate","meat","sweet","treat","heat",
      "fry","pie","mix","dish",
    ],
  },
  {
    id: "places",
    label: "Places",
    words: [
      "block","town","downtown","crown","ground","sound","mound","street","heat",
      "concrete","skyline","line","city","gritty","road","load","mode","alley",
      "valley","park","mark","dark","spark","coast","most","yard","hard","guard",
      "border","corner","quarter","subway","gateway","district",
    ],
  },
  {
    id: "romantic",
    label: "Romantic",
    words: [
      "heart","start","spark","mark","fire","desire","higher","wire","kiss","miss",
      "bliss","sigh","high","fly","by","close","rose","glow","flow","slow",
      "warm","charm","arm","calm","palm","love","dove","above","of","near","dear",
      "fear","clear",
    ],
  },
  {
    id: "sad",
    label: "Sad / Emo",
    words: [
      "pain","rain","stain","drain","brain","tears","fears","years","alone","stone",
      "phone","gone","cold","old","fold","told","scar","far","star","numb",
      "dumb","run","gun","sun","done","cry","sigh","goodbye","lonely","slowly",
      "broken","spoken","hollow","shallow",
    ],
  },
  {
    id: "party",
    label: "Party / Hype",
    words: [
      "hype","light","tight","ignite","tonight","flight","fight","right","wild","style",
      "smile","mile","loud","crowd","proud","cloud","jam","slam","ram","bam",
      "boom","room","zoom","groove","move","prove","bass","face","place","race",
      "blast","fast","last",
    ],
  },
  {
    id: "money",
    label: "Money / Hustle",
    words: [
      "cash","stash","flash","splash","stack","rack","back","track","band","grand",
      "land","hand","brand","grind","mind","find","signed","check","deck","wreck",
      "rich","switch","pitch","bag","tag","drag","flag","wealth","stealth","health",
      "boss","sauce","floss","gloss","hustle","muscle",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    words: [
      "tree","sea","breeze","leaves","trees","seas","skies","tide","ride","wide",
      "stream","beam","dream","sun","run","done","sky","high","fly","cloud",
      "wind","mind","wild","mild","field","yield","stone","grown","thrown","river",
      "shiver","forest","sunrise","wildfire","mountain","fountain",
    ],
  },
  {
    id: "tech",
    label: "Tech / Internet",
    words: [
      "code","load","node","mode","road","app","tap","map","gap","link",
      "sync","drink","think","ping","ring","string","cloud","crowd","loud","cache",
      "crash","flash","data","beta","meta","wire","fire","wifi","screen","scene",
      "machine","stream","beam","feed","speed","need","viral","spiral",
    ],
  },
  {
    id: "slang",
    label: "Slang",
    words: [
      "vibe","tribe","jive","drip","trip","flip","grip","clip","lit","fit",
      "hit","spit","wit","whip","sip","dip","wave","brave","gave","plug",
      "thug","hug","slug","dope","cope","hope","fly","sly","guy","goat",
      "boat","note","cap","trap","slap","wrap","gang","slang","bang",
    ],
  },
  {
    id: "syl1",
    label: "1-syllable words",
    words: [
      "time","prime","line","nine","mind","find","back","track","stack","rock",
      "block","talk","walk","cash","flash","crash","night","light","right","flow",
      "glow","show","name","game","flame","chain","rain","brain","pain","gain",
      "way","day","play","stay","fly","sky","try","by","road","load",
    ],
  },
  {
    id: "syl2",
    label: "2-syllable words",
    words: [
      "higher","fire","wire","desire","pressure","measure","treasure","danger",
      "stranger","money","honey","funny","running","stunning","cunning","city",
      "pretty","gritty","shadow","meadow","trouble","double","bubble","matter",
      "chatter","shatter","heavy","ready","steady","crazy","lazy","hazy","river",
      "shiver","power","tower","silent","violent","reckless","restless",
    ],
  },
  {
    id: "syl3",
    label: "3-syllable words",
    words: [
      "legacy","destiny","memory","history","victory","energy","remedy","tragedy",
      "philosophy","atrocity","velocity","ferocity","millionaire","billionaire",
      "renegade","masquerade","serenade","satellite","appetite","dynamite","melody",
      "harmony","gravity","sanity","reality","fantasy","mystery","liberty","royalty",
      "loyalty","sympathy","empathy","industry","chemistry","artistry",
    ],
  },
];

export function getWordlist(id: WordlistId): Wordlist {
  return WORDLISTS.find((w) => w.id === id) ?? WORDLISTS[0];
}
