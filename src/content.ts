import { DEFAULT_GRADE, type Grade } from "./grades";
export const subjects = {
  math: { title: "Matematika" },
  czech: { title: "Český jazyk" },
} as const;
export type Subject = keyof typeof subjects;
export type Kind = "input" | "choice" | "order" | "syllables" | "case";
export type Question = {
  contentKey?: string;
  id: string;
  topic: string;
  prompt: string;
  text?: string;
  kind: Kind;
  answers: string[];
  choices?: string[];
  tokens?: string[];
  explanation: string;
};
export type Topic = {
  grade: Grade;
  paper?: {
    fontSize?: number;
    lineHeight?: number;
    writingLineHeight?: number;
    itemSpacing?: number;
    columns?: 1 | 2;
  };
  id: string;
  subject: Subject;
  title: string;
  description: string;
  icon: string;
};
export const topics: Topic[] = [
  {
    id: "arithmetic",
    subject: "math",
    grade: 2,
    title: "Počítání do 20",
    description: "Sčítání a odčítání malých čísel.",
    icon: "＋",
  },
  {
    id: "tens",
    subject: "math",
    grade: 2,
    title: "Celé desítky",
    description: "Po desítkách až do stovky.",
    icon: "10",
  },
  {
    id: "decompose",
    subject: "math",
    grade: 2,
    title: "Desítky a jednotky",
    description: "Rozlož číslo na dvě části.",
    icon: "▦",
  },
  {
    id: "missing",
    subject: "math",
    grade: 2,
    title: "Ztracené číslo",
    description: "Najdi číslo, které se schovalo.",
    icon: "?",
  },
  {
    id: "sequence",
    subject: "math",
    grade: 2,
    title: "Číselné řady",
    description: "Objev pravidlo a pokračuj.",
    icon: "→",
  },
  {
    id: "story",
    subject: "math",
    grade: 2,
    title: "Slovní úlohy",
    description: "Malé příběhy, velké přemýšlení.",
    icon: "✎",
  },
  {
    id: "arithmetic-chain",
    subject: "math",
    grade: 2,
    title: "Početní řetězce",
    description: "Sečti a odečti pět čísel zleva doprava.",
    icon: "＋−",
    paper: { fontSize: 16, lineHeight: 30, writingLineHeight: 27, columns: 1 },
  },
  {
    id: "hundred-no-crossing",
    subject: "math",
    grade: 2,
    title: "Do 100 bez přechodu přes desítku",
    description: "Přičti nebo odečti jednotky a zůstaň ve stejné desítce.",
    icon: "＋",
    paper: { fontSize: 16, lineHeight: 32, columns: 2 },
  },
  {
    id: "hundred-crossing",
    subject: "math",
    grade: 2,
    title: "Do 100 s přechodem přes desítku",
    description: "Přičti nebo odečti jednotky a přejdi do sousední desítky.",
    icon: "↗",
    paper: { fontSize: 16, lineHeight: 32, columns: 2 },
  },
  {
    id: "hundred-two-digit",
    subject: "math",
    grade: 2,
    title: "Dvojciferná čísla do 100",
    description: "Sčítej a odčítej dvě dvojciferná čísla.",
    icon: "±",
    paper: { fontSize: 16, lineHeight: 30, writingLineHeight: 27, columns: 2 },
  },
  {
    id: "length-conversion",
    subject: "math",
    grade: 2,
    title: "Převody délky (mm, cm, dm)",
    description: "Převáděj milimetry, centimetry a decimetry.",
    icon: "↔",
    paper: { fontSize: 16, lineHeight: 32, columns: 2 },
  },
  {
    id: "alphabet",
    paper: {
      fontSize: 18,
      lineHeight: 32,
      writingLineHeight: 54,
      itemSpacing: 12,
      columns: 1,
    },
    subject: "czech",
    grade: 2,
    title: "Hrátky s abecedou",
    description: "Seřaď slova od A do Ž.",
    icon: "A",
  },
  {
    id: "syllables",
    paper: { fontSize: 22, lineHeight: 46, itemSpacing: 18, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Slova a slabiky",
    description: "Rozděl slova malým kliknutím.",
    icon: "••",
  },
  {
    id: "sentences",
    paper: { fontSize: 18, lineHeight: 38, itemSpacing: 12, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Druhy vět",
    description: "Oznamujeme, ptáme se, přikazujeme.",
    icon: "?!",
  },
  {
    id: "opposites",
    paper: { fontSize: 18, lineHeight: 38, itemSpacing: 12, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Slovní protiklady",
    description: "Najdi slovo opačného významu.",
    icon: "↔",
  },
  {
    id: "categories",
    paper: { fontSize: 18, lineHeight: 38, itemSpacing: 12, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Co k sobě patří?",
    description: "Nadřazená a podřazená slova.",
    icon: "⌘",
  },
  {
    id: "wordorder",
    paper: {
      fontSize: 18,
      lineHeight: 32,
      writingLineHeight: 54,
      itemSpacing: 12,
      columns: 1,
    },
    subject: "czech",
    grade: 2,
    title: "Poskládej větu",
    description: "Ze slov sestav celý příběh.",
    icon: "≡",
  },
  {
    id: "dityni",
    paper: { fontSize: 20, lineHeight: 42, itemSpacing: 14, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Di, dy, ti, ty, ni, ny",
    description: "Vyber slabiku do slova.",
    icon: "i/y",
  },
  {
    id: "detene",
    paper: { fontSize: 20, lineHeight: 42, itemSpacing: 14, columns: 1 },
    subject: "czech",
    grade: 2,
    title: "Dě, tě, ně",
    description: "Doplň správné háčky.",
    icon: "ě",
  },
  {
    id: "capitals",
    paper: {
      fontSize: 18,
      lineHeight: 32,
      writingLineHeight: 54,
      itemSpacing: 12,
      columns: 1,
    },
    subject: "czech",
    grade: 2,
    title: "Velká písmena",
    description: "Jména lidí, zvířat a měst.",
    icon: "Aa",
  },
];
export {
  syllables,
  opposites,
  categories,
  sentenceGroups,
  dityni,
  detene,
  wordSentences,
  alternateSentences,
  capitalSentences,
} from "./banks/czech-grade2";

export const topicsForGrade = (
  grade: Grade = DEFAULT_GRADE,
  subject?: Subject,
) =>
  topics.filter(
    (t) => t.grade === grade && (!subject || t.subject === subject),
  );
