export const pictures = {
  apple: "jablko", pear: "hruška", banana: "banán", boot: "holínka",
  cat: "kočka", dog: "pejsek", rabbit: "zajíček", carrot: "mrkev",
  leaf: "list", acorn: "žalud", mushroom: "houba", flower: "květina",
  stripes: "pruhovaná ponožka", dots: "puntíkovaná ponožka", stars: "ponožka s hvězdičkami",
  speaker: "reproduktor",
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

const oddGroups: { family: Picture[]; outsiders: Picture[] }[] = [
  { family: ["apple", "pear", "banana"], outsiders: ["boot", "cat", "stripes", "speaker"] },
  { family: ["cat", "dog", "rabbit"], outsiders: ["carrot", "acorn", "leaf", "mushroom"] },
  { family: ["stripes", "dots", "stars"], outsiders: ["flower", "banana", "rabbit", "pear"] },
];
const patternPictures: Picture[] = ["leaf", "acorn", "mushroom", "flower", "apple", "carrot"];
const socks: Picture[] = ["stripes", "dots", "stars"];

export function preschoolRounds(game: PreschoolGame): PreschoolRound[] {
  switch (game) {
    case "odd":
      return shuffle(oddGroups.flatMap(({ family, outsiders }) =>
        outsiders.map(answer => ({
          kind: "choice" as const, prompt: [], options: shuffle([...family, answer]), answer,
        })),
      )).slice(0, 5);
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
      return [...shuffle(socks), ...shuffle(socks).slice(0, 2)].map(answer => ({
        kind: "choice" as const, prompt: [answer], options: shuffle(socks), answer,
      }));
    case "feed":
      return [1, 2, 3, 4, shuffle([5, 6])[0]].map(count => ({ kind: "feed", count }));
  }
}
