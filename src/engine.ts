import {
  topics,
  syllables,
  opposites,
  categories,
  sentenceGroups,
  dityni,
  detene,
  wordSentences,
  alternateSentences,
  capitalSentences,
  type Question,
  type Subject,
} from "./content";
export const shuffle = <T>(xs: readonly T[]): T[] => {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(xs: readonly T[]) => xs[random(0, xs.length - 1)];
export const normalize = (s: string) =>
  s.trim().replace(/\s+/g, " ").normalize("NFC");
export const isCorrect = (q: Question, value: string) =>
  q.answers.some((a) => normalize(a) === normalize(value));
const q = (
  topic: string,
  prompt: string,
  answer: string,
  explanation: string,
  extra: Partial<Question> = {},
): Question => ({
  id: "",
  topic,
  prompt,
  kind: "input",
  answers: [answer],
  explanation,
  ...extra,
});
export function generate(topic: string): Question {
  const a = random(0, 20),
    b = random(0, 20 - a);
  if (topic === "arithmetic" || topic === "tens") {
    const scale = topic === "tens" ? 10 : 1,
      max = topic === "tens" ? 10 : 20,
      x = random(0, max),
      y = random(0, max - x),
      subtract = Math.random() < 0.5;
    return q(
      topic,
      subtract
        ? `${(x + y) * scale} − ${y * scale} = ?`
        : `${x * scale} + ${y * scale} = ?`,
      String((subtract ? x : x + y) * scale),
      subtract
        ? `Od ${(x + y) * scale} odečteme ${y * scale}. Zbude ${x * scale}.`
        : `K ${x * scale} přidáme ${y * scale}. Dohromady je to ${(x + y) * scale}.`,
    );
  }
  if (topic === "decompose") {
    const n = random(10, 99),
      t = Math.floor(n / 10) * 10,
      u = n % 10;
    return q(
      topic,
      `Rozlož číslo ${n} na desítky a jednotky.`,
      `${t} + ${u}`,
      `${n} tvoří ${t / 10} desítek a ${u} jednotek.`,
      {
        kind: "choice",
        choices: shuffle([
          `${t} + ${u}`,
          `${u} + ${t / 10}`,
          `${t} + ${u + 1}`,
        ]),
      },
    );
  }
  if (topic === "missing") {
    const scale = Math.random() < 0.5 ? 1 : 10,
      x = scale === 1 ? a : random(0, 10),
      y = scale === 1 ? b : random(0, 10 - x);
    const mode = random(0, 2);
    return q(
      topic,
      mode === 0
        ? `${x * scale} + □ = ${(x + y) * scale}`
        : mode === 1
          ? `□ − ${y * scale} = ${x * scale}`
          : `${(x + y) * scale} − □ = ${x * scale}`,
      String((mode === 0 || mode === 2 ? y : x + y) * scale),
      `Celý příklad je ${mode === 0 ? `${x * scale} + ${y * scale} = ${(x + y) * scale}` : `${(x + y) * scale} − ${y * scale} = ${x * scale}`}.`,
    );
  }
  if (topic === "sequence") {
    const step = pick([1, 2, 5, 10]),
      start = random(0, 100 - 5 * step),
      values = Array.from({ length: 6 }, (_, i) => start + i * step),
      hole = random(1, 4);
    return q(
      topic,
      values.map((v, i) => (i === hole ? "□" : v)).join(" → "),
      String(values[hole]),
      `Pokaždé přičteme ${step}. Celá řada: ${values.join(", ")}.`,
    );
  }
  if (topic === "story") {
    const scale = Math.random() < 0.3 ? 10 : 1,
      x = scale === 1 ? random(3, 12) : random(1, 5),
      y = scale === 1 ? random(1, 20 - x) : random(1, 10 - x),
      add = Math.random() < 0.5;
    const [name, item, unit] = pick([
      ["Ema", "samolepek", "samolepek"],
      ["Petr", "pastelek", "pastelek"],
      ["Klára", "knížek", "knížek"],
      ["Adam", "kostek", "kostek"],
    ]);
    const result = (add ? x + y : x) * scale;
    return q(
      topic,
      "Vyřeš příběh.",
      String(result),
      `${add ? `${x * scale} + ${y * scale}` : `${(x + y) * scale} − ${y * scale}`} = ${result}. Odpověď: ${result} ${unit}.`,
      {
        text: add
          ? `${name} má ${x * scale} ${item}. Dostane ještě ${y * scale}. Kolik jich má dohromady?`
          : `${name} má ${(x + y) * scale} ${item}. ${y * scale} jich rozdá. Kolik jich zůstane?`,
        kind: "choice",
        choices: shuffle([
          `${add ? `${x * scale} + ${y * scale}` : `${(x + y) * scale} − ${y * scale}`} = ${result}`,
          `${add ? `${x * scale} − ${y * scale}` : `${(x + y) * scale} + ${y * scale}`} = ${(add ? x - y : x + 2 * y) * scale}`,
          `${x * scale} + 0 = ${x * scale}`,
        ]),
        answers: [
          `${add ? `${x * scale} + ${y * scale}` : `${(x + y) * scale} − ${y * scale}`} = ${result}`,
        ],
      },
    );
  }
  if (topic === "alphabet") {
    const words = shuffle(categories.flatMap((c) => c[1])).slice(0, 5);
    const sorted = [...words].sort((a, b) => a.localeCompare(b, "cs"));
    return q(
      topic,
      "Seřaď slova podle abecedy.",
      sorted.join(" "),
      `Podle české abecedy: ${sorted.join(", ")}.`,
      { kind: "order", tokens: shuffle(words) },
    );
  }
  if (topic === "syllables") {
    const word = pick(syllables);
    return q(
      topic,
      "Klikni mezi písmena a rozděl slovo na slabiky.",
      word,
      `Slabiky: ${word.split("|").join(" – ")}. Zkus si slovo pomalu vytleskat.`,
      { kind: "syllables", text: word.replaceAll("|", "") },
    );
  }
  if (topic === "sentences") {
    const [type, bank] = pick(sentenceGroups),
      text = pick(bank);
    return q(
      topic,
      "Jaký je to druh věty?",
      type,
      type === "Tázací"
        ? "Touto větou se ptáme."
        : type === "Rozkazovací"
          ? "Touto větou dáváme pokyn nebo vyjadřujeme žádost."
          : "Touto větou něco oznamujeme.",
      { kind: "choice", text, choices: sentenceGroups.map((x) => x[0]) },
    );
  }
  if (topic === "opposites") {
    const [word, answer] = pick(opposites);
    return q(
      topic,
      `Co je opak slova „${word}“?`,
      answer,
      `Slova „${word}“ a „${answer}“ mají opačný význam.`,
      {
        kind: "choice",
        choices: shuffle([
          answer,
          ...shuffle(
            [...new Set(opposites.map((x) => x[1]))].filter(
              (x) => x !== answer,
            ),
          ).slice(0, 3),
        ]),
      },
    );
  }
  if (topic === "categories") {
    const [category, words] = pick(categories);
    if (Math.random() < 0.5)
      return q(
        topic,
        "Jaké slovo je nadřazené?",
        category,
        `${words.slice(0, 3).join(", ")} patří do skupiny „${category}“.`,
        {
          text: shuffle(words).slice(0, 3).join(" · "),
          kind: "choice",
          choices: shuffle([
            category,
            ...shuffle(
              categories.map((x) => x[0]).filter((x) => x !== category),
            ).slice(0, 3),
          ]),
        },
      );
    const answer = pick(words);
    return q(
      topic,
      `Co patří do skupiny „${category}“?`,
      answer,
      `„${answer}“ patří do skupiny „${category}“.`,
      {
        kind: "choice",
        choices: shuffle([
          answer,
          ...shuffle(
            categories.filter((x) => x[0] !== category).map((x) => pick(x[1])),
          ).slice(0, 3),
        ]),
      },
    );
  }
  if (topic === "wordorder") {
    const index = random(0, wordSentences.length - 1),
      sentence = wordSentences[index],
      tokens = sentence
        .slice(0, -1)
        .split(" ")
        .map((w, i) =>
          i === 0 &&
          !["Eva", "Petr", "Klára", "Tomáš", "Ema", "Jana"].includes(w)
            ? w.toLocaleLowerCase("cs")
            : w,
        );
    return q(
      topic,
      "Poskládej větu. Velké písmeno a tečku doplníme.",
      sentence,
      `Jedna správná věta: ${sentence}`,
      {
        kind: "order",
        tokens: shuffle(tokens),
        answers: [sentence, alternateSentences[index]],
      },
    );
  }
  if (topic === "dityni" || topic === "detene") {
    const [answer, word] = pick(topic === "dityni" ? dityni : detene);
    const contexts: Record<string, string> = {
      kotě: "Malá kočka je kotě.",
      koně: "Ve stáji stojí koně.",
      tělo: "Hlava, ruce a nohy jsou části těla. Toto je moje tělo.",
      děj: "Pohádka má napínavý děj.",
      dlaně: "Na rukou máme dlaně.",
      vůně: "Z kuchyně se line příjemná vůně.",
      lodě: "Po řece plují lodě.",
      nit: "Jehla a nit patří k šití.",
      tygr: "Pruhovaná šelma je tygr.",
      sady: "Rostou tam ovocné stromy. Jsou to sady.",
      sudy: "Velké nádoby na vodu jsou sudy.",
    };
    const blank = word.replace(answer, "___");
    return q(
      topic,
      "Doplň slabiku do slova.",
      answer,
      `Správně píšeme „${word}“.`,
      {
        text: contexts[word] ? contexts[word].replace(word, blank) : blank,
        kind: "choice",
        choices:
          topic === "dityni"
            ? ["di", "dy", "ti", "ty", "ni", "ny"]
            : ["dě", "tě", "ně"],
      },
    );
  }
  const sentence = pick(capitalSentences);
  return q(
    "capitals",
    "Kliknutím na slova oprav velká písmena.",
    sentence,
    `Správně: ${sentence} Velké písmeno patří na začátek věty a k vlastním jménům.`,
    { kind: "case", tokens: sentence.toLocaleLowerCase("cs").split(" ") },
  );
}
export function makeSession(
  topicIds: string[],
  count: number,
  recent: string[] = [],
): Question[] {
  const output: Question[] = [],
    used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const topic = topicIds[i % topicIds.length];
    let item: Question;
    let fingerprint = "";
    let attempt = 0;
    do {
      item = generate(topic);
      fingerprint = signature(item);
      attempt++;
    } while (
      (used.has(fingerprint) ||
        (attempt < 60 && recent.includes(fingerprint))) &&
      attempt < 200
    );
    used.add(fingerprint);
    output.push({ ...item, id: `${Date.now()}-${i}` });
  }
  return output;
}
export const signature = (q: Question) =>
  `${q.topic}:${q.prompt}:${q.text || ""}:${q.answers.join("/")}`;
export const subjectTopics = (subject: Subject) =>
  topics.filter((t) => t.subject === subject).map((t) => t.id);
