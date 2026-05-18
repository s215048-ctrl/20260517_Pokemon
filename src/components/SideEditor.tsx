"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonSelect } from "./PokemonSelect";
import { TypeBadge } from "./TypeBadge";
import { findRosterEntry } from "@/data/roster";
import { POKE_TYPES, PokeType, TYPE_JA } from "@/data/types";
import { NATURES, natureById, StatKey } from "@/data/natures";
import { calcStat } from "@/lib/stats";
import { getPokemon, getSpecies, pokemonDisplayName, pickStat, Pokemon, Species } from "@/lib/pokeapi";
import { SideInput } from "@/lib/damage";
import { abilityJa, itemJa } from "@/data/locale";

export interface SideState {
  slug: string | null;
  level: number;
  evs: Record<StatKey, number>;
  ivs: Record<StatKey, number>;
  natureId: string;
  abilityIdx: number; // index into pokemon.abilities
  abilityOverride: string;
  item: string;
  stages: { atk: number; def: number; spa: number; spd: number; spe: number };
  isTera: boolean;
  teraType: PokeType;
}

export function newSideState(natureId = "adamant"): SideState {
  return {
    slug: null,
    level: 50,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    natureId,
    abilityIdx: 0,
    abilityOverride: "",
    item: "",
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    isTera: false,
    teraType: "normal",
  };
}

interface Props {
  label: string;
  state: SideState;
  onChange: (s: SideState) => void;
  onLoaded: (data: { pokemon: Pokemon; species: Species; sideInput: SideInput } | null) => void;
}

const ABILITY_PRESETS = [
  "", "blaze", "torrent", "overgrow", "swarm",
  "huge-power", "pure-power", "technician", "iron-fist", "tough-claws",
  "thick-fat", "fluffy", "multiscale", "filter", "solid-rock",
  "adaptability",
];

const ITEM_PRESETS = [
  "",
  "life-orb",
  "choice-band",
  "choice-specs",
  "choice-scarf",
  "expert-belt",
  "muscle-band",
  "wise-glasses",
  "leftovers",
  "focus-sash",
  "silver-powder",
  "soft-sand",
  "hard-stone",
  "spell-tag",
  "metal-coat",
  "charcoal",
  "mystic-water",
  "magnet",
  "miracle-seed",
  "never-melt-ice",
  "black-belt",
  "poison-barb",
  "sharp-beak",
  "twisted-spoon",
  "silk-scarf",
  "dragon-fang",
  "black-glasses",
];

export function SideEditor({ label, state, onChange, onLoaded }: Props) {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPokemon(null);
    setSpecies(null);
    onLoaded(null);
    if (!state.slug) return;
    (async () => {
      try {
        const p = await getPokemon(state.slug!);
        if (cancelled) return;
        setPokemon(p);
        const sp = await getSpecies(p.species.url);
        if (cancelled) return;
        setSpecies(sp);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.slug]);

  const stats = useMemo(() => {
    if (!pokemon) return null;
    const nature = natureById(state.natureId);
    const baseStats: Record<StatKey, number> = {
      hp: pickStat(pokemon, "hp"),
      atk: pickStat(pokemon, "attack"),
      def: pickStat(pokemon, "defense"),
      spa: pickStat(pokemon, "special-attack"),
      spd: pickStat(pokemon, "special-defense"),
      spe: pickStat(pokemon, "speed"),
    };
    const finals: Record<StatKey, number> = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    (Object.keys(baseStats) as StatKey[]).forEach((k) => {
      finals[k] = calcStat(baseStats[k], state.ivs[k], state.evs[k], state.level, nature, k);
    });
    return { baseStats, finals };
  }, [pokemon, state.natureId, state.ivs, state.evs, state.level]);

  // Notify parent of loaded data
  useEffect(() => {
    if (!pokemon || !species || !stats) {
      onLoaded(null);
      return;
    }
    const types = pokemon.types.map((t) => t.type.name as PokeType);
    let ability = state.abilityOverride;
    if (!ability) {
      ability = pokemon.abilities[state.abilityIdx]?.ability.name ?? "";
    }
    const sideInput: SideInput = {
      level: state.level,
      types,
      ability,
      item: state.item || undefined,
      stats: stats.finals,
      stages: state.stages,
      isTera: state.isTera,
      teraType: state.teraType,
    };
    onLoaded({ pokemon, species, sideInput });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemon, species, stats, state.abilityIdx, state.abilityOverride, state.item, state.stages, state.isTera, state.teraType]);

  const entry = state.slug ? findRosterEntry(state.slug) : null;
  const displayName = state.slug
    ? pokemonDisplayName(state.slug, species, entry?.ja ?? pokemon?.name ?? "")
    : entry?.ja ?? pokemon?.name ?? "";

  const totalEV = Object.values(state.evs).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
      <div className="font-bold">{label}</div>
      <PokemonSelect value={state.slug} onChange={(slug) => onChange({ ...state, slug })} />

      {pokemon && (
        <>
          <div className="flex gap-2 items-center text-sm">
            <span className="font-medium">{displayName}</span>
            {pokemon.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col">
              Lv
              <input
                type="number"
                min={1}
                max={100}
                value={state.level}
                onChange={(e) => onChange({ ...state, level: parseInt(e.target.value) || 50 })}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
              />
            </label>
            <label className="flex flex-col col-span-2">
              性格
              <select
                value={state.natureId}
                onChange={(e) => onChange({ ...state, natureId: e.target.value })}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
              >
                {NATURES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.ja} {n.up && n.down ? `(+${n.up}/-${n.down})` : "(無補正)"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-xs">
            <div className="font-medium mb-1">努力値 / 個体値 / 実数値 (合計EV: {totalEV}/510)</div>
            <table className="w-full">
              <thead className="text-neutral-500">
                <tr>
                  <th />
                  <th>EV</th>
                  <th>IV</th>
                  <th>ランク</th>
                  <th className="text-right">実数値</th>
                </tr>
              </thead>
              <tbody>
                {(["hp", "atk", "def", "spa", "spd", "spe"] as StatKey[]).map((k) => (
                  <tr key={k}>
                    <td className="text-neutral-500 pr-1">
                      {{ hp: "HP", atk: "攻撃", def: "防御", spa: "特攻", spd: "特防", spe: "素早さ" }[k]}
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={252}
                        step={4}
                        value={state.evs[k]}
                        onChange={(e) =>
                          onChange({
                            ...state,
                            evs: { ...state.evs, [k]: Math.max(0, Math.min(252, parseInt(e.target.value) || 0)) },
                          })
                        }
                        className="w-14 p-0.5 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={state.ivs[k]}
                        onChange={(e) =>
                          onChange({
                            ...state,
                            ivs: { ...state.ivs, [k]: Math.max(0, Math.min(31, parseInt(e.target.value) || 0)) },
                          })
                        }
                        className="w-12 p-0.5 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                      />
                    </td>
                    <td>
                      {k === "hp" ? (
                        <span className="text-neutral-400 text-xs">—</span>
                      ) : (
                        <select
                          value={(state.stages as any)[k]}
                          onChange={(e) =>
                            onChange({
                              ...state,
                              stages: { ...state.stages, [k]: parseInt(e.target.value) },
                            })
                          }
                          className="p-0.5 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700 text-xs"
                        >
                          {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((s) => (
                            <option key={s} value={s}>
                              {s >= 0 ? `+${s}` : s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="text-right font-mono font-bold">{stats?.finals[k] ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col">
              特性
              <select
                value={state.abilityOverride || `__idx${state.abilityIdx}`}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.startsWith("__idx")) {
                    onChange({ ...state, abilityIdx: parseInt(v.slice(5)), abilityOverride: "" });
                  } else {
                    onChange({ ...state, abilityOverride: v });
                  }
                }}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
              >
                {pokemon.abilities.map((a, idx) => (
                  <option key={idx} value={`__idx${idx}`}>
                    {abilityJa(a.ability.name)}
                    {a.is_hidden ? " (夢)" : ""}
                  </option>
                ))}
                <option disabled>──手動指定──</option>
                {ABILITY_PRESETS.map((a) => (
                  <option key={`o-${a}`} value={a}>
                    {a ? abilityJa(a) : "(なし)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              持ち物
              <select
                value={state.item}
                onChange={(e) => onChange({ ...state, item: e.target.value })}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
              >
                {ITEM_PRESETS.map((i) => (
                  <option key={i} value={i}>
                    {i ? itemJa(i) : "(なし)"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs items-end">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={state.isTera}
                onChange={(e) => onChange({ ...state, isTera: e.target.checked })}
              />
              テラスタル
            </label>
            <label className="flex flex-col">
              テラスタイプ
              <select
                disabled={!state.isTera}
                value={state.teraType}
                onChange={(e) => onChange({ ...state, teraType: e.target.value as PokeType })}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700 disabled:opacity-50"
              >
                {POKE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_JA[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
