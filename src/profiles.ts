// Preserve the two existing slots, including their histories and active selection.
export function migrateProfileNames<
  T extends { profiles: { name: string }[]; profileNamesVersion?: number },
>(data: T): T {
  if (data.profileNamesVersion === 1) return data;
  return {
    ...data,
    profileNamesVersion: 1,
    profiles: data.profiles.map((p, i) => ({
      ...p,
      name: i === 0 ? "Terezka" : "Nelinka",
    })),
  };
}
