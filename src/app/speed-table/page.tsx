"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UNIQUE_ROSTER } from "@/data/roster";
import { getPokemon, getSpecies, pokemonDisplayName, pickStat } from "@/lib/pokeapi";
import { junsokuSpeed, saisokuSpeed, unInvestedSpeed } from "@/lib/stats";
import { searchSort } from "@/lib/jpsearch";

interface Row {
  slug: string;
  ja: string;
  baseSpe: number;
  uninvest: number;
  junsoku: number;
  junsokuScarf: number;
  saisoku: number;
  saisokuScarf: number;
}

const CONCURRENCY = 8;

async function loadRow(slug: string, ja: string, level: number): Promise<Row | null> {
  try {
    const p = await getPokemon(slug);
    let displayName = ja;
    try {
      const sp = await getSpecies(p.species.url);
      displayName = pokemonDisplayName(slug, sp, ja);
    } catch {
      // ignore species fetch failure
    }
    const baseSpe = pickStat(p, "speed");
    const junsoku = junsokuSpeed(baseSpe, level);
    const saisoku = saisokuSpeed(baseSpe, level);
    return {
      slug,
      ja: displayName,
      baseSpe,
      uninvest: unInvestedSpeed(baseSpe, level),
      junsoku,
      junsokuScarf: Math.floor(junsoku * 1.5),
      saisoku,
      saisokuScarf: Math.floor(saisoku * 1.5),
    };
  } catch {
    return null;
  }
}

export default function SpeedTablePage() {
  const [level, setLevel] = useState(50);
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: UNIQUE_ROSTER.length });
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("baseSpe");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setProgress({ done: 0, total: UNIQUE_ROSTER.length });
    const queue = [...UNIQUE_ROSTER];
    let active = 0;
    const collected: Row[] = [];

    return runQueue();

    function runQueue() {
      let resolved = false;
      function pump() {
        while (active < CONCURRENCY && queue.length > 0) {
          const item = queue.shift()!;
          active++;
          loadRow(item.slug, item.ja, level).then((row) => {
            active--;
            if (cancelled) return;
            if (row) collected.push(row);
            setProgress((p) => ({ done: p.done + 1, total: p.total }));
            // Update rows in batches to avoid huge re-render cost
            if (collected.length % 10 === 0 || queue.length === 0) {
              setRows([...collected]);
            }
            if (queue.length === 0 && active === 0 && !resolved) {
              resolved = true;
              setRows([...collected]);
            }
            pump();
          });
        }
      }
      pump();
      return () => {
        cancelled = true;
      };
    }
  }, [level]);

  const filtered = useMemo(() => {
    let list: Row[] = rows;
    if (query.trim()) {
      list = searchSort(rows, query);
    }
    const dir = sortDir === "desc" ? -1 : 1;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, query, sortKey, sortDir]);

  function header(key: keyof Row, label: string, align: "left" | "right" = "right") {
    const active = sortKey === key;
    return (
      <th
        className={`p-1 cursor-pointer select-none ${align === "right" ? "text-right" : "text-left"}`}
        onClick={() => {
          if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          else {
            setSortKey(key);
            setSortDir("desc");
          }
        }}
      >
        {label}
        {active ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">素早さ一覧表</h1>
      <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-4">
        <label className="text-sm flex items-center gap-2">
          Lv:
          <input
            type="number"
            min={1}
            max={100}
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 50)}
            className="w-16 p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
          />
        </label>
        <input
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="検索 (例: め で メ始まりを抽出)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700 flex-1 min-w-[200px]"
          style={{ fontSize: "16px" }}
        />
        <span className="text-xs text-neutral-500">
          {progress.done < progress.total
            ? `読み込み中: ${progress.done} / ${progress.total}`
            : `完了: ${rows.length} 体`}
        </span>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 text-xs">
            <tr>
              {header("ja", "ポケモン", "left")}
              {header("baseSpe", "種族値")}
              {header("uninvest", "無振り")}
              {header("junsoku", "準速")}
              {header("saisoku", "最速")}
              {header("junsokuScarf", "準速スカーフ")}
              {header("saisokuScarf", "最速スカーフ")}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.slug} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="p-1">
                  <Link href={`/pokemon/${r.slug}`} className="hover:underline">
                    {r.ja}
                  </Link>
                  <span className="ml-1 text-xs text-neutral-500">{r.slug}</span>
                </td>
                <td className="p-1 text-right font-mono">{r.baseSpe}</td>
                <td className="p-1 text-right font-mono">{r.uninvest}</td>
                <td className="p-1 text-right font-mono">{r.junsoku}</td>
                <td className="p-1 text-right font-mono font-bold">{r.saisoku}</td>
                <td className="p-1 text-right font-mono text-orange-600">{r.junsokuScarf}</td>
                <td className="p-1 text-right font-mono text-red-600">{r.saisokuScarf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        準速 = 性格補正なし・努力値252・個体値31 ／ 最速 = +素早さ性格・努力値252・個体値31
      </p>
    </div>
  );
}
