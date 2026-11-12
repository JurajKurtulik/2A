import { storyBanks, storyFrameId, storyFrameLabels, type StoryLevel } from "./banks/preschool-stories";

export const pictures = {
  apple: "jablko", pear: "hruška", banana: "banán", boot: "holínka",
  cat: "kočka", dog: "pejsek", rabbit: "zajíček", carrot: "mrkev",
  leaf: "list", acorn: "žalud", mushroom: "houba", flower: "květina",
  stripes: "pruhovaná ponožka", dots: "puntíkovaná ponožka", stars: "ponožka s hvězdičkami",
  strawberry: "jahoda", orange: "pomeranč", plum: "švestka", pineapple: "ananas",
  sheep: "ovečka", cow: "kravička", pig: "prasátko", horse: "koník",
  car: "autíčko", bus: "autobus", train: "vláček", bike: "jízdní kolo",
  zigzags: "ponožka s cikcaky", hearts: "ponožka se srdíčky",
  diamonds: "ponožka s kosočtverci", bands: "oranžová ponožka s bílými pruhy",
  seed: "semínko v květináči", sprout: "klíček v květináči", bloom: "rozkvetlá rostlina",
  dough: "koule těsta", rawPizza: "připravená pizza", pizza: "upečená pizza",
  ice: "kostka ledu", melting: "tající led", puddle: "loužička vody",
  caterpillar: "housenka", chrysalis: "kukla", butterfly: "motýl",
  cone: "prázdný kornout", scoop: "kornout s kopečkem", sundae: "zmrzlina s třešní",
  wholeApple: "celé jablko", bittenApple: "nakousnuté jablko", appleCore: "ohryzek",
  house: "domeček",
} as const;
type GamePicture = keyof typeof pictures;
type StoryPicture = ReturnType<typeof storyFrameId>;
export type Picture = GamePicture | StoryPicture;
export const picturePath = (picture: Picture) =>
  `./preschool/${picture.startsWith("story-") ? "stories" : "pictures"}/${picture}.png`;
export const pictureLabel = (picture: Picture) =>
  Object.hasOwn(pictures, picture) ? pictures[picture as GamePicture] : storyFrameLabels[picture];

export const preschoolGames = {
  odd: { title: "Co sem nepatří?", picture: "boot", instruction: "Zakroužkuj obrázek, který mezi ostatní nepatří." },
  pattern: { title: "Co přijde dál?", picture: "leaf", instruction: "Zakroužkuj obrázek, který pokračuje v řadě." },
  pair: { title: "Najdi pár", picture: "stripes", instruction: "Zakroužkuj ponožku, která je stejná jako předloha." },
  feed: { title: "Nakrm zajíčky", picture: "rabbit", instruction: "Spoj každého zajíčka s jednou mrkví." },
  story: { title: "Co bylo nejdřív?", picture: "butterfly", instruction: "Očísluj obrázky podle toho, jak se příběh stal." },
  build: { title: "Postav podle obrázku", picture: "build", instruction: "Překresli tvary do prázdných políček podle vzoru." },
  maze: { title: "Doveď kočku domů", picture: "house", instruction: "Nakresli kočce cestu k domečku po volných políčkách." },
  more: { title: "Kde je víc?", picture: "strawberry", instruction: "Zakroužkuj skupinu, ve které je víc obrázků." },
} as const;
export type PreschoolGame = keyof typeof preschoolGames;
export const preschoolGameIds = Object.keys(preschoolGames) as PreschoolGame[];
export const preschoolTopic = (game: PreschoolGame) => `preschool-${game}`;

type ChoiceRound = { kind: "choice"; prompt: Picture[]; options: Picture[]; answer: Picture };
type FeedRound = { kind: "feed"; count: number };
export type StoryRound = { kind: "story"; storyId: string; order: Picture[]; options: Picture[] };
export const shapes = {
  circle: { label: "kruh", color: "#e18d31" },
  square: { label: "čtverec", color: "#4d89c7" },
  triangle: { label: "trojúhelník", color: "#bf5b74" },
} as const;
export type Shape = keyof typeof shapes;
export type BuildRound = { kind: "build"; columns: number; cells: (Shape | null)[] };
export type MazeRound = { kind: "maze"; map: readonly string[]; start: number; goal: number };
export type MoreRound = { kind: "more"; picture: Picture; counts: [number, number] };
export type PreschoolRound = ChoiceRound | FeedRound | StoryRound | BuildRound | MazeRound | MoreRound;

function shuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const fruit: Picture[] = ["apple", "pear", "banana", "strawberry", "orange", "plum", "pineapple"];
const animals: Picture[] = ["cat", "dog", "rabbit", "sheep", "cow", "pig", "horse"];
const vehicles: Picture[] = ["car", "bus", "train", "bike"];
const socks: Picture[] = ["stripes", "dots", "stars", "zigzags", "hearts", "diamonds", "bands"];
const nature: Picture[] = ["carrot", "leaf", "acorn", "mushroom", "flower"];
const oddGroups: { family: Picture[]; outsiders: Picture[] }[] = [
  { family: fruit, outsiders: ["boot", ...animals, ...vehicles, ...socks] },
  { family: animals, outsiders: [...fruit, ...nature, ...vehicles] },
  { family: vehicles, outsiders: [...fruit, ...animals, ...socks] },
  { family: socks, outsiders: [...fruit, ...animals, ...vehicles, ...nature] },
];
const patternPictures = [...fruit, ...animals, ...vehicles, ...socks, ...nature, "boot"] as const;
const originalStories: readonly [string, Picture[]][] = [
  ["plant-pot", ["seed", "sprout", "bloom"]], ["pizza", ["dough", "rawPizza", "pizza"]],
  ["melting-ice", ["ice", "melting", "puddle"]], ["butterfly", ["caterpillar", "chrysalis", "butterfly"]],
  ["ice-cream", ["cone", "scoop", "sundae"]], ["apple", ["wholeApple", "bittenApple", "appleCore"]],
];

function storyRounds(level: StoryLevel, recent: readonly string[]): StoryRound[] {
  const bank: readonly [string, Picture[]][] = [
    ...(level === 1 ? originalStories : []),
    ...storyBanks[level].map(([id, frames]): [string, Picture[]] => [
      id, frames.map((_, index) => storyFrameId(id, index)),
    ]),
  ];
  const lastPlayed = new Map(recent.map((id, index) => [id, index]));
  const recency = (id: string) => lastPlayed.get(id) ?? recent.length;
  const candidates = shuffle(bank).sort(([a], [b]) => recency(b) - recency(a));
  return candidates.slice(0, 5).map(([storyId, order]) => {
    const options = shuffle(order);
    if (options.every((picture, index) => picture === order[index])) options.push(options.shift()!);
    return { kind: "story", storyId, order, options };
  });
}
const mazes = [
  ["S..", "##.", "..G"],
  ["S#..", ".#.#", "...G"],
  ["...G", ".##.", "S..."],
  ["S.#.", "#.#G", "...."],
  [".#..G", ".....", "S###.", "....."],
] as const;
export const directions = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] } as const;
export type Direction = keyof typeof directions;

export function mazeStep(round: MazeRound, position: number, direction: Direction): number | null {
  const width = round.map[0].length;
  const [dy, dx] = directions[direction];
  const row = Math.floor(position / width) + dy;
  const column = position % width + dx;
  const tile = round.map[row]?.[column];
  return tile && tile !== "#" ? row * width + column : null;
}

export function preschoolRounds(game: PreschoolGame, level: StoryLevel = 1, recentStories: readonly string[] = []): PreschoolRound[] {
  switch (game) {
    case "odd": {
      const groups = shuffle(oddGroups);
      return [...groups, groups[0]].map(({ family, outsiders }) => {
        const [answer] = shuffle(outsiders);
        return { kind: "choice", prompt: [], options: shuffle([...shuffle(family).slice(0, 3), answer]), answer };
      });
    }
    case "pattern":
      return Array.from({ length: 5 }, (_, index) => {
        const [first, second, third] = shuffle(patternPictures);
        const unit = index < 3 ? [first, second] : [first, first, second];
        return {
          kind: "choice" as const, prompt: [...unit, ...unit, ...unit],
          options: shuffle([first, second, third]), answer: first,
        };
      });
    case "pair":
      return shuffle(socks).slice(0, 5).map(answer => ({
        kind: "choice" as const, prompt: [answer],
        options: shuffle([answer, ...shuffle(socks.filter(sock => sock !== answer)).slice(0, 2)]), answer,
      }));
    case "feed":
      return [1, 2, 3, 4, shuffle([5, 6])[0]].map(count => ({ kind: "feed", count }));
    case "story":
      return storyRounds(level, recentStories);
    case "build":
      return [2, 2, 3, 4, 5].map((count, index) => {
        const columns = index < 2 ? 2 : 3;
        const palette = shuffle(Object.keys(shapes) as Shape[]);
        const pieces = Array.from({ length: count }, (_, i) => palette[i % palette.length]);
        const cells = shuffle([...pieces, ...Array<null>(columns * 2 - count).fill(null)]);
        return { kind: "build", columns, cells };
      });
    case "maze":
      return mazes.map(map => ({ kind: "maze", map, start: map.join("").indexOf("S"), goal: map.join("").indexOf("G") }));
    case "more": {
      const objects = shuffle([...fruit, ...nature]);
      const counts: [number, number][] = [[1, 3], [2, 4], [3, 4], [4, 5], [5, 6]];
      return counts.map((pair, index) => ({
        kind: "more", picture: objects[index], counts: Math.random() < .5 ? pair : [pair[1], pair[0]],
      }));
    }
  }
}
