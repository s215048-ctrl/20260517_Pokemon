"use client";

import { useEffect, useMemo, useState } from "react";
import { getMove, Move, moveJaName, Pokemon } from "@/lib/pokeapi";
import { TypeBadge } from "./TypeBadge";
import { MoveInput } from "@/lib/damage";
import { PokeType } from "@/data/types";

interface Props {
  pokemon: Pokemon | null;
  value: string | null;
  onChange: (slug: string) => void;
  onLoaded: (m: MoveInput | null) => void;
}

const CATEGORY_JA: Record<string, string> = {
  physical: "物理",
  special: "特殊",
  status: "変化",
};

export function MoveSelector({ pokemon, value, onChange, onLoaded }: Props) {
  const [query, setQuery] = useState("");
  const [move, setMove] = useState<Move | null>(null);

  const choices = useMemo(() => {
    if (!pokemon) return [];
    return pokemon.moves
      .map((m) => m.move.name)
      .filter((name, idx, arr) => arr.indexOf(name) === idx)
      .sort();
  }, [pokemon]);

  const filteredChoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return choices;
    return choices.filter((n) => n.includes(q));
  }, [choices, query]);

  useEffect(() => {
    let cancelled = false;
    setMove(null);
    onLoaded(null);
    if (!value) return;
    (async () => {
      try {
        const m = await getMove(value);
        if (cancelled) return;
        setMove(m);
        onLoaded({
          name: m.name,
          ja: moveJaName(m),
          type: m.type.name as PokeType,
          category: m.damage_class.name as "physical" | "special" | "status",
          power: m.power ?? 0,
          accuracy: m.accuracy,
        });
      } catch {
        if (!cancelled) onLoaded(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!pokemon) {
    return <div className="text-sm text-neutral-500">先に攻撃側ポケモンを選択してください</div>;
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="技名で絞り込み (英語slug)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-1 text-sm border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
      />
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
        size={6}
      >
        <option value="">技を選択…</option>
        {filteredChoices.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      {move && (
        <div className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-sm space-y-1">
          <div className="font-bold">{moveJaName(move)} ({move.name})</div>
          <div className="flex gap-2 items-center">
            <TypeBadge type={move.type.name as PokeType} />
            <span>分類: {CATEGORY_JA[move.damage_class.name] ?? move.damage_class.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>威力: <span className="font-bold">{move.power ?? "—"}</span></div>
            <div>命中: <span className="font-bold">{move.accuracy ?? "—"}</span></div>
            <div>PP: <span className="font-bold">{move.pp ?? "—"}</span></div>
            <div>優先度: <span className="font-bold">{move.priority}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
