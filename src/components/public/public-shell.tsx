import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-cream">
      <header className="border-b border-pitch-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/p" className="text-lg font-bold text-pitch-900">
            Balon
          </Link>
          <nav className="flex gap-4 text-sm font-medium text-pitch-900">
            <Link href="/p">Today</Link>
            <Link href="/p/stats">Leaderboard</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
