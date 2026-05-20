import { ImageResponse } from "next/og";
import { getMatchBySlug } from "@/lib/db/queries/matches";
import { listSlotsForMatch } from "@/lib/db/queries/lineup-slots";
import { listAllAssignable } from "@/lib/db/queries/players";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1080;
const HEIGHT = 1350;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const match = await getMatchBySlug(slug);
  if (!match) {
    return new Response("not found", { status: 404 });
  }

  const [slots, players] = await Promise.all([
    listSlotsForMatch(match.id),
    listAllAssignable(),
  ]);
  const playerById = new Map(players.map((p) => [p.id, p]));

  const fmtDate = new Date(match.playedAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #0d6b4f 0%, #0a5a42 100%)",
          display: "flex",
          flexDirection: "column",
          padding: 56,
          fontFamily: "system-ui, sans-serif",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.7,
              display: "flex",
            }}
          >
            {match.status === "played" ? "Match recap" : "Lineup"}
          </div>
          <div style={{ marginTop: 8, fontSize: 64, fontWeight: 800, display: "flex" }}>
            {match.opponentName ? `vs ${match.opponentName}` : "Friendly match"}
          </div>
          <div style={{ marginTop: 4, fontSize: 28, opacity: 0.8, display: "flex" }}>
            {fmtDate} · Formation {match.formation}
          </div>
          {match.status === "played" && match.ourScore !== null && match.theirScore !== null && (
            <div
              style={{
                marginTop: 18,
                fontSize: 96,
                fontWeight: 900,
                letterSpacing: -2,
                display: "flex",
              }}
            >
              {match.ourScore} – {match.theirScore}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            position: "relative",
            flex: 1,
            margin: "32px 0 12px 0",
            border: "4px solid rgba(255,255,255,0.35)",
            borderRadius: 24,
            background:
              "repeating-linear-gradient(0deg, transparent 0, transparent 32px, rgba(255,255,255,0.06) 32px, rgba(255,255,255,0.06) 64px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              height: 2,
              background: "rgba(255,255,255,0.35)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 140,
              height: 140,
              borderRadius: 9999,
              border: "4px solid rgba(255,255,255,0.35)",
              transform: "translate(-50%, -50%)",
              display: "flex",
            }}
          />
          {slots.map((s) => {
            const player = s.playerId ? playerById.get(s.playerId) ?? null : null;
            const badge = player?.jerseyNumber ?? player?.nickname[0]?.toUpperCase() ?? "?";
            return (
              <div
                key={s.id}
                style={{
                  position: "absolute",
                  left: `${Number(s.x)}%`,
                  top: `${Number(s.y)}%`,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 9999,
                    background: "white",
                    color: "#0d6b4f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 36,
                    border: "4px solid white",
                  }}
                >
                  {String(badge)}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 22,
                    fontWeight: 700,
                    textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                    display: "flex",
                  }}
                >
                  {player?.nickname ?? ""}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            opacity: 0.8,
          }}
        >
          <span style={{ display: "flex" }}>balon</span>
          <span style={{ display: "flex" }}>{match.shortSlug}</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
