import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/lib/env";

const AVATAR_SIZE = 256;

function avatarsDir(): string {
  return path.join(env.DATA_DIR, "avatars");
}

export async function saveAvatar(
  playerId: string,
  input: Buffer,
): Promise<{ path: string }> {
  await mkdir(avatarsDir(), { recursive: true });
  const filename = `${playerId}.webp`;
  const fullPath = path.join(avatarsDir(), filename);

  const processed = await sharp(input)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(fullPath, processed);
  return { path: `avatars/${filename}` };
}

export async function readAvatar(filename: string): Promise<Buffer | null> {
  const dir = avatarsDir();
  const target = path.resolve(dir, filename);
  // Verify the resolved path is contained within avatarsDir (prevents traversal incl. null bytes)
  if (!target.startsWith(path.resolve(dir) + path.sep)) {
    return null;
  }
  try {
    return await readFile(target);
  } catch {
    return null;
  }
}
