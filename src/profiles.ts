import type { Grade } from "./grades";
import type { HistoryEntry } from "./progress";

export type Profile = {
  name: string;
  avatar: string;
  history: HistoryEntry[];
  grade?: Grade;
  recent: string[];
  recentStories?: string[];
};

export const OLIVER_PROFILE_INDEX = 2;

export function withOliverProfile(profiles: Profile[]): Profile[] {
  return profiles.length === OLIVER_PROFILE_INDEX
    ? [...profiles, { name: "Oliver", avatar: "🦡", history: [], recent: [] }]
    : profiles;
}

// Preserve the existing slots, including their histories and active selection.
export function migrateProfileNames<
  T extends { profiles: { name: string }[]; profileNamesVersion?: number },
>(data: T): T {
  if (data.profileNamesVersion === 1) return data;
  return {
    ...data,
    profileNamesVersion: 1,
    profiles: data.profiles.map((p, i) => ({
      ...p,
      name: ["Terezka", "Nelinka"][i] ?? p.name,
    })),
  };
}
