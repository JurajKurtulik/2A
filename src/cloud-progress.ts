import { useEffect, useRef, useState } from "react";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import type { Profile } from "./profiles";
import type { HistoryEntry } from "./progress";

const api = import.meta.env?.VITE_PROGRESS_API_URL ??
  "https://p-func-skolahrou-jk.azurewebsites.net/api/v1/profile";
const sessionKey = "skola-hrou-session-v1";
export type Login = {
  token: string;
  expires: number;
  profile: { id: string; name: string; avatar: string; legacySlot?: number };
};
type Event = { id: string; entry: HistoryEntry };
type Cache = { profile: Profile; acknowledged: string[] };
type Page = { events: Event[]; next: string | null };
export class ProgressError extends Error {
  constructor(readonly status: number) { super(`Progress API returned ${status}`); }
}

export function readLogin(): Login | null {
  try {
    const s = JSON.parse(localStorage.getItem(sessionKey) ?? "null") as Login | null;
    if (s && s.expires > Date.now() && /^[a-z0-9-]{1,32}$/.test(s.profile.id) &&
      typeof s.token === "string" && typeof s.profile.name === "string") return s;
  } catch { /* The browser can block local storage. */ }
  return null;
}
export function rememberLogin(login: Login | null) {
  try {
    if (login) localStorage.setItem(sessionKey, JSON.stringify(login));
    else localStorage.removeItem(sessionKey);
  } catch { /* The session can still be used in this tab. */ }
}
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${api}/${path}`, { ...options, cache: "no-store", signal: AbortSignal.timeout(18_000) });
  if (!response.ok) throw new ProgressError(response.status);
  return response;
}
export async function signIn(username: string, password: string): Promise<Login> {
  return (await request("login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })).json();
}

export function eventId(e: HistoryEntry): string {
  // Canonical field order gives copies of the same legacy result the same ID.
  const date = Number.isFinite(Date.parse(e.date)) ? new Date(e.date).toISOString() : e.date;
  const normalized = [date, e.label, e.kind, e.grade, e.variant, e.score, e.correctedScore, e.total,
    e.topics.map(t => [t.id, t.right, t.total])];
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify(normalized))));
}
export function mergeHistory(current: HistoryEntry[], incoming: Event[]): HistoryEntry[] {
  const entries = new Map(incoming.map(e => [e.id, e.entry]));
  for (const e of current) entries.set(eventId(e), e);
  return [...entries.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
function loadCache(key: string, login: Login, legacy: Profile | undefined): Cache {
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? "null") as Cache | null;
    if (cached && Array.isArray(cached.profile.history) && Array.isArray(cached.acknowledged)) return cached;
  } catch { /* Use the local legacy profile or start fresh. */ }
  return { profile: legacy ?? { name: login.profile.name, avatar: login.profile.avatar, history: [], recent: [] }, acknowledged: [] };
}
const delays = [5, 10, 20, 40, 60];

export function useCloudProgress(login: Login, legacy: Profile | undefined, onExpired: () => void) {
  const key = `skola-hrou-profile-v1:${login.profile.id}`;
  const [cache, setCache] = useState(() => loadCache(key, login, legacy));
  const [sync, setSync] = useState<"loading" | "ready" | "pending">("loading");
  const [storageError, setStorageError] = useState(false);
  const latest = useRef(cache);
  const wake = useRef<() => void>(() => {});
  function persist(next: Cache) {
    latest.current = next;
    setCache(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  function update(profile: Profile) {
    const current = latest.current;
    const history = mergeHistory(profile.history, current.profile.history.map(entry => ({ id: eventId(entry), entry })));
    persist({ ...current, profile: { ...profile, history } });
    if (history.length !== current.profile.history.length) wake.current();
  }
  useEffect(() => {
    let stopped = false, running = false, again = false, attempts = 0, lastSync = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const headers = { Authorization: `Bearer ${login.token}` };
    const pending = () => {
      const acknowledged = new Set(latest.current.acknowledged);
      return latest.current.profile.history.map(entry => ({ id: eventId(entry), entry }))
        .filter(event => !acknowledged.has(event.id));
    };
    async function syncNow() {
      if (stopped || document.hidden) return;
      if (running) { again = true; return; }
      clearTimeout(timer);
      running = true;
      try {
        let after: string | null = "";
        if (!lastSync || Date.now() - lastSync >= 5 * 60_000) {
          do {
            const response = await request(`progress?after=${encodeURIComponent(after)}`, { headers });
            const page = await response.json() as Page;
            if (stopped) return;
            const current = latest.current;
            persist({ profile: { ...current.profile, history: mergeHistory(current.profile.history, page.events) },
              acknowledged: [...new Set([...current.acknowledged, ...page.events.map(e => e.id)])] });
            after = page.next;
          } while (after);
          lastSync = Date.now();
        }
        let batch = pending().slice(0, 20);
        while (batch.length) {
          await request("progress", { method: "POST", headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ events: batch }) });
          if (stopped) return;
          const current = latest.current;
          persist({ ...current, acknowledged: [...new Set([...current.acknowledged, ...batch.map(e => e.id)])] });
          batch = pending().slice(0, 20);
        }
        attempts = 0;
        setSync("ready");
      } catch (error) {
        if (stopped) return;
        if (error instanceof ProgressError && error.status === 401) { onExpired(); return; }
        setSync("pending");
        if (attempts < delays.length) timer = setTimeout(() => void syncNow(), delays[attempts++] * 1000);
      } finally {
        running = false;
        if (again && !stopped) { again = false; void syncNow(); }
      }
    }
    function refresh() {
      if (document.hidden) return;
      attempts = 0;
      void syncNow();
    }
    wake.current = refresh;
    void syncNow();
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stopped = true;
      wake.current = () => {};
      clearTimeout(timer);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [login, onExpired]);
  return { profile: cache.profile, update, storageError, sync, refresh: () => wake.current() };
}
