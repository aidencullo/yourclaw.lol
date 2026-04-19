/**
 * Client-side helper to manage the `claw-id` cookie.
 *
 * On first visit a random UUID v4 is generated and stored in a cookie
 * that persists for 1 year. Subsequent calls return the existing value.
 */

function uuidv4(): string {
  // Use crypto.randomUUID when available, otherwise fall back to manual.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC 4122 version 4 UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 86400}; SameSite=Lax`;
}

/**
 * Returns the current `claw-id`, creating one if it doesn't exist yet.
 */
export function getClawId(): string {
  const existing = getCookie("claw-id");
  if (existing) return existing;

  const id = uuidv4();
  setCookie("claw-id", id, 365);
  return id;
}
