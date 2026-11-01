import { isCorrect } from "./engine";
import type { Question } from "./content";
import { getGrade, type Grade } from "./grades";

export type HistoryEntry = {
  date: string;
  label: string;
  kind: "practice" | "test";
  grade: Grade;
  variant?: string;
  score: number;
  correctedScore?: number;
  total: number;
  topics: { id: string; right: number; total: number }[];
};
export function migrateHistory(
  entry: Omit<HistoryEntry, "kind" | "grade"> & {
    kind?: HistoryEntry["kind"];
    grade?: Grade;
  },
): HistoryEntry {
  return {
    ...entry,
    grade: getGrade(entry.grade),
    kind:
      entry.kind ??
      (/písemka|varianta/i.test(entry.label) ? "test" : "practice"),
  };
}
export function completionRecord(input: {
  label: string;
  test: boolean;
  grade: Grade;
  variant?: string;
  questions: Question[];
  answers: Record<string, string>;
  firstAnswers: Record<string, string>;
}): HistoryEntry {
  const totals = [...new Set(input.questions.map((q) => q.topic))].map((id) => {
    const qs = input.questions.filter((q) => q.topic === id);
    return {
      id,
      right: qs.filter((q) =>
        isCorrect(q, input.firstAnswers[q.id] ?? input.answers[q.id] ?? ""),
      ).length,
      total: qs.length,
    };
  });
  return {
    date: new Date().toISOString(),
    label: input.label,
    grade: input.grade,
    kind: input.test ? "test" : "practice",
    variant: input.variant,
    score: totals.reduce((n, t) => n + t.right, 0),
    correctedScore: input.questions.filter((q) =>
      isCorrect(q, input.answers[q.id] ?? ""),
    ).length,
    total: input.questions.length,
    topics: totals,
  };
}
