"use client";

import { useMemo, useState } from "react";
import { UNIQUE_ROSTER, RosterEntry } from "@/data/roster";

interface Props {
  value: string | null;
  onChange: (slug: string) => void;
  excludeSlugs?: string[];
  placeholder?: string;
  className?: string;
}

export function PokemonSelect({ value, onChange, excludeSlugs = [], placeholder = "ポケモンを選択…", className = "" }: Props) {
  const [query, setQuery] = useState("");
  const exclude = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIQUE_ROSTER.filter((e) => {
      if (exclude.has(e.slug)) return false;
      if (!q) return true;
      return e.slug.toLowerCase().includes(q) || e.ja.includes(query);
    }).slice(0, 200);
  }, [query, exclude]);

  const selected = UNIQUE_ROSTER.find((e) => e.slug === value);

  return (
    <div className={className}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      >
        <option value="">{placeholder}</option>
        {filtered.map((e: RosterEntry) => (
          <option key={e.slug} value={e.slug}>
            {e.ja} ({e.slug})
          </option>
        ))}
      </select>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ポケモン名で絞り込み (ja or slug)"
        className="w-full mt-1 p-1 text-xs border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      />
      {selected && (
        <div className="text-xs text-neutral-500 mt-1">選択中: {selected.ja}</div>
      )}
    </div>
  );
}
