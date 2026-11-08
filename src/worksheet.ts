import { subjects, topics, type Question, type Subject } from "./content";
import { makeSession, signature } from "./engine";
import { DEFAULT_GRADE, type Grade } from "./grades";
import { randomId } from "./random-id";

export type TopicSelection = { topic: string; count: number };
export type Worksheet = {
  grade?: Grade;
  id: string;
  subject: Subject;
  createdAt: string;
  sections: { topic: string; questions: Question[] }[];
};
export const subjectName = (subject: Subject) => subjects[subject].title;
export function validateSelection(
  subject: Subject,
  selections: TopicSelection[],
  grade: Grade = DEFAULT_GRADE,
): string | null {
  if (!selections.length) return "Vyber alespoň jedno téma.";
  if (new Set(selections.map((s) => s.topic)).size !== selections.length)
    return "Každé téma vyber pouze jednou.";
  if (
    selections.some(
      (s) =>
        !topics.some(
          (t) => t.id === s.topic && t.subject === subject && t.grade === grade,
        ),
    )
  )
    return "Téma nepatří do vybraného předmětu a ročníku.";
  if (
    selections.some(
      (s) => !Number.isInteger(s.count) || s.count < 1 || s.count > 20,
    )
  )
    return "U každého tématu zvol 1 až 20 příkladů.";
  if (selections.reduce((n, s) => n + s.count, 0) > 120)
    return "Jedna písemka může obsahovat nejvýše 120 příkladů.";
  return null;
}
export function createWorksheet(
  subject: Subject,
  selections: TopicSelection[],
  recent: string[] = [],
  grade: Grade = DEFAULT_GRADE,
): Worksheet {
  const error = validateSelection(subject, selections, grade);
  if (error) throw new Error(error);
  const generated = selections.map((s) => ({
    topic: s.topic,
    questions: makeSession([s.topic], s.count, recent),
  }));
  const id = randomId().slice(0, 8).toUpperCase();
  return {
    id,
    grade,
    subject,
    createdAt: new Date().toISOString(),
    sections: generated.map((s) => ({
      ...s,
      questions: s.questions.map((q, i) => ({
        ...q,
        id: `${id}-${s.topic}-${i}`,
      })),
    })),
  };
}
export const worksheetQuestions = (w: Worksheet) =>
  w.sections.flatMap((s) => s.questions);
export const worksheetSignatures = (w: Worksheet) =>
  worksheetQuestions(w).map(signature);

export type PaperItem = {
  lines: string[];
  answer: string;
  writingLines: number;
};
export type PaperSection = {
  style?: import("./content").Topic["paper"];
  title: string;
  instruction: string;
  items: PaperItem[];
  columns: 1 | 2;
};
const instructions: Record<string, string> = {
  arithmetic: "Vypočítej příklady.",
  tens: "Sčítej a odčítej celé desítky do 100.",
  "arithmetic-chain":
    "Počítej zleva doprava. Na řádek pod příkladem si můžeš napsat mezivýsledky.",
  "hundred-no-crossing":
    "Přičti nebo odečti jednotky bez přechodu přes desítku.",
  "hundred-crossing": "Přičti nebo odečti jednotky s přechodem přes desítku.",
  "hundred-two-digit":
    "Sečti nebo odečti dvě dvojciferná čísla. Na řádek si můžeš napsat mezivýpočet.",
  "length-conversion":
    "Převeď délku na uvedenou jednotku. Do mezery doplň jen číslo.",
  decompose: "Rozlož čísla na desítky a jednotky. Vzor: 47 = 40 + 7.",
  missing: "Doplň chybějící číslo do rámečku.",
  sequence: "Doplň chybějící číslo v každé řadě.",
  story: "Napiš výpočet, výsledek a krátkou odpověď.",
  alphabet: "Seřaď slova podle české abecedy.",
  syllables: "Rozděl slova svislými čarami na slabiky. Vzor: ko|lo.",
  sentences: "Napiš O = oznamovací, T = tázací, R = rozkazovací.",
  opposites: "Doplň slovo opačného významu.",
  categories: "Doplň nadřazené slovo, nebo jedno slovo z uvedené skupiny.",
  wordorder: "Ze slov sestav větu. Doplň velké písmeno a tečku.",
  dityni: "Doplň di, dy, ti, ty, ni nebo ny.",
  detene: "Doplň dě, tě nebo ně.",
  capitals: "Přepiš větu a oprav velká písmena.",
};
export function paperSections(w: Worksheet): PaperSection[] {
  return w.sections.map((s) => ({
    title: topics.find((t) => t.id === s.topic)!.title,
    style: topics.find((t) => t.id === s.topic)!.paper,
    instruction: instructions[s.topic] || "Vyřeš následující úlohy.",
    columns:
      topics.find((t) => t.id === s.topic)!.paper?.columns ??
      (["arithmetic", "tens", "decompose", "missing", "opposites"].includes(
        s.topic,
      )
        ? 2
        : 1),
    items: s.questions.map((q) => {
      const base = { answer: q.answers.join(" / "), writingLines: 0 };
      if (q.kind === "input" && q.prompt.includes("?"))
        return {
          ...base,
          lines: [q.prompt.replace("?", "________")],
          writingLines: Number(
            q.topic === "arithmetic-chain" || q.topic === "hundred-two-digit",
          ),
          answer:
            q.topic === "length-conversion"
              ? q.prompt.replace("?", base.answer)
              : base.answer,
        };
      if (q.topic === "decompose") {
        const n = q.prompt.match(/\d+/)![0];
        return { ...base, lines: [`${n} = ______ + ______`] };
      }
      if (q.topic === "missing") return { ...base, lines: [q.prompt] };
      if (q.topic === "sequence")
        return { ...base, lines: [q.prompt.replace("□", "______")] };
      if (q.topic === "story") {
        const equation = q.answers[0],
          result = equation.split(" = ")[1];
        return {
          ...base,
          lines: [q.text!],
          writingLines: 3,
          answer: `${equation}. Výsledek: ${result}.`,
        };
      }
      if (q.topic === "alphabet")
        return { ...base, lines: [q.tokens!.join(", ")], writingLines: 1 };
      if (q.topic === "syllables") return { ...base, lines: [q.text!] };
      if (q.topic === "sentences")
        return {
          ...base,
          lines: [`______    ${q.text}`],
          answer: (
            { Oznamovací: "O", Tázací: "T", Rozkazovací: "R" } as Record<
              string,
              string
            >
          )[q.answers[0]],
        };
      if (q.topic === "opposites")
        return {
          ...base,
          lines: [`${q.prompt.match(/„(.+)“/)![1]} → __________`],
        };
      if (q.topic === "categories")
        return {
          ...base,
          lines: [
            q.text ? `${q.text} → __________` : `${q.prompt}  __________`,
          ],
        };
      if (q.topic === "wordorder")
        return { ...base, lines: [q.tokens!.join(" / ")], writingLines: 1 };
      if (q.topic === "capitals")
        return { ...base, lines: [q.tokens!.join(" ")], writingLines: 1 };
      return { ...base, lines: [q.text || q.prompt] };
    }),
  }));
}

export type PaperRow = {
  cells: string[];
  size: number;
  bold?: boolean;
  height: number;
  rule?: boolean;
};
export type PaperPage = { rows: PaperRow[]; bodyTop: number };
export type Measure = (text: string, size: number, bold?: boolean) => number;
export const PAPER = {
  width: 595.28,
  height: 841.89,
  margin: 54,
  bodyTop: 145,
  continuationTop: 54,
  bodyBottom: 770,
};
function wrap(
  text: string,
  width: number,
  size: number,
  measure: Measure,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, size) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
export function layoutPaper(
  w: Worksheet,
  solutions: boolean,
  measure: Measure,
): PaperPage[] {
  const pages: PaperPage[] = [{ rows: [], bodyTop: PAPER.bodyTop }];
  let used = 0;
  const room = () => PAPER.bodyBottom - pages.at(-1)!.bodyTop;
  const width = PAPER.width - 2 * PAPER.margin;
  const put = (rows: PaperRow[]) => {
    const height = rows.reduce((n, r) => n + r.height, 0);
    if (used + height > room()) {
      pages.push({ rows: [], bodyTop: PAPER.continuationTop });
      used = 0;
    }
    pages.at(-1)!.rows.push(...rows);
    used += height;
  };
  paperSections(w).forEach((s, sectionIndex) => {
    const fontSize = solutions ? 14 : (s.style?.fontSize ?? 14);
    const lineHeight = solutions ? 24 : (s.style?.lineHeight ?? 24);
    const writingHeight = s.style?.writingLineHeight ?? 27;
    const itemSpacing = solutions ? 5 : (s.style?.itemSpacing ?? 5);
    const heading: PaperRow[] = [
      {
        cells: [`${sectionIndex + 1}. ${s.title}`],
        size: 16,
        bold: true,
        height: 26,
      },
      ...wrap(s.instruction, width, 11, measure).map((text) => ({
        cells: [text],
        size: 11,
        height: 17,
      })),
      { cells: [], size: 1, height: 5 },
    ];
    const groups: PaperRow[][] = [];
    for (let i = 0; i < s.items.length; i += s.columns) {
      const batch = s.items.slice(i, i + s.columns),
        colWidth = s.columns === 2 ? (width - 26) / 2 : width;
      const wrapped = batch.map((item, j) =>
        wrap(
          `${i + j + 1}) ${solutions ? item.answer : item.lines.join(" ")}`,
          colWidth,
          fontSize,
          measure,
        ),
      );
      const rows: PaperRow[] = Array.from(
        { length: Math.max(...wrapped.map((x) => x.length)) },
        (_, line) => ({
          cells: wrapped.map((x) => x[line] || ""),
          size: fontSize,
          height: lineHeight,
        }),
      );
      if (!solutions) {
        const writing = Math.max(...batch.map((x) => x.writingLines));
        for (let line = 0; line < writing; line++)
          rows.push({
            cells: s.columns === 2 ? ["", ""] : [""],
            size: 13,
            height: writingHeight,
            rule: true,
          });
      }
      rows.push({ cells: [], size: 1, height: itemSpacing });
      if (
        !solutions &&
        sectionIndex === w.sections.length - 1 &&
        i + s.columns >= s.items.length
      )
        rows.push({
          cells: ["Moje kontrola: Prošla jsem si všechny odpovědi."],
          size: 11,
          height: 24,
        });
      groups.push(rows);
    }
    put([...heading, ...(groups.shift() || [])]);
    for (const group of groups) {
      if (used + group.reduce((n, r) => n + r.height, 0) > room())
        put([
          {
            cells: [`${sectionIndex + 1}. ${s.title} (pokračování)`],
            size: 14,
            bold: true,
            height: 27,
          },
          ...group,
        ]);
      else put(group);
    }
    if (used + 8 <= room()) put([{ cells: [], size: 1, height: 8 }]);
  });
  return pages;
}
