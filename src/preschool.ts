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
} as const;
export type Picture = keyof typeof pictures;
export const picturePath = (picture: Picture) => `./preschool/pictures/${picture}.png`;

export const preschoolGames = {
  odd: { title: "Co sem nepatří?", picture: "boot", instruction: "Zakroužkuj obrázek, který mezi ostatní nepatří." },
  pattern: { title: "Co přijde dál?", picture: "leaf", instruction: "Zakroužkuj obrázek, který pokračuje v řadě." },
  pair: { title: "Najdi pár", picture: "stripes", instruction: "Zakroužkuj ponožku, která je stejná jako předloha." },
  feed: { title: "Nakrm zajíčky", picture: "rabbit", instruction: "Spoj každého zajíčka s jednou mrkví." },
} as const;
export type PreschoolGame = keyof typeof preschoolGames;
export const preschoolGameIds = Object.keys(preschoolGames) as PreschoolGame[];
export const preschoolTopic = (game: PreschoolGame) => `preschool-${game}`;

type ChoiceRound = { kind: "choice"; prompt: Picture[]; options: Picture[]; answer: Picture };
type FeedRound = { kind: "feed"; count: number };
export type PreschoolRound = ChoiceRound | FeedRound;

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

export function preschoolRounds(game: PreschoolGame): PreschoolRound[] {
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
  }
}
