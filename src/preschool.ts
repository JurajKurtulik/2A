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
  streetTeal: "tyrkysový domeček", streetPink: "růžový domeček",
  pizzaRed: "salámová pizza", pizzaWhite: "houbová pizza", pizzaGreen: "pizza s olivami",
  sliceRed: "salámový dílek", sliceWhite: "houbový dílek", sliceGreen: "olivový dílek",
  pizzaCorn: "pizza s kukuřicí", sliceCorn: "dílek s kukuřicí",
  pizzaBroccoli: "pizza s brokolicí", sliceBroccoli: "dílek s brokolicí",
  pizzaPineapple: "pizza s ananasem", slicePineapple: "dílek s ananasem",
  pizzaEgg: "pizza s vejcem", sliceEgg: "dílek s vejcem",
  pizzaShrimp: "pizza s krevetami", sliceShrimp: "dílek s krevetami",
  pizzaOnion: "pizza s cibulí", sliceOnion: "dílek s cibulí",
  pizzaBasil: "pizza s bazalkou", sliceBasil: "dílek s bazalkou",
  pizzaPepper: "pizza s paprikou", slicePepper: "dílek s paprikou",
  pizzaBlueberry: "pizza s borůvkami", sliceBlueberry: "dílek s borůvkami",
  pizzaZucchini: "pizza s cuketou", sliceZucchini: "dílek s cuketou",
  iceBall: "kopeček zmrzliny", muffin: "muffin",
  brickRed: "červená kostička", shadowMascot: "veverka", pieceMascot: "liška",
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
  match: { title: "Co k čemu patří?", picture: "pizzaRed", instruction: "Spoj každý dílek s pizzou se stejnou oblohou." },
  absent: { title: "Co na obrázku není?", picture: "cat", instruction: "Zakroužkuj obrázek, který v horní řadě není." },
  iceCream: { title: "Zmrzlina na přání", picture: "iceBall", instruction: "Zakroužkuj kartičku, na které je tolik kopečků, kolik ukazuje číslo." },
  listen: { title: "Poslechni a přesuň", picture: "muffin", instruction: "Dospělý přečte pokyn. Dítě spojí muffin se správným talířem." },
  crowd: { title: "Kterých zvířátek je víc?", picture: "dog", instruction: "Zakroužkuj zvířátko, kterých je nahoře víc." },
  bricks: { title: "Kolik je kostiček?", picture: "brickRed", instruction: "Spočítej dílky stavby a zakroužkuj správné číslo." },
  shadow: { title: "Najdi stín", picture: "shadowMascot", instruction: "Zakroužkuj stín, který má stejný tvar jako obrázek." },
  piece: { title: "Najdi chybějící dílek", picture: "pieceMascot", instruction: "Zakroužkuj dílek, který doplní prázdné místo." },
} as const;
export type PreschoolGame = keyof typeof preschoolGames;
export const preschoolLevels = {
  match: ["3 pizzy", "5 pizz"],
  maze: ["Malé bludiště", "Velké bludiště"],
  story: ["3 obrázky", "5 obrázků"],
  pattern: ["Kratší vzory", "Složitější vzory"],
  build: ["Malá plocha", "Velká plocha"],
  absent: ["3 obrázky", "6 obrázků"],
  street: ["3 až 4 domky", "5 až 6 domků"],
} as const;
export type LeveledGame = keyof typeof preschoolLevels;
export const hasPreschoolLevels = (game: PreschoolGame): game is LeveledGame => Object.hasOwn(preschoolLevels, game);
export const preschoolGameIds = Object.keys(preschoolGames) as PreschoolGame[];
export const preschoolTopic = (game: PreschoolGame) => `preschool-${game}`;

type ChoiceRound = { kind: "choice"; prompt: Picture[]; options: Picture[]; answer: Picture };
export type FeedRound = { kind: "feed"; portions: readonly number[]; startingPortions?: readonly number[] };
export type StoryRound = { kind: "story"; storyId: string; order: Picture[]; options: Picture[] };
export const shapes = {
  circle: { label: "kruh", color: "#e18d31" },
  square: { label: "čtverec", color: "#4d89c7" },
  triangle: { label: "trojúhelník", color: "#bf5b74" },
  diamond: { label: "kosočtverec", color: "#7154a8" },
} as const;
export type Shape = keyof typeof shapes;
export type BuildRound = { kind: "build"; columns: number; cells: (Shape | null)[]; palette: Shape[] };
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
export type StreetHouse = "streetRed" | "streetBlue" | "streetGold" | "streetPurple" | "streetTeal" | "streetPink";
export type StreetRound = {
  kind: "street"; houses: StreetHouse[]; model: StreetHouse[];
};
export type MatchRound = { kind: "match"; pizzas: Picture[]; slices: Picture[] };
export const pizzaPairs: readonly [Picture, Picture][] = [
  ["pizzaRed", "sliceRed"], ["pizzaWhite", "sliceWhite"], ["pizzaGreen", "sliceGreen"],
  ["pizzaCorn", "sliceCorn"], ["pizzaBroccoli", "sliceBroccoli"], ["pizzaPineapple", "slicePineapple"],
  ["pizzaEgg", "sliceEgg"], ["pizzaShrimp", "sliceShrimp"], ["pizzaOnion", "sliceOnion"],
  ["pizzaBasil", "sliceBasil"], ["pizzaPepper", "slicePepper"], ["pizzaBlueberry", "sliceBlueberry"],
  ["pizzaZucchini", "sliceZucchini"],
];
export type IceCreamRound = { kind: "iceCream"; count: number; options: number[] };
export const listeningPrompts = {
  listenLeft: "Polož muffin na levý talíř.",
  listenRight: "Polož muffin na pravý talíř.",
  listenMiddle: "Polož muffin na prostřední talíř.",
  listenBlue: "Polož muffin na modrý talíř.",
  listenGreen: "Polož muffin na zelený talíř.",
  listenPink: "Polož muffin na růžový talíř.",
};
export const plateColors = { pink: "#dc84a9", blue: "#74a8d0", green: "#8bb973" };
export type ListenRound = { kind: "listen"; cue: keyof typeof listeningPrompts; plates: (keyof typeof plateColors)[]; answer: number };
export type VisualRound = { kind: "bricks" | "shadow" | "piece"; variant: number; options: number[]; answer: number };
export const visualPath = (kind: VisualRound["kind"], variant: number, option?: number) =>
  `./preschool/visual/${kind}-${variant}${option === undefined ? "" : `-${option}`}.png`;
export type GraphicRound = FeedRound | BuildRound | MazeRound | MoreRound | TripRound | BalanceRound | DoorRound | StreetRound | MatchRound | IceCreamRound | ListenRound | VisualRound;
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
const largeMazes = [
  ["S..#...", "##.#.#.", "...#.#.", ".###.#.", ".....#.", ".###..G"],
  ["S#....G", ".#.####", ".#.....", ".#####.", "...#...", "##...#."],
  ["S....#G", ".###.#.", "...#.#.", "##.#.#.", ".......", ".#####."],
  ["S#....G", "...###.", "##.....", "...###.", ".#.....", "....##."],
  ["S..#..G", ".#.#.#.", ".#...#.", ".###.#.", "...#...", "##...#."],
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
    case "pattern": {
      const patterns = shuffle([[0,1,2,0], [0,1,1,2], [0,0,1,2], [0,1,2,1], [0,1,0,2], [0,1,2,2]]);
      return Array.from({ length: 5 }, (_, index) => {
        const [first, second, third] = shuffle(patternPictures);
        if (level === 2) {
          const pool = [first, second, third];
          const unit = patterns[index].map(i => pool[i]);
          const tail = index % 3 + 1;
          return { kind: "choice", prompt: [...unit, ...unit, ...unit.slice(0, tail)], options: shuffle(pool), answer: unit[tail] };
        }
        const unit = index < 3 ? [first, second] : [first, first, second];
        return {
          kind: "choice" as const, prompt: [...unit, ...unit, ...unit],
          options: shuffle([first, second, third]), answer: first,
        };
      });
    }
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
      return shuffle(level === 2 ? [6, 7, 8, 9, 10] : [2, 2, 3, 4, 5]).map(count => {
        const columns = level === 2 ? 4 : count <= 2 ? 2 : 3;
        const palette = shuffle((Object.keys(shapes) as Shape[]).filter(shape => level === 2 || shape !== "diamond"));
        const pieces = Array.from({ length: count }, (_, i) => palette[i % palette.length]);
        const cells = shuffle([...pieces, ...Array<null>(columns * (level === 2 ? 3 : 2) - count).fill(null)]);
        return { kind: "build", columns, cells, palette };
      });
    case "maze":
      return shuffle<readonly string[]>(level === 2 ? largeMazes : mazes).map(map => ({
        kind: "maze", map, start: map.join("").indexOf("S"), goal: map.join("").indexOf("G"),
      }));
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
      return shuffle([[0, 0, 2], [1, 0, 1], [0, 0, 4], [1, 0, 3], [1, 3, 0], [2, 0, 2], [0, 0, 6], [4, 1, 1], [4, 2, 0]] as BalanceRound["starting"][]).slice(0, 5).map(([left, right, basket]) => ({
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
      return shuffle(level === 2 ? [5, 5, 6, 6, 6] : [3, 3, 4, 4, 4]).map(size => {
        const model = shuffle(level === 2 ? [...streetHouses, "streetTeal", "streetPink"] as const : streetHouses).slice(0, size);
        const houses = shuffle(model);
        if (houses.every((house, i) => house === model[i])) houses.push(houses.shift()!);
        return { kind: "street", houses, model };
      });
    case "match": {
      const count = level === 2 ? 5 : 3;
      const deck = shuffle(pizzaPairs);
      let previous: typeof pizzaPairs = [];
      return Array.from({ length: 5 }, () => {
        const pairs = deck.splice(0, count);
        if (pairs.length < count) {
          const fresh = pizzaPairs.filter(pair => !pairs.includes(pair) && !previous.includes(pair));
          const next = shuffle(fresh).slice(0, count - pairs.length);
          pairs.push(...next);
          deck.push(...shuffle(pizzaPairs.filter(pair => !pairs.includes(pair))));
        }
        previous = pairs;
        const pizzas = shuffle(pairs.map(([pizza]) => pizza));
        const slices = shuffle(pairs.map(([, slice]) => slice));
        if (pizzas.every((pizza, i) => pairs.some(pair => pair[0] === pizza && pair[1] === slices[i]))) slices.push(slices.shift()!);
        return { kind: "match", pizzas, slices };
      });
    }
    case "absent":
      if (level === 2) return Array.from({ length: 5 }, (_, i) => {
        const [answer, ...pool] = shuffle([animals, fruit][i % 2]);
        return { kind: "choice", prompt: pool, options: shuffle([answer, ...pool.slice(0, 3)]), answer };
      });
      return shuffle(oddGroups).concat(oddGroups[0]).map(({ family }) => {
        const [first, second, third, answer] = shuffle(family);
        return { kind: "choice", prompt: [first, second, third], options: shuffle([first, third, answer]), answer };
      });
    case "iceCream":
      return shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 5).map(count => ({
        kind: "iceCream", count,
        options: shuffle(Array.from({ length: 3 }, (_, i) => Math.max(1, Math.min(8, count - 1)) + i)),
      }));
    case "listen":
      return shuffle(["listenPink", ...shuffle((Object.keys(listeningPrompts) as ListenRound["cue"][]).filter(cue => cue !== "listenPink")).slice(0, 4)] as ListenRound["cue"][]).map(cue => {
        const plates = shuffle(Object.keys(plateColors) as ListenRound["plates"]);
        const answer = { listenLeft: 0, listenRight: 2, listenMiddle: 1, listenBlue: plates.indexOf("blue"), listenGreen: plates.indexOf("green"), listenPink: plates.indexOf("pink") }[cue];
        return { kind: "listen", cue, plates, answer };
      });
    case "bricks":
    case "shadow":
    case "piece":
      return shuffle(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, 5).map(variant => {
        const answer = game === "bricks" ? (variant - 1) % 10 + 1 : 0;
        const start = Math.min(7, Math.max(1, answer - 1));
        return { kind: game, variant, answer, options: shuffle(game === "bricks" ? [start, start + 1, start + 2, start + 3] : [0, 1, 2]) };
      });
    case "crowd":
      return Array.from({ length: 5 }, () => {
        const [answer, other] = shuffle(animals);
        const smaller = 1 + Math.floor(Math.random() * 4);
        const larger = smaller + 1 + Math.floor(Math.random() * 2);
        return { kind: "choice", prompt: shuffle([...Array<Picture>(larger).fill(answer), ...Array<Picture>(smaller).fill(other)]), options: shuffle([answer, other]), answer };
      });
  }
}
