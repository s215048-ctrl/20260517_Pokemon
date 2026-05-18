"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UNIQUE_ROSTER, findRosterEntry } from "@/data/roster";
import { searchSort } from "@/lib/jpsearch";
import { officialArtwork } from "@/lib/sprite";

interface Props {
  value: string | null;
  onChange: (slug: string) => void;
  excludeSlugs?: string[];
  placeholder?: string;
  className?: string;
}

const MAX_SUGGESTIONS = 40;

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
  const inputRef = useRef<HTMLInputElement>(null);

  const exclude = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);
  const selected = value ? findRosterEntry(value) ?? null : null;

  const suggestions = useMemo(() => {
    const pool = UNIQUE_ROSTER.filter((e) => !exclude.has(e.slug));
    return searchSort(pool, query).slice(0, MAX_SUGGESTIONS);
  }, [query, exclude]);

  // Clamp highlight when suggestions change
  useEffect(() => {
    setHighlight((h) => Math.max(0, Math.min(h, suggestions.length - 1)));
  }, [suggestions]);

  // Close on outside pointer (works for touch + mouse)
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  function commit(slug: string) {
    onChange(slug);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
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
      inputRef.current?.blur();
    }
  }

  const selectedSprite = selected ? officialArtwork(selected.dex) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Selected chip above the input — clear, mobile-friendly */}
      {selected && (
        <div className="mb-1 flex items-center gap-2 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm">
          {selectedSprite && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedSprite} alt="" loading="lazy" className="w-8 h-8 object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{selected.ja}</div>
            <div className="text-[10px] text-neutral-500 truncate">{selected.slug}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(false);
            }}
            className="px-2 py-1 text-xs rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
            aria-label="クリア"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="search"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={query}
        placeholder={selected ? "別のポケモンに変更…" : placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={onKey}
        className="w-full p-2.5 text-base border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
        style={{ fontSize: "16px" }}
      />

      {open && (
        <ul
          className="absolute z-40 left-0 right-0 mt-1 max-h-[min(60vh,420px)] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl"
          role="listbox"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-3 text-sm text-neutral-500">該当なし</li>
          ) : (
            suggestions.map((e, i) => {
              const sp = officialArtwork(e.dex);
              return (
                <li
                  key={e.slug}
                  role="option"
                  aria-selected={i === highlight}
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    commit(e.slug);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-3 active:bg-rose-100 dark:active:bg-rose-900 ${
                    i === highlight ? "bg-rose-50 dark:bg-rose-950" : ""
                  }`}
                  style={{ minHeight: 44 }}
                >
                  {sp ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sp} alt="" loading="lazy" className="w-9 h-9 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.ja}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{e.slug}</div>
                  </div>
                  {e.dex && (
                    <span className="text-[11px] text-neutral-400 ml-auto whitespace-nowrap">#{e.dex}</span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
