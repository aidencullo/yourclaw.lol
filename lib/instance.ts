import { createHash } from "node:crypto";

/**
 * Deterministic Fly app name for a given user identifier (UUID from cookie).
 *
 * Fly app names must be globally unique, lowercase, alphanumeric + hyphens,
 * and <= 30 characters. We prefix with "openclaw-" and append 12 hex chars
 * of sha256(identifier) -- collision probability is negligible at this scale.
 */
export function appNameForUser(identifier: string): string {
  const hash = createHash("sha256")
    .update(identifier.trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
  return `openclaw-${hash}`;
}
