import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  const [salt, storedHash] = storedValue.split(":");
  if (!salt || !storedHash) return false;
  const hash = scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const hashBuffer = Buffer.from(hash, "hex");
  if (storedBuffer.length !== hashBuffer.length) {
    return false;
  }
  return timingSafeEqual(storedBuffer, hashBuffer);
}
