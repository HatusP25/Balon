import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

let tempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "balon-avatars-"));
  process.env.ADMIN_PASSWORD = "x";
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.DATABASE_URL = "postgres://localhost/test";
  process.env.DATA_DIR = tempDir;
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("avatar storage", () => {
  it("saves an avatar as a 256x256 webp", async () => {
    const { saveAvatar } = await import("@/lib/storage/avatars");

    const png = await sharp({
      create: { width: 800, height: 800, channels: 3, background: { r: 50, g: 100, b: 50 } },
    })
      .png()
      .toBuffer();

    const result = await saveAvatar("player-abc", png);
    expect(result.path).toBe("avatars/player-abc.webp");

    const onDisk = path.join(tempDir, "avatars", "player-abc.webp");
    expect(existsSync(onDisk)).toBe(true);

    const meta = await sharp(readFileSync(onDisk)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });

  it("reads an avatar back", async () => {
    const { saveAvatar, readAvatar } = await import("@/lib/storage/avatars");
    const png = await sharp({
      create: { width: 400, height: 400, channels: 3, background: { r: 10, g: 10, b: 10 } },
    }).png().toBuffer();
    await saveAvatar("player-xyz", png);
    const buf = await readAvatar("player-xyz.webp");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(100);
  });

  it("returns null when reading a missing avatar", async () => {
    const { readAvatar } = await import("@/lib/storage/avatars");
    const buf = await readAvatar("nonexistent.webp");
    expect(buf).toBeNull();
  });
});
