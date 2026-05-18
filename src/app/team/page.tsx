"use client";

import { useEffect, useState } from "react";
import { PokemonSelect } from "@/components/PokemonSelect";
import { TypeBadge } from "@/components/TypeBadge";
import { POKE_TYPES, PokeType, TYPE_JA, TYPE_CHART } from "@/data/types";
import { getPokemon, getSpecies, pokemonDisplayName, Pokemon, Species } from "@/lib/pokeapi";
import { findRosterEntry } from "@/data/roster";
import { officialArtwork } from "@/lib/sprite";

interface SlotData {
  slug: string;
  displayName: string;
  types: PokeType[];
  sprite: string | null;
}

const TEAM_SIZE = 6;

export default function TeamPage() {
  const [slugs, setSlugs] = useState<(string | null)[]>(Array(TEAM_SIZE).fill(null));
  const [data, setData] = useState<Record<string, SlotData>>({});

  useEffect(() => {
    let cancelled = false;
    const need = slugs.filter((s): s is string => !!s && !(s in data));
    if (need.length === 0) return;
    (async () => {
      const updates: Record<string, SlotData> = {};
      await Promise.all(
        need.map(async (slug) => {
          try {
            const p: Pokemon = await getPokemon(slug);
            let species: Species | null = null;
            try {
              species = await getSpecies(p.species.url);
            } catch {}
            const entry = findRosterEntry(slug);
            updates[slug] = {
              slug,
              displayName: pokemonDisplayName(slug, species, entry?.ja ?? p.name),
              types: p.types.map((t) => t.type.name as PokeType),
              sprite: officialArtwork(entry?.dex),
            };
          } catch {
            // ignore
          }
        }),
      );
      if (cancelled) return;
      setData((d) => ({ ...d, ...updates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [slugs, data]);

  function setSlot(i: number, slug: string) {
    setSlugs((s) => s.map((v, idx) => (idx === i ? (slug || null) : v)));
  }

  const loadedSlots: { i: number; d: SlotData }[] = slugs
    .map((s, i) => (s && data[s] ? { i, d: data[s] } : null))
    .filter((x): x is { i: number; d: SlotData } => x !== null);

  // Compute defensive multiplier per attacking type per team member
  function effectiveness(atk: PokeType, def: PokeType[]): number {
    return def.reduce((acc, t) => acc * (TYPE_CHART[atk]?.[t] ?? 1), 1);
  }

  // Team-wide aggregates per attacking type
  const summary = POKE_TYPES.map((atk) => {
    let weak = 0, neutral = 0, resist = 0, immune = 0, maxEff = 0;
    loadedSlots.forEach(({ d }) => {
      const e = effectiveness(atk, d.types);
      if (e === 0) immune++;
      else if (e < 1) resist++;
      else if (e === 1) neutral++;
      else weak++;
      if (e > maxEff) maxEff = e;
    });
    return { atk, weak, neutral, resist, immune, maxEff };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold heading-glow inline-block">チームタイプ相性分析</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        最大6匹のポケモンを選んで、チーム全体のタイプ耐性をヒートマップで可視化します。
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {slugs.map((slug, i) => {
          const slot = slug && data[slug];
          return (
            <div key={i} className="card p-3 space-y-2">
              <div className="text-xs text-neutral-500">#{i + 1}</div>
              <PokemonSelect value={slug} onChange={(s) => setSlot(i, s)} />
              {slot && (
                <div className="flex items-center gap-2">
                  {slot.sprite && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slot.sprite} alt="" className="w-12 h-12 object-contain" loading="lazy" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{slot.displayName}</div>
                    <div className="flex gap-1 mt-1">
                      {slot.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loadedSlots.length > 0 && (
        <>
          <div className="card p-4 overflow-x-auto">
            <h2 className="font-bold mb-2">防御相性ヒートマップ (受ける側)</h2>
            <p className="text-xs text-neutral-500 mb-3">
              各セル = 横軸タイプの技を縦軸ポケモンが受けた時の倍率
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 sticky left-0 bg-neutral-50 dark:bg-neutral-900">ポケモン</th>
                  {POKE_TYPES.map((t) => (
                    <th key={t} className="p-1">
                      <TypeBadge type={t} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadedSlots.map(({ d }) => (
                  <tr key={d.slug} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="p-1 sticky left-0 bg-white dark:bg-neutral-900 whitespace-nowrap">
                      {d.displayName}
                    </td>
                    {POKE_TYPES.map((atk) => {
                      const e = effectiveness(atk, d.types);
                      return <EffectivenessCell key={atk} value={e} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-4 overflow-x-auto">
            <h2 className="font-bold mb-2">チーム集計 (各タイプの技に対して)</h2>
            <p className="text-xs text-neutral-500 mb-3">
              チーム全体での弱点/耐性数。同じタイプ技に複数体が弱点だと致命的。
            </p>
            <table className="w-full text-xs">
              <thead className="text-neutral-500">
                <tr>
                  <th className="text-left p-1">タイプ</th>
                  <th className="p-1">弱点数 (≥×2)</th>
                  <th className="p-1">普通</th>
                  <th className="p-1">耐性 (&lt;×1)</th>
                  <th className="p-1">無効</th>
                  <th className="p-1">最大倍率</th>
                </tr>
              </thead>
              <tbody>
                {[...summary].sort((a, b) => b.weak - a.weak || b.maxEff - a.maxEff).map((s) => {
                  const danger = s.weak >= 3 ? "bg-rose-100 dark:bg-rose-950" : s.weak === 2 ? "bg-amber-50 dark:bg-amber-950" : "";
                  return (
                    <tr key={s.atk} className={`border-t border-neutral-100 dark:border-neutral-800 ${danger}`}>
                      <td className="p-1"><TypeBadge type={s.atk} /></td>
                      <td className="p-1 text-center font-mono font-bold text-rose-600">{s.weak || ""}</td>
                      <td className="p-1 text-center font-mono text-neutral-500">{s.neutral || ""}</td>
                      <td className="p-1 text-center font-mono text-emerald-600">{s.resist || ""}</td>
                      <td className="p-1 text-center font-mono text-sky-600">{s.immune || ""}</td>
                      <td className="p-1 text-center font-mono">×{s.maxEff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function EffectivenessCell({ value }: { value: number }) {
  let cls = "";
  let text = "";
  if (value === 0) { cls = "bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100 font-bold"; text = "0"; }
  else if (value >= 4) { cls = "bg-rose-300 dark:bg-rose-800 text-rose-900 dark:text-rose-100 font-bold"; text = "4×"; }
  else if (value >= 2) { cls = "bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold"; text = "2×"; }
  else if (value === 1) { cls = "text-neutral-400"; text = "1"; }
  else if (value === 0.5) { cls = "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100"; text = "½"; }
  else if (value === 0.25) { cls = "bg-emerald-300 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold"; text = "¼"; }
  else { cls = "text-neutral-500"; text = String(value); }
  return <td className={`p-1 text-center ${cls}`}>{text}</td>;
}
