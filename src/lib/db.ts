import { createSeed, DB_VERSION } from "./seed";
import type { DB } from "./types";

/**
 * Browser-side persistence used while the Spring Boot backend is not connected.
 * All reads/writes go through `read()` and `transaction()` so the storage can later be
 * swapped for HTTP calls to /api/v1 without touching UI code.
 */
const STORAGE_KEY = "atmosfera.db";
export const DB_CHANGED_EVENT = "atmosfera:db-changed";

let memory: DB | null = null;

function persist(db: DB) {
  memory = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Quota exceeded (large uploads) — keep working in memory for this tab.
  }
}

export function read(): DB {
  if (memory) return memory;
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) {
        memory = parsed;
        return parsed;
      }
    }
  } catch {
    // Corrupted storage — fall through to a fresh seed.
  }
  const seed = createSeed();
  persist(seed);
  return seed;
}

/**
 * Runs `fn` against a copy of the database and commits only if it returns without throwing.
 * JavaScript runs this synchronously, so check-then-write inside `fn` cannot interleave with
 * another transaction — the browser equivalent of SELECT … FOR UPDATE on the server.
 */
export function transaction<T>(fn: (db: DB) => T): T {
  const draft = structuredClone(read());
  const result = fn(draft);
  persist(draft);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DB_CHANGED_EVENT));
  return result;
}

export function resetDatabase() {
  persist(createSeed());
  window.dispatchEvent(new Event(DB_CHANGED_EVENT));
}

/** Another tab changed the data — drop our cached copy. */
export function subscribeToExternalChanges(onChange: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    memory = null;
    onChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(DB_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DB_CHANGED_EVENT, onChange);
  };
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
