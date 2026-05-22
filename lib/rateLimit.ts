// Production would use Redis or Upstash
const WINDOW_MS = 60_000;
const LIMIT = 20;

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}
