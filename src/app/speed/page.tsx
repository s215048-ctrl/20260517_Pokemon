"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonSelect } from "@/components/PokemonSelect";
import { TypeBadge } from "@/components/TypeBadge";
import { findRosterEntry } from "@/data/roster";
import { NATURES, natureById } from "@/data/natures";
import { calcStat } from "@/lib/stats";
import { getPokemon, getSpecies, jaName, pickStat, Pokemon, Species } from "@/lib/pokeapi";

interface Slot {
  slug: string | null;
  ev: number;
  iv: number;
  natureId: string;
  stage: number;
  scarf: boolean;
  paralyzed: boolean;
  tailwind: boolean;
}

function newSlot(): Slot {
  return { slug: null, ev: 252, iv: 31, natureId: "timid", stage: 0, scarf: false, paralyzed: false, tailwind: false };
}

interface LoadedData {
  pokemon: Pokemon;
  species: Species;
  baseSpe: number;
  displayName: string;
}

export default function SpeedComparePage() {
  const [level, setLevel] = useState(50);
  const [slots, setSlots] = useState<Slot[]>([newSlot(), newSlot()]);
  const [data, setData] = useState<Record<string, LoadedData>>({});

  // Load missing Pokemon when slugs change
  useEffect(() => {
    const need = slots
      .map((s) => s.slug)
      .filter((s): s is string => !!s && !(s in data));
    if (need.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates: Record<string, LoadedData> = {};
      await Promise.all(
        need.map(async (slug) => {
          try {
            const p = await getPokemon(slug);
            const sp = await getSpecies(p.species.url);
            const entry = findRosterEntry(slug);
            updates[slug] = {
              pokemon: p,
              species: sp,
              baseSpe: pickStat(p, "speed"),
              displayName: jaName(sp, entry?.ja ?? p.name),
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
  }, [slots, data]);

  function update(i: number, patch: Partial<Slot>) {
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    setSlots((s) => [...s, newSlot()]);
  }

  function removeSlot(i: number) {
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }

  const computed = useMemo(() => {
    return slots.map((slot) => {
      if (!slot.slug || !data[slot.slug]) return null;
      const d = data[slot.slug];
      const nature = natureById(slot.natureId);
      const base = calcStat(d.baseSpe, slot.iv, slot.ev, level, nature, "spe");
      // Stage modifier
      const stageMul = [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 1, 3 / 2, 2, 5 / 2, 3, 7 / 2, 4];
      let final = Math.floor(base * stageMul[Math.max(-6, Math.min(6, slot.stage)) + 6]);
      const notes: string[] = [];
      if (slot.scarf) {
        final = Math.floor(final * 1.5);
        notes.push("こだわりスカーフ ×1.5");
      }
      if (slot.tailwind) {
        final = final * 2;
        notes.push("おいかぜ ×2");
      }
      if (slot.paralyzed) {
        final = Math.floor(final * 0.5);
        notes.push("まひ ×0.5");
      }
      return { ...d, slot, base, final, notes };
    });
  }, [slots, data, level]);

  const sorted = computed
    .map((c, i) => ({ c, i }))
    .filter((x) => x.c !== null)
    .sort((a, b) => (b.c!.final - a.c!.final));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">素早さ比較</h1>
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-4">
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
        <button
          onClick={addSlot}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          + ポケモン追加
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {slots.map((slot, i) => {
          const c = computed[i];
          return (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">#{i + 1}</span>
                {slots.length > 1 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    削除
                  </button>
                )}
              </div>
              <PokemonSelect
                value={slot.slug}
                onChange={(slug) => update(i, { slug })}
              />
              {c && (
                <>
                  <div className="flex gap-2 items-center">
                    {c.pokemon.types.map((t) => (
                      <TypeBadge key={t.type.name} type={t.type.name} />
                    ))}
                    <span className="text-xs text-neutral-500">種族値 {c.baseSpe}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex flex-col">
                      性格
                      <select
                        value={slot.natureId}
                        onChange={(e) => update(i, { natureId: e.target.value })}
                        className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      >
                        {NATURES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.ja} {n.up && n.down ? `(+${n.up}/-${n.down})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col">
                      努力値
                      <input
                        type="number"
                        min={0}
                        max={252}
                        step={4}
                        value={slot.ev}
                        onChange={(e) => update(i, { ev: Math.max(0, Math.min(252, parseInt(e.target.value) || 0)) })}
                        className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      />
                    </label>
                    <label className="flex flex-col">
                      個体値
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={slot.iv}
                        onChange={(e) => update(i, { iv: Math.max(0, Math.min(31, parseInt(e.target.value) || 0)) })}
                        className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      />
                    </label>
                    <label className="flex flex-col">
                      ランク
                      <select
                        value={slot.stage}
                        onChange={(e) => update(i, { stage: parseInt(e.target.value) })}
                        className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      >
                        {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((s) => (
                          <option key={s} value={s}>
                            {s >= 0 ? `+${s}` : s}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={slot.scarf}
                        onChange={(e) => update(i, { scarf: e.target.checked })}
                      />
                      スカーフ
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={slot.tailwind}
                        onChange={(e) => update(i, { tailwind: e.target.checked })}
                      />
                      追い風
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={slot.paralyzed}
                        onChange={(e) => update(i, { paralyzed: e.target.checked })}
                      />
                      まひ
                    </label>
                  </div>
                  <div className="text-2xl font-bold text-right">
                    {c.final}
                    <span className="text-xs text-neutral-500 font-normal ml-1">(素 {c.base})</span>
                  </div>
                  {c.notes.length > 0 && (
                    <div className="text-xs text-neutral-500">{c.notes.join(" / ")}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-bold mb-2">ランキング (実数値 降順)</h2>
        {sorted.length === 0 ? (
          <div className="text-sm text-neutral-500">ポケモンを選択してください</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="text-left">順位</th>
                <th className="text-left">ポケモン</th>
                <th className="text-right">実数値</th>
                <th className="text-left pl-3">補正</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((x, rank) => (
                <tr key={x.i} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td>{rank + 1}</td>
                  <td>{x.c!.displayName}</td>
                  <td className="text-right font-mono font-bold">{x.c!.final}</td>
                  <td className="pl-3 text-xs text-neutral-500">{x.c!.notes.join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
