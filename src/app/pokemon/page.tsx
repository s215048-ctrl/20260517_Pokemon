"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UNIQUE_ROSTER } from "@/data/roster";

export default function PokemonListPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return UNIQUE_ROSTER;
    return UNIQUE_ROSTER.filter((e) => e.slug.toLowerCase().includes(q) || e.ja.includes(query));
  }, [query]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ポケモン一覧</h1>
      <input
        type="text"
        placeholder="ポケモン名で検索 (例: リザードン, charizard)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      />
      <div className="text-xs text-neutral-500">{filtered.length} / {UNIQUE_ROSTER.length} 体</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {filtered.map((e) => (
          <Link
            key={e.slug}
            href={`/pokemon/${e.slug}`}
            className="block p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded hover:border-red-400 transition"
          >
            <div className="text-sm font-medium">{e.ja}</div>
            <div className="text-xs text-neutral-500">{e.slug}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
