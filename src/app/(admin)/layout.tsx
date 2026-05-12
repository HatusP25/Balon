import { AdminShell } from "@/components/admin/admin-shell";

// Admin pages are auth-gated and DB-backed; never prerender at build time
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
