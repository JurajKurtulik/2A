import { test } from "node:test";
import assert from "node:assert/strict";
import { eventId, mergeHistory } from "../src/cloud-progress";
import type { HistoryEntry } from "../src/progress";

test("Identical history from another device merges once and keeps newer local results", () => {
  const old: HistoryEntry = { date: "2026-11-02T09:00:00Z", kind: "practice", grade: 2,
    label: "Počítání", score: 5, total: 6, topics: [{ id: "arithmetic", right: 5, total: 6 }] };
  const fromSql = { ...old, date: "2026-11-02T09:00:00.000Z", topics: [{ id: "arithmetic", total: 6, right: 5 }] };
  const newer = { ...old, date: "2026-11-12T11:00:00Z", score: 6 };
  assert.equal(eventId(old), eventId(fromSql));
  assert.deepEqual(mergeHistory([newer, old], [{ id: eventId(fromSql), entry: fromSql }]), [newer, old]);
});
