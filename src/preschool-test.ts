import { preschoolGameIds, preschoolRounds, type PreschoolGame, type PreschoolRound } from "./preschool";
import type { StoryLevel } from "./banks/preschool-stories";

export type PreschoolTestItem = { game: PreschoolGame; round: PreschoolRound };
export type PreschoolTestCounts = Partial<Record<PreschoolGame, number>>;
export type PreschoolResult = { id: string; right: number; total: number };
export const maxPreschoolTestItems = 120;
export const maxPreschoolGameItems = 20;

export function makePreschoolTest(counts: PreschoolTestCounts, level: StoryLevel, recentStories: readonly string[]) {
  const paper: PreschoolTestItem[] = [];
  const queue = preschoolGameIds.flatMap(game => {
    const count = counts[game] ?? 0;
    if (!count) return [];
    if (!Number.isInteger(count) || count < 0 || count > maxPreschoolGameItems) throw new RangeError("Neplatný počet úloh.");
    const items: PreschoolTestItem[] = [];
    const seen = [...recentStories];
    while (items.length < count) {
      const rounds = preschoolRounds(game, level, seen).slice(0, count - items.length);
      items.push(...rounds.map(round => ({ game, round })));
      seen.push(...rounds.flatMap(round => round.kind === "story" ? [round.storyId] : []));
    }
    paper.push(...items);
    return [{ game, items }];
  });
  if (!paper.length || paper.length > maxPreschoolTestItems) throw new RangeError("Neplatný počet úloh.");
  const online: PreschoolTestItem[] = [];
  while (online.length < paper.length) {
    const available = queue.filter(group => group.items.length);
    const previous = online.at(-1)?.game;
    const eligible = available.filter(group => group.game !== previous);
    const candidates = eligible.length ? eligible : available;
    const total = available.reduce((sum, group) => sum + group.items.length, 0);
    const largest = candidates.find(group => group.items.length > (total - 1) / 2);
    const chosen = largest ?? candidates[Math.floor(Math.random() * candidates.length)];
    online.push(chosen.items.shift()!);
  }
  return { paper, online };
}
