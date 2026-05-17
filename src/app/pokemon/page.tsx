"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UNIQUE_ROSTER } from "@/data/roster";
import { searchSort } from "@/lib/jpsearch";
import { officialArtwork } from "@/lib/sprite";

export default function PokemonListPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => searchSort(UNIQUE_ROSTER, query), [query]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold heading-glow inline-block">ポケモン一覧</h1>
      <input
        type="text"
        placeholder="ポケモン名で検索 (例: め, リザ, charizard)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      />
      <div className="text-xs text-neutral-500">{filtered.length} / {UNIQUE_ROSTER.length} 体</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((e) => {
          const sprite = officialArtwork(e.dex);
          return (
            <Link key={e.slug} href={`/pokemon/${e.slug}`} className="card card-hover p-2 flex items-center gap-2">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden">
                {sprite ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sprite} alt="" loading="lazy" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl">？</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.ja}</div>
                <div className="text-[10px] text-neutral-500 truncate">{e.slug}</div>
                {e.dex && <div className="text-[10px] text-neutral-400">#{e.dex}</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
