export const PRESCHOOL_GRADE = 0;
export const grades = [PRESCHOOL_GRADE, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Grade = (typeof grades)[number];
export const DEFAULT_GRADE: Grade = 2;
export const getGrade = (value: unknown): Grade =>
  grades.includes(value as Grade) ? (value as Grade) : DEFAULT_GRADE;

export const gradeLabel = (grade: Grade): string =>
  grade === PRESCHOOL_GRADE ? "Předškolák" : `${grade}. třída`;
