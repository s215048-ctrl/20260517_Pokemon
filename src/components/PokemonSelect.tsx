"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UNIQUE_ROSTER, findRosterEntry } from "@/data/roster";
import { searchSort } from "@/lib/jpsearch";

interface Props {
  value: string | null;
  onChange: (slug: string) => void;
  excludeSlugs?: string[];
  placeholder?: string;
  className?: string;
}

const MAX_SUGGESTIONS = 30;

export function PokemonSelect({
  value,
  onChange,
  excludeSlugs = [],
  placeholder = "ポケモン名で検索 (例: め, リザ, charizard)",
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const exclude = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);
  const selected = value ? findRosterEntry(value) ?? null : null;

  const suggestions = useMemo(() => {
    const pool = UNIQUE_ROSTER.filter((e) => !exclude.has(e.slug));
    const list = searchSort(pool, query);
    return list.slice(0, MAX_SUGGESTIONS);
  }, [query, exclude]);

  // Clamp highlight when suggestions change
  useEffect(() => {
    setHighlight((h) => Math.max(0, Math.min(h, suggestions.length - 1)));
  }, [suggestions]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function commit(slug: string) {
    onChange(slug);
    setQuery("");
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      const item = suggestions[highlight];
      if (item) {
        e.preventDefault();
        commit(item.slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const displayValue = open ? query : selected ? `${selected.ja} (${selected.slug})` : query;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={onKey}
        className="w-full p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      />
      {selected && !open && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onChange("");
            setQuery("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs"
          aria-label="クリア"
        >
          ✕
        </button>
      )}

      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg"
          role="listbox"
        >
          {suggestions.map((e, i) => (
            <li
              key={e.slug}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(ev) => {
                ev.preventDefault();
                commit(e.slug);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-1.5 cursor-pointer text-sm flex items-baseline gap-2 ${
                i === highlight ? "bg-red-50 dark:bg-red-900" : ""
              }`}
            >
              <span className="font-medium">{e.ja}</span>
              <span className="text-xs text-neutral-500">{e.slug}</span>
              {e.dex && <span className="text-xs text-neutral-400 ml-auto">#{e.dex}</span>}
            </li>
          ))}
        </ul>
      )}
      {open && suggestions.length === 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg px-3 py-2 text-sm text-neutral-500">
          該当なし
        </div>
      )}
    </div>
  );
}
