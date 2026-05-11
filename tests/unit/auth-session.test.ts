import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ADMIN_PASSWORD = "test-pw";
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.DATABASE_URL = "postgres://localhost/test";
  process.env.DATA_DIR = "/tmp/balon-test";
});

describe("session", () => {
  it("signs a session token", async () => {
    const { signSession } = await import("@/lib/auth/session");
    const token = signSession();
    expect(token).toMatch(/^admin\.[a-f0-9]{64}$/);
  });

  it("verifies a valid token", async () => {
    const { signSession, verifySession } = await import("@/lib/auth/session");
    const token = signSession();
    expect(verifySession(token)).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const { signSession, verifySession } = await import("@/lib/auth/session");
    const token = signSession();
    const tampered = token.slice(0, -1) + (token.slice(-1) === "0" ? "1" : "0");
    expect(verifySession(tampered)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    const { verifySession } = await import("@/lib/auth/session");
    expect(verifySession("garbage")).toBe(false);
    expect(verifySession("")).toBe(false);
    expect(verifySession("admin.")).toBe(false);
  });
});
