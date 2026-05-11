"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Today" },
  { href: "/matches", label: "Matches" },
  { href: "/roster", label: "Roster" },
  { href: "/settings", label: "Settings" },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-pitch-100 bg-white md:hidden">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center justify-center py-3 text-xs font-medium ${
              active ? "text-pitch-600" : "text-pitch-900"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
