import { createHash } from 'node:crypto';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
export type Assignment = {
  schemaVersion: 1; id: string; kind: 'transcription'; grade: number; subject: string;
  items: { id: string; expectedText: string }[];
};
export type Result = { items: { id: string; recognizedText: string; uncertain: boolean }[] };
export type State = 'waiting' | 'processing' | 'completed' | 'failed';
export type Session = {
  id: string; assignment: Assignment; assignmentDigest: string; expiresAt: string;
  createdAt: number; keyVersion: string; ownerHash: string; uploadHash: string;
  state: State; processingDeadline?: number; result?: Result;
};
export const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'invalid_json');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
export function parseAssignment(input: unknown): Assignment {
  const a = record(input);
  if (a.schemaVersion !== 1 || a.kind !== 'transcription' || !text(a.id, 100)
    || !Number.isInteger(a.grade) || Number(a.grade) < 1 || Number(a.grade) > 9
    || !text(a.subject, 100) || !Array.isArray(a.items) || a.items.length < 1 || a.items.length > 5)
    throw new ApiError(400, 'invalid_assignment');
  const items = a.items.map(value => {
    const i = record(value);
    if (!text(i.id, 100) || !text(i.expectedText, 300)) throw new ApiError(400, 'invalid_assignment');
    return { id: i.id, expectedText: i.expectedText };
  });
  if (new Set(items.map(i => i.id)).size !== items.length) throw new ApiError(400, 'duplicate_items');
  return { schemaVersion: 1, id: a.id, kind: 'transcription', grade: Number(a.grade), subject: a.subject, items };
}
// Match frontend JSON.stringify key order exactly; do not normalize Unicode here.
export const canonicalAssignment = (a: Assignment) => JSON.stringify(parseAssignment(a));
export function parseCreate(value: unknown) {
  const body = record(value), assignment = parseAssignment(body.assignment);
  const digest = sha256(canonicalAssignment(assignment));
  if (body.assignmentDigest !== digest) throw new ApiError(400, 'digest_mismatch');
  return { assignment, digest };
}
export function parseResult(value: unknown, ids: string[]): Result {
  const r = record(value);
  if (Object.keys(r).some(k => k !== 'items') || !Array.isArray(r.items) || r.items.length !== ids.length)
    throw new ApiError(503, 'invalid_model_result');
  const items = r.items.map(value => {
    const i = record(value);
    if (Object.keys(i).some(k => !['id', 'recognizedText', 'uncertain'].includes(k))
      || typeof i.id !== 'string' || !ids.includes(i.id) || typeof i.recognizedText !== 'string'
      || i.recognizedText.length > 1000 || typeof i.uncertain !== 'boolean')
      throw new ApiError(503, 'invalid_model_result');
    return { id: i.id, recognizedText: i.recognizedText, uncertain: i.uncertain };
  });
  if (new Set(items.map(i => i.id)).size !== ids.length) throw new ApiError(503, 'invalid_model_result');
  return { items };
}