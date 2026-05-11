"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today" },
  { href: "/matches", label: "Matches" },
  { href: "/roster", label: "Roster" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active ? "bg-pitch-600 text-white" : "text-pitch-900 hover:bg-pitch-100"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
      <form action="/logout" method="post" className="mt-6">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-pitch-900 hover:bg-pitch-100"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
