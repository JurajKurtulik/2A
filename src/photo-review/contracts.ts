import { sha256 } from "@noble/hashes/sha2.js";

export type ReviewAssignment = {
  schemaVersion: 1;
  id: string;
  kind: "transcription";
  grade: number;
  subject: string;
  items: { id: string; expectedText: string }[];
};
export type ReviewConfig = {
  enabled: boolean;
  apiBaseUrl: string;
};
export type ReviewSession = {
  id: string;
  assignmentId: string;
  assignmentDigest: string;
  expiresAt: string;
  uploadToken: string;
  ownerToken: string;
};
export type ReviewStatus = {
  id: string;
  assignmentId: string;
  assignmentDigest: string;
  expiresAt: string;
  status: "waiting" | "processing" | "completed" | "failed" | "expired";
  result?: {
    items: { id: string; recognizedText: string; uncertain: boolean }[];
  };
};
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Služba vrátila neplatnou odpověď.");
  return v as Record<string, unknown>;
};
export function readConfig(input: unknown): ReviewConfig {
  const v = object(input);
  if (v.enabled !== true) return { enabled: false, apiBaseUrl: "" };
  const api = new URL(String(v.apiBaseUrl));
  if (
    api.protocol !== "https:" ||
    api.username ||
    api.password ||
    api.search ||
    api.hash
  )
    throw new Error("Adresa kontrolní služby musí používat HTTPS.");
  return { enabled: true, apiBaseUrl: api.href.replace(/\/$/, "") };
}
export function validateAssignment(a: ReviewAssignment) {
  if (
    a.schemaVersion !== 1 ||
    a.kind !== "transcription" ||
    !a.id ||
    a.id.length > 100 ||
    !Number.isInteger(a.grade) ||
    a.grade < 1 ||
    a.grade > 9 ||
    !a.subject ||
    a.items.length < 1 ||
    a.items.length > 5 ||
    new Set(a.items.map((i) => i.id)).size !== a.items.length ||
    a.items.some(
      (i) => !i.id || !i.expectedText.trim() || i.expectedText.length > 300,
    )
  )
    throw new Error("Neplatné zadání pro kontrolu fotky.");
}
// The canonical order is part of the v1 API contract, implemented identically by the backend.
export function canonicalAssignment(a: ReviewAssignment) {
  validateAssignment(a);
  return JSON.stringify({
    schemaVersion: 1,
    id: a.id,
    kind: a.kind,
    grade: a.grade,
    subject: a.subject,
    items: a.items.map((i) => ({ id: i.id, expectedText: i.expectedText })),
  });
}
export async function assignmentDigest(a: ReviewAssignment) {
  const bytes = sha256(new TextEncoder().encode(canonicalAssignment(a)));
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function validDate(v: unknown) {
  return typeof v === "string" && Number.isFinite(Date.parse(v));
}
export function readSession(
  input: unknown,
  a: ReviewAssignment,
  digest: string,
): ReviewSession {
  const v = object(input);
  if (
    typeof v.id !== "string" ||
    !/^[a-zA-Z0-9_-]{16,100}$/.test(v.id) ||
    v.assignmentId !== a.id ||
    v.assignmentDigest !== digest ||
    !validDate(v.expiresAt) ||
    Date.parse(String(v.expiresAt)) <= Date.now() ||
    Date.parse(String(v.expiresAt)) > Date.now() + 3600000 ||
    typeof v.ownerToken !== "string" ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(v.ownerToken) ||
    v.ownerToken === v.uploadToken ||
    typeof v.uploadToken !== "string" ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(v.uploadToken)
  )
    throw new Error("Nepodařilo se bezpečně propojit kontrolu se zadáním.");
  return v as ReviewSession;
}
export function readStatus(
  input: unknown,
  a: ReviewAssignment,
  session: ReviewSession,
): ReviewStatus {
  const v = object(input);
  if (
    v.id !== session.id ||
    v.assignmentId !== a.id ||
    v.assignmentDigest !== session.assignmentDigest ||
    v.expiresAt !== session.expiresAt ||
    !validDate(v.expiresAt) ||
    !["waiting", "processing", "completed", "failed", "expired"].includes(
      String(v.status),
    )
  )
    throw new Error("Výsledek nepatří k tomuto zadání.");
  if (v.status === "completed") {
    const result = object(v.result);
    if (!Array.isArray(result.items) || result.items.length !== a.items.length)
      throw new Error("Výsledek neobsahuje všechny věty.");
    const rows = result.items.map(object);
    if (
      new Set(rows.map((i) => i.id)).size !== a.items.length ||
      a.items.some((item) => !rows.some((r) => r.id === item.id)) ||
      rows.some(
        (i) =>
          typeof i.recognizedText !== "string" ||
          i.recognizedText.length > 1000 ||
          typeof i.uncertain !== "boolean",
      )
    )
      throw new Error("Neplatný přepis ze služby.");
  }
  return v as ReviewStatus;
}
export function uploadLink(base: string, s: ReviewSession) {
  const url = new URL(base);
  url.search = "";
  url.hash = new URLSearchParams({
    "photo-upload": s.id,
    token: s.uploadToken,
  }).toString();
  return url.href;
}
export function readUploadLink(hash: string) {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  if (!p.has("photo-upload")) return null;
  const id = p.get("photo-upload") || "",
    token = p.get("token") || "";
  if (
    !/^[a-zA-Z0-9_-]{16,100}$/.test(id) ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(token)
  )
    throw new Error(
      "Odkaz pro nahrání fotky není platný. Naskenuj nový QR kód.",
    );
  return { id, token };
}
export const normalizedText = (s: string) =>
  s.normalize("NFC").trim().replace(/\s+/g, " ");
export function compareTranscription(
  a: ReviewAssignment,
  texts: Record<string, string>,
) {
  return a.items.map((item) => ({
    id: item.id,
    expectedText: item.expectedText,
    recognizedText: texts[item.id] ?? "",
    correct:
      normalizedText(item.expectedText) ===
      normalizedText(texts[item.id] ?? ""),
  }));
}

type DifferenceToken = {
  value: string;
  kind: "word" | "punctuation";
  wordIndex: number;
};

function differenceTokens(value: string): DifferenceToken[] {
  const tokens: DifferenceToken[] = [];
  let wordIndex = 0;
  for (const match of normalizedText(value).matchAll(
    /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s]/gu,
  )) {
    const word = /^[\p{L}\p{N}]/u.test(match[0]);
    tokens.push({
      value: match[0],
      kind: word ? "word" : "punctuation",
      wordIndex: word ? ++wordIndex : wordIndex,
    });
  }
  return tokens;
}

function characterChanges(expected: string, actual: string): string[] {
  const left = Array.from(expected);
  const right = Array.from(actual);
  const width = right.length + 1;
  const cost = new Uint16Array((left.length + 1) * width);
  for (let i = 0; i <= left.length; i++) cost[i * width + right.length] = left.length - i;
  for (let j = 0; j <= right.length; j++) cost[left.length * width + j] = right.length - j;
  for (let i = left.length - 1; i >= 0; i--) {
    for (let j = right.length - 1; j >= 0; j--) {
      cost[i * width + j] = Math.min(
        (left[i] === right[j] ? 0 : 1) + cost[(i + 1) * width + j + 1],
        1 + cost[(i + 1) * width + j],
        1 + cost[i * width + j + 1],
      );
    }
  }
  const changes: string[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      i++;
      j++;
    } else if (
      i < left.length &&
      j < right.length &&
      cost[i * width + j] === 1 + cost[(i + 1) * width + j + 1]
    ) {
      changes.push(`znak ${i + 1}: „${left[i]}“ → „${right[j]}“`);
      i++;
      j++;
    } else if (
      i < left.length &&
      cost[i * width + j] === 1 + cost[(i + 1) * width + j]
    ) {
      changes.push(`znak ${i + 1}: „${left[i]}“ chybí`);
      i++;
    } else {
      changes.push(`za znakem ${i}: přebývá „${right[j]}“`);
      j++;
    }
  }
  return changes;
}

/** Lists every word and punctuation-token difference; whitespace is ignored. */
export function transcriptionDifferences(expected: string, actual: string) {
  const expectedTokens = differenceTokens(expected);
  const actualTokens = differenceTokens(actual);
  const width = actualTokens.length + 1;
  const lcs = new Uint16Array((expectedTokens.length + 1) * width);

  for (let i = expectedTokens.length - 1; i >= 0; i--) {
    for (let j = actualTokens.length - 1; j >= 0; j--) {
      lcs[i * width + j] =
        expectedTokens[i].value === actualTokens[j].value
          ? 1 + lcs[(i + 1) * width + j + 1]
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }

  const groups: { expected: DifferenceToken[]; actual: DifferenceToken[] }[] = [];
  let group: (typeof groups)[number] = { expected: [], actual: [] };
  const flush = () => {
    if (group.expected.length || group.actual.length) groups.push(group);
    group = { expected: [], actual: [] };
  };
  let i = 0;
  let j = 0;
  while (i < expectedTokens.length || j < actualTokens.length) {
    if (
      i < expectedTokens.length &&
      j < actualTokens.length &&
      expectedTokens[i].value === actualTokens[j].value
    ) {
      flush();
      i++;
      j++;
    } else if (
      i < expectedTokens.length &&
      (j === actualTokens.length ||
        lcs[(i + 1) * width + j] >= lcs[i * width + j + 1])
    ) {
      group.expected.push(expectedTokens[i++]);
    } else {
      group.actual.push(actualTokens[j++]);
    }
  }
  flush();

  const differences: string[] = [];
  for (const changed of groups) {
    const expectedWords = changed.expected.filter((token) => token.kind === "word");
    const actualWords = changed.actual.filter((token) => token.kind === "word");
    const pairedWords = Math.min(expectedWords.length, actualWords.length);
    for (let word = 0; word < pairedWords; word++) {
      const expectedWord = expectedWords[word].value;
      const actualWord = actualWords[word].value;
      const withoutMarks = (value: string) =>
        value.normalize("NFD").replace(/\p{M}/gu, "");
      const detail =
        expectedWord.toLocaleLowerCase("cs") === actualWord.toLocaleLowerCase("cs")
          ? "Liší se velikost písmen."
          : withoutMarks(expectedWord.toLocaleLowerCase("cs")) ===
              withoutMarks(actualWord.toLocaleLowerCase("cs"))
            ? "Liší se diakritika."
            : "Slovo je rozpoznané jinak.";
      const characters = characterChanges(expectedWord, actualWord);
      differences.push(
        `Slovo ${expectedWords[word].wordIndex}: má být „${expectedWord}“, ${detail}${characters.length ? ` Rozdíl po znacích: ${characters.join("; ")}.` : ""}`,
      );
    }
    for (const token of expectedWords.slice(pairedWords)) {
      differences.push(
        `Slovo ${token.wordIndex}: chybí „${token.value}“.`,
      );
    }
    for (const token of actualWords.slice(pairedWords)) {
      differences.push(
        `Navíc slovo „${token.value}“ (u ${token.wordIndex}. slova).`,
      );
    }

    const expectedPunctuation = changed.expected.filter(
      (token) => token.kind === "punctuation",
    );
    const actualPunctuation = changed.actual.filter(
      (token) => token.kind === "punctuation",
    );
    const pairedPunctuation = Math.min(
      expectedPunctuation.length,
      actualPunctuation.length,
    );
    for (let mark = 0; mark < pairedPunctuation; mark++) {
      const expectedMark = expectedPunctuation[mark];
      const actualMark = actualPunctuation[mark];
      const position = Math.max(expectedMark.wordIndex, actualMark.wordIndex);
      differences.push(
        `Interpunkce ${position ? `po ${position}. slově` : "na začátku věty"}: má být „${expectedMark.value}“, je „${actualMark.value}“.`,
      );
    }
    for (const token of expectedPunctuation.slice(pairedPunctuation)) {
      differences.push(
        `Chybí interpunkce „${token.value}“ po ${token.wordIndex}. slově.`,
      );
    }
    for (const token of actualPunctuation.slice(pairedPunctuation)) {
      differences.push(
        `Navíc interpunkce „${token.value}“ po ${token.wordIndex}. slově.`,
      );
    }
  }
  return differences;
}
