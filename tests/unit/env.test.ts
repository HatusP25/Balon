import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("env", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("throws when ADMIN_PASSWORD is missing", async () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    await expect(import("@/lib/env?missing-pw")).rejects.toThrow(/ADMIN_PASSWORD/);
  });

  it("throws when SESSION_SECRET is shorter than 32 characters", async () => {
    process.env.ADMIN_PASSWORD = "hunter2";
    process.env.SESSION_SECRET = "short";
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    await expect(import("@/lib/env?short-secret")).rejects.toThrow(/SESSION_SECRET/);
  });

  it("returns parsed env when all values are valid", async () => {
    process.env.ADMIN_PASSWORD = "hunter2";
    process.env.SESSION_SECRET = "x".repeat(32);
    process.env.DATABASE_URL = "postgres://localhost/test";
    process.env.DATA_DIR = "/tmp/balon-data";

    const { env } = await import("@/lib/env?ok");
    expect(env.ADMIN_PASSWORD).toBe("hunter2");
    expect(env.SESSION_SECRET.length).toBe(32);
  });
});
