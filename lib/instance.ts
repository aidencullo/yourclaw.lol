import { createHash } from "crypto";

// Stable, collision-resistant machine name derived from a user identifier.
// Uses SHA-256 because email-stripping ("a@bc.com" and "ab@c.com" both
// become "abccom") was producing collisions across distinct users.
export function machineNameForUser(userId: string): string {
  const hash = createHash("sha256").update(userId).digest("hex").slice(0, 16);
  return `claw-${hash}`;
}
