"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/speed", label: "素早さ比較" },
  { href: "/speed-table", label: "素早さ表" },
  { href: "/damage", label: "ダメージ計算" },
  { href: "/move-table", label: "技別ダメ表" },
  { href: "/team", label: "チーム相性" },
  { href: "/tuning", label: "調整サポート" },
  { href: "/pokemon", label: "図鑑" },
];

export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              active
                ? "bg-white/20 text-white font-bold shadow-inner"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
