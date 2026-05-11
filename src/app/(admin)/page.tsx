import Link from "next/link";
import { listActiveRegulars } from "@/lib/db/queries/players";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const players = await listActiveRegulars();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-pitch-900">Today</h2>
        <p className="text-sm text-pitch-700">Welcome back.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Roster</p>
          <p className="mt-2 text-3xl font-bold text-pitch-900">{players.length}</p>
          <p className="mt-1 text-xs text-pitch-700">active regulars</p>
          <Link href="/roster" className="mt-3 inline-block text-sm font-medium text-pitch-600 hover:underline">
            Manage roster →
          </Link>
        </Card>

        <Card className="p-6">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Next match</p>
          <p className="mt-2 text-sm text-pitch-700">Match creation coming in Plan 2.</p>
        </Card>
      </div>
    </div>
  );
}
