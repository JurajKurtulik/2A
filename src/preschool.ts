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
  house: "domeček", tripBus: "výletní autobus", balanceScale: "váha", logicBear: "medvídek",
  streetRed: "červený domeček", streetBlue: "modrý domeček", streetGold: "žlutý domeček",
  streetPurple: "fialový domeček", streetTree: "strom",
} as const;
type GamePicture = keyof typeof pictures;
type StoryPicture = ReturnType<typeof storyFrameId>;
export type Picture = GamePicture | StoryPicture;
export const picturePath = (picture: Picture) =>
  `./preschool/${picture.startsWith("story-") ? "story-scenes" : "pictures"}/${picture}.png`;
export const pictureLabel = (picture: Picture) =>
  Object.hasOwn(pictures, picture) ? pictures[picture as GamePicture] : storyFrameLabels[picture];

export const preschoolGames = {
  odd: { title: "Co sem nepatří?", picture: "boot", instruction: "Zakroužkuj obrázek, který mezi ostatní nepatří." },
  pattern: { title: "Co přijde dál?", picture: "leaf", instruction: "Zakroužkuj obrázek, který pokračuje v řadě." },
  pair: { title: "Najdi pár", picture: "stripes", instruction: "Zakroužkuj ponožku, která je stejná jako předloha." },
  feed: { title: "Zaječí hostina", picture: "rabbit", instruction: "Podle teček spoj mrkve s miskami. Šipkou vyznač, kterou přesuneš." },
  story: { title: "Co bylo nejdřív?", picture: "butterfly", instruction: "Očísluj obrázky podle toho, jak se příběh stal." },
  build: { title: "Postav podle obrázku", picture: "build", instruction: "Překresli tvary do prázdných políček podle vzoru." },
  maze: { title: "Doveď kočku domů", picture: "house", instruction: "Nakresli kočce cestu k domečku po volných políčkách." },
  more: { title: "Kde je víc?", picture: "strawberry", instruction: "Zakroužkuj skupinu, ve které je víc obrázků." },
  trip: { title: "Výlet autobusem", picture: "tripBus", instruction: "Škrtni vystupující, přidej čekající a zakroužkuj správný počet teček." },
  balance: { title: "Vyvaž váhu", picture: "balanceScale", instruction: "Rozděl všechna jablka tak, aby jich bylo na obou miskách stejně." },
  door: { title: "Kdo bydlí v domečku?", picture: "logicBear", instruction: "Zakroužkuj medvídka, který má stejnou barvu i stejný vzorek jako nápověda." },
  street: { title: "Domečky v řadě", picture: "streetRed", instruction: "Podle horní řady spoj každý volný domeček s jeho místem v dolní řadě." },
} as const;
export type PreschoolGame = keyof typeof preschoolGames;
export const preschoolGameIds = Object.keys(preschoolGames) as PreschoolGame[];
export const preschoolTopic = (game: PreschoolGame) => `preschool-${game}`;

type ChoiceRound = { kind: "choice"; prompt: Picture[]; options: Picture[]; answer: Picture };
export type FeedRound = { kind: "feed"; portions: readonly number[]; startingPortions?: readonly number[] };
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
export type TripRound = {
  kind: "trip"; stay: Picture[]; exit: Picture[]; waiting: Picture[]; options: number[];
};
export type BalanceRound = { kind: "balance"; starting: [left: number, right: number, basket: number] };
export const bearColors = {
  blue: { label: "modrá", color: "#3274ad" },
  yellow: { label: "žlutá", color: "#edb73f" },
  pink: { label: "růžová", color: "#b84c77" },
};
export const bearPatterns = { dots: "puntíky", stripes: "pruhy", checker: "šachovnice" };
export type BearColor = keyof typeof bearColors;
export type BearPattern = keyof typeof bearPatterns;
export type BearPatch = { color: BearColor; pattern: BearPattern };
export type DoorRound = { kind: "door"; clue: BearPatch; options: BearPatch[] };
export type StreetHouse = "streetRed" | "streetBlue" | "streetGold" | "streetPurple";
export type StreetRound = {
  kind: "street"; houses: StreetHouse[]; model: StreetHouse[];
};
export type GraphicRound = FeedRound | BuildRound | MazeRound | MoreRound | TripRound | BalanceRound | DoorRound | StreetRound;
export type PreschoolRound = ChoiceRound | StoryRound | GraphicRound;

export const tripCount = (round: TripRound) => round.stay.length + round.waiting.length;
export const tripCapacity = 6;
export const dotLayouts: Record<number, number[]> = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
export const matchingBear = (a: BearPatch, b: BearPatch) => a.color === b.color && a.pattern === b.pattern;

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
const streetHouses: StreetHouse[] = ["streetRed", "streetBlue", "streetGold", "streetPurple"];
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
      return [
        { kind: "feed", portions: [shuffle([2, 3])[0]] },
        { kind: "feed", portions: shuffle([1, 2]) },
        { kind: "feed", portions: shuffle([2, 3]) },
        ...[shuffle([1, 4]), shuffle([2, 4])].map(portions => ({
          kind: "feed" as const,
          portions,
          startingPortions: [portions[0] - Math.sign(portions[0] - portions[1]), portions[1] + Math.sign(portions[0] - portions[1])],
        })),
      ];
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
    case "trip":
      return shuffle([tripCapacity, ...shuffle([1, 2, 3, 4, 5]).slice(0, 4)]).map(answer => {
        const counts = Array.from({ length: answer + 1 }, (_, stay) =>
          [0, 1, 2].map(exit => ({ stay, exit, waiting: answer - stay }))).flat()
          .filter(({ stay, exit, waiting }) => stay + exit >= 1 && stay + exit <= tripCapacity &&
            waiting <= 2 && exit + waiting >= 1 && stay + exit + waiting <= animals.length);
        const [{ stay, exit, waiting }] = shuffle(counts);
        const riders = shuffle(animals);
        return {
          kind: "trip", stay: riders.slice(0, stay), exit: riders.slice(stay, stay + exit),
          waiting: riders.slice(stay + exit, stay + exit + waiting),
          options: shuffle(Array.from({ length: 3 }, (_, i) => Math.min(4, Math.max(1, answer - 1)) + i)),
        };
      });
    case "balance":
      return ([[0, 0, 2], [1, 0, 3], [1, 3, 0], [0, 0, 6], [4, 1, 1]] as [number, number, number][]).map(([left, right, basket]) => ({
        kind: "balance", starting: Math.random() < .5 ? [left, right, basket] : [right, left, basket],
      }));
    case "door": {
      const colors = Object.keys(bearColors) as BearColor[];
      const patterns = Object.keys(bearPatterns) as BearPattern[];
      const clues = shuffle(colors.flatMap(color => patterns.map(pattern => ({ color, pattern })))).slice(0, 5);
      return clues.map((clue, index) => {
        const [otherColor] = shuffle(colors.filter(color => color !== clue.color));
        const [otherPattern] = shuffle(patterns.filter(pattern => pattern !== clue.pattern));
        const options = [clue, { color: otherColor, pattern: clue.pattern }, { color: clue.color, pattern: otherPattern }];
        if (index >= 2) options.push({ color: otherColor, pattern: otherPattern });
        return { kind: "door", clue, options: shuffle(options) };
      });
    }
    case "street":
      return Array.from({ length: 5 }, (_, index) => {
        const model = shuffle(streetHouses).slice(0, index < 2 ? 3 : 4);
        const houses = shuffle(model);
        if (houses.every((house, i) => house === model[i])) houses.push(houses.shift()!);
        return { kind: "street", houses, model };
      });
  }
}
