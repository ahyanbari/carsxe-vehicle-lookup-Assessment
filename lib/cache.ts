import type { VinResult, PlateResult } from "./types";

const STORAGE_KEY = "vl_recent";
const MAX_ENTRIES = 5;
// Entries older than this are considered stale and pruned on read
const TTL_MS = 60 * 60 * 1000;

export interface CacheEntry {
  key: string;
  label: string;
  result: { type: "vin"; data: VinResult } | { type: "plate"; data: PlateResult };
  timestamp: number;
}

function read(): CacheEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CacheEntry[];
  } catch {
    return [];
  }
}

function write(entries: CacheEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getCacheEntries(): CacheEntry[] {
  const now = Date.now();
  const fresh = read().filter((e) => now - e.timestamp < TTL_MS);
  // Write back to prune any stale entries from storage
  write(fresh);
  return fresh;
}

export function addCacheEntry(entry: CacheEntry): void {
  // Remove duplicate key, push new entry to front, cap at MAX_ENTRIES
  const entries = read().filter((e) => e.key !== entry.key);
  entries.unshift(entry);
  write(entries.slice(0, MAX_ENTRIES));
}

export function makeCacheKey(type: "vin" | "plate", value: string, state?: string): string {
  return type === "plate" && state ? `${value}·${state}` : value;
}

export function makeCacheLabel(type: "vin" | "plate", value: string, state?: string): string {
  return type === "plate" && state ? `${value} · ${state}` : value;
}
