"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateMatch, getMatchById } from "@/lib/db/queries/matches";
import { setAppearancesForMatch } from "@/lib/db/queries/appearances";
import { setGoalsForMatch } from "@/lib/db/queries/goals";

const ResultSchema = z.object({
  ourScore: z.number().int().min(0).max(99),
  theirScore: z.number().int().min(0).max(99),
  attendance: z.array(z.string().uuid()),
  goals: z.array(
    z.object({
      scorerId: z.string().uuid(),
      assistId: z.string().uuid().nullable(),
    }),
  ),
});

type FormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function saveResultAction(
  matchId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const goalsRaw = String(fd.get("goalsJson") ?? "[]");
  let goalsParsed: Array<{ scorerId: string; assistId: string | null }> = [];
  try {
    goalsParsed = JSON.parse(goalsRaw);
  } catch {
    return { error: "Goals JSON malformed. Refresh and try again." };
  }

  const raw = {
    ourScore: Number(fd.get("ourScore") ?? 0),
    theirScore: Number(fd.get("theirScore") ?? 0),
    attendance: fd.getAll("attendance").map((v) => String(v)),
    goals: goalsParsed,
  };

  const parsed = ResultSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const match = await getMatchById(matchId);
  if (!match) return { error: "Match not found" };

  const attendSet = new Set(parsed.data.attendance);
  for (const g of parsed.data.goals) {
    if (!attendSet.has(g.scorerId)) {
      return { error: "A goalscorer wasn't in the attendance list." };
    }
    if (g.assistId && !attendSet.has(g.assistId)) {
      return { error: "An assister wasn't in the attendance list." };
    }
  }

  await updateMatch(matchId, {
    ourScore: parsed.data.ourScore,
    theirScore: parsed.data.theirScore,
    status: "played",
  });
  await setAppearancesForMatch(matchId, parsed.data.attendance);
  await setGoalsForMatch(matchId, parsed.data.goals);

  revalidatePath(`/matches/${matchId}/lineup`);
  revalidatePath(`/matches/${matchId}/result`);
  revalidatePath("/matches");
  revalidatePath("/");
  revalidatePath("/p");
  revalidatePath("/p/stats");
  revalidatePath(`/p/match/${match.shortSlug}`);

  redirect("/matches");
}

export async function clearResultAction(matchId: string): Promise<void> {
  const match = await getMatchById(matchId);
  if (!match) return;
  await updateMatch(matchId, {
    ourScore: null,
    theirScore: null,
    status: "planned",
  });
  await setAppearancesForMatch(matchId, []);
  await setGoalsForMatch(matchId, []);

  revalidatePath(`/matches/${matchId}/lineup`);
  revalidatePath(`/matches/${matchId}/result`);
  revalidatePath("/matches");
  revalidatePath("/p");
  revalidatePath("/p/stats");
  revalidatePath(`/p/match/${match.shortSlug}`);
}
