export type StoryLevel = 1 | 2;
type IllustratedStory = readonly [id: string, frames: readonly string[]];

export const storyBanks: Record<StoryLevel, readonly IllustratedStory[]> = {
  1: [],
  2: [],
};

export const storyFrameId = (id: string, index: number) => `story-${id}-${index + 1}` as const;
export const storyFrameLabels = Object.fromEntries(
  [...storyBanks[1], ...storyBanks[2]].flatMap(([id, frames]) =>
    frames.map((description, index) => [storyFrameId(id, index), description]),
  ),
);
