import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { SESSION_PAYLOAD } from "./constants";

function hmac(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("hex");
}

export function signSession(): string {
  return `${SESSION_PAYLOAD}.${hmac(SESSION_PAYLOAD)}`;
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (payload !== SESSION_PAYLOAD || sig.length !== 64) return false;
  const expected = hmac(payload);
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
