import { sentenceGroups } from "./czech-grade2";
// 50 stable sets, five distinct sentences each. The source pool is reused from the reviewed sentence banks.
const source = Array.from({ length: 100 }, (_, i) =>
  sentenceGroups.map(([, bank]) => bank[i]),
).flat();
export const transcriptionSets = Array.from({ length: 50 }, (_, i) => ({
  id: `g2-transcription-${String(i + 1).padStart(2, "0")}`,
  sentences: source.slice(i * 5, i * 5 + 5),
}));
