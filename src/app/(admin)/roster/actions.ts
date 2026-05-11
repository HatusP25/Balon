"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createPlayer, updatePlayer, archivePlayer } from "@/lib/db/queries/players";
import { saveAvatar } from "@/lib/storage/avatars";

const PlayerSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(40),
  jerseyNumber: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 999), {
      message: "Must be 0–999",
    }),
  preferredPosition: z.enum(["FW", "MF", "DF", "GK", ""]).transform((v) => (v === "" ? null : v)),
  avatarDataUrl: z.string().optional(),
});

type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

async function dataUrlToBuffer(dataUrl: string | undefined): Promise<Buffer | null> {
  if (!dataUrl) return null;
  const match = /^data:image\/[^;]+;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

export async function createPlayerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = {
    nickname: String(fd.get("nickname") ?? ""),
    jerseyNumber: String(fd.get("jerseyNumber") ?? ""),
    preferredPosition: String(fd.get("preferredPosition") ?? "") as "FW" | "MF" | "DF" | "GK" | "",
    avatarDataUrl: String(fd.get("avatarDataUrl") ?? ""),
  };
  const parsed = PlayerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    const player = await createPlayer({
      nickname: parsed.data.nickname,
      jerseyNumber: parsed.data.jerseyNumber,
      preferredPosition: parsed.data.preferredPosition,
    });

    const buf = await dataUrlToBuffer(parsed.data.avatarDataUrl);
    if (buf) {
      const { path } = await saveAvatar(player.id, buf);
      await updatePlayer(player.id, { avatarPath: path });
    }
  } catch (err) {
    const code =
      (err as { code?: string; cause?: { code?: string } }).code ??
      (err as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") {
      return { fieldErrors: { nickname: "That nickname is already taken" } };
    }
    return { error: "Could not save player. Try again." };
  }

  revalidatePath("/roster");
  redirect("/roster");
}

export async function updatePlayerAction(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const raw = {
    nickname: String(fd.get("nickname") ?? ""),
    jerseyNumber: String(fd.get("jerseyNumber") ?? ""),
    preferredPosition: String(fd.get("preferredPosition") ?? "") as "FW" | "MF" | "DF" | "GK" | "",
    avatarDataUrl: String(fd.get("avatarDataUrl") ?? ""),
  };
  const parsed = PlayerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    await updatePlayer(id, {
      nickname: parsed.data.nickname,
      jerseyNumber: parsed.data.jerseyNumber,
      preferredPosition: parsed.data.preferredPosition,
    });

    const buf = await dataUrlToBuffer(parsed.data.avatarDataUrl);
    if (buf) {
      const { path } = await saveAvatar(id, buf);
      await updatePlayer(id, { avatarPath: path });
    }
  } catch (err) {
    const code =
      (err as { code?: string; cause?: { code?: string } }).code ??
      (err as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") {
      return { fieldErrors: { nickname: "That nickname is already taken" } };
    }
    return { error: "Could not update player. Try again." };
  }

  revalidatePath("/roster");
  redirect("/roster");
}

export async function archivePlayerAction(id: string): Promise<void> {
  await archivePlayer(id);
  revalidatePath("/roster");
  redirect("/roster");
}
