import { SidebarNav } from "./sidebar-nav";
import { BottomTabs } from "./bottom-tabs";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 pb-24 md:pb-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-pitch-900">Balon</h1>
            <p className="text-xs text-pitch-700">Admin</p>
          </div>
          <SidebarNav />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
