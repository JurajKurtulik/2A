import { useEffect, useState } from "react";
import { readConfig, type ReviewConfig } from "./contracts";
let configPromise: Promise<ReviewConfig> | undefined;
export function loadReviewConfig() {
  return (configPromise ??= (async () => {
    const response = await fetch(
      `${import.meta.env.BASE_URL}photo-review-config.json`,
      { cache: "no-store", credentials: "omit" },
    );
    if (!response.ok)
      throw new Error("Nastavení kontroly fotek se nepodařilo načíst.");
    return readConfig(await response.json());
  })());
}
export function useReviewConfig() {
  const [state, setState] = useState<{ config?: ReviewConfig; error?: string }>(
    {},
  );
  useEffect(() => {
    let active = true;
    loadReviewConfig()
      .then((config) => {
        if (active) setState({ config });
      })
      .catch(() => {
        if (active)
          setState({
            error:
              "Nastavení kontroly fotek není dostupné. Obnov stránku a zkus to znovu.",
          });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}
