import { notFound } from "next/navigation";
import { getMatchBySlug } from "@/lib/db/queries/matches";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable } from "@/lib/db/queries/players";
import { PublicPitch } from "@/components/public/public-pitch";

// Public match pages are DB-backed; render on-demand, not at build time
export const dynamic = "force-dynamic";

export default async function PublicMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) notFound();

  const [slots, players] = await Promise.all([
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);

  const fmtDate = new Date(match.playedAt).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="space-y-4">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-pitch-700">
          {match.status === "planned" ? "Upcoming match" : "Match"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-pitch-900">
          {match.opponentName ? `vs ${match.opponentName}` : "Friendly match"}
        </h1>
        <p className="mt-1 text-sm text-pitch-700">
          {fmtDate} · Formation {match.formation}
        </p>
      </header>

      <PublicPitch slots={slots} players={players} />

      {match.status === "played" && match.ourScore !== null && match.theirScore !== null && (
        <div className="rounded-xl border border-pitch-100 bg-white p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Final score</p>
          <p className="mt-1 text-3xl font-bold text-pitch-900">
            {match.ourScore} – {match.theirScore}
          </p>
        </div>
      )}
    </article>
  );
}
