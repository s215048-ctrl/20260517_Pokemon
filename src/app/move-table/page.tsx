"use client";

import { useEffect, useMemo, useState } from "react";
import { SideEditor, SideState, newSideState } from "@/components/SideEditor";
import { TypeBadge } from "@/components/TypeBadge";
import { getMove, Move, moveJaName, Pokemon, Species } from "@/lib/pokeapi";
import { calculateDamage, DamageOptions, MoveInput, SideInput, Terrain, Weather } from "@/lib/damage";
import { moveJa } from "@/data/locale";
import { PokeType } from "@/data/types";

interface LoadedSide {
  pokemon: Pokemon;
  species: Species;
  sideInput: SideInput;
}

interface MoveRow {
  name: string;
  ja: string;
  type: PokeType;
  category: "physical" | "special" | "status";
  power: number;
  accuracy: number | null;
  priority: number;
  min: number;
  max: number;
  minPct: number;
  maxPct: number;
  koCount: number;
  rollsLen: number;
}

const CONCURRENCY = 6;
const CATEGORY_JA: Record<string, string> = {
  physical: "物理",
  special: "特殊",
  status: "変化",
};

export default function MoveTablePage() {
  const [attacker, setAttacker] = useState<SideState>(newSideState("adamant"));
  const [defender, setDefender] = useState<SideState>(newSideState("bold"));
  const [attackerLoaded, setAttackerLoaded] = useState<LoadedSide | null>(null);
  const [defenderLoaded, setDefenderLoaded] = useState<LoadedSide | null>(null);

  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [isCritical, setIsCritical] = useState(false);
  const [hideStatus, setHideStatus] = useState(true);
  const [defenderHpPercent, setDefenderHpPercent] = useState(100);

  const [moves, setMoves] = useState<Map<string, Move>>(new Map());
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Fetch all of the attacker's moves
  useEffect(() => {
    setMoves(new Map());
    setProgress({ done: 0, total: 0 });
    if (!attackerLoaded) return;
    const names = attackerLoaded.pokemon.moves
      .map((m) => m.move.name)
      .filter((n, i, arr) => arr.indexOf(n) === i);
    setProgress({ done: 0, total: names.length });
    let cancelled = false;
    const queue = [...names];
    let active = 0;
    const collected = new Map<string, Move>();

    function pump() {
      while (active < CONCURRENCY && queue.length > 0) {
        const name = queue.shift()!;
        active++;
        getMove(name).then((m) => {
          active--;
          if (cancelled) return;
          collected.set(name, m);
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
          if (collected.size % 20 === 0 || queue.length === 0) {
            setMoves(new Map(collected));
          }
          pump();
        }).catch(() => {
          active--;
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
          pump();
        });
      }
    }
    pump();
    return () => {
      cancelled = true;
    };
  }, [attackerLoaded]);

  const rows = useMemo<MoveRow[]>(() => {
    if (!attackerLoaded || !defenderLoaded) return [];
    const opts: DamageOptions = { weather, terrain, isCritical };
    const out: MoveRow[] = [];
    moves.forEach((m, name) => {
      const cat = m.damage_class.name as "physical" | "special" | "status";
      if (hideStatus && (cat === "status" || (m.power ?? 0) === 0)) return;
      const moveInput: MoveInput = {
        name: m.name,
        ja: moveJa(m.name) || moveJaName(m),
        type: m.type.name as PokeType,
        category: cat,
        power: m.power ?? 0,
        accuracy: m.accuracy,
      };
      const res = calculateDamage(attackerLoaded.sideInput, defenderLoaded.sideInput, moveInput, opts);
      const currentHp = Math.max(1, Math.round(defenderLoaded.sideInput.stats.hp * (defenderHpPercent / 100)));
      const koCount = res.rolls.filter((r) => r >= currentHp).length;
      out.push({
        name: m.name,
        ja: moveJa(m.name) || moveJaName(m),
        type: m.type.name as PokeType,
        category: cat,
        power: m.power ?? 0,
        accuracy: m.accuracy,
        priority: m.priority,
        min: res.min,
        max: res.max,
        minPct: res.minPct,
        maxPct: res.maxPct,
        koCount,
        rollsLen: res.rolls.length,
      });
    });
    out.sort((a, b) => b.max - a.max);
    return out;
  }, [moves, attackerLoaded, defenderLoaded, weather, terrain, isCritical, hideStatus, defenderHpPercent]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold heading-glow inline-block">技別ダメージ一覧表</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        攻撃側ポケモンが覚える全攻撃技を、防御側1匹に対して一括ダメージ計算。
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <SideEditor
          label="攻撃側"
          state={attacker}
          onChange={setAttacker}
          onLoaded={setAttackerLoaded}
        />
        <SideEditor
          label="防御側"
          state={defender}
          onChange={setDefender}
          onLoaded={setDefenderLoaded}
        />
      </div>

      <div className="card p-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        <label className="flex flex-col">
          天候
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value as Weather)}
            className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
          >
            <option value="none">なし</option>
            <option value="sun">晴れ</option>
            <option value="rain">雨</option>
            <option value="sand">砂嵐</option>
            <option value="snow">雪</option>
          </select>
        </label>
        <label className="flex flex-col">
          フィールド
          <select
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as Terrain)}
            className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
          >
            <option value="none">なし</option>
            <option value="electric">エレキ</option>
            <option value="grassy">グラス</option>
            <option value="psychic">サイコ</option>
            <option value="misty">ミスト</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isCritical}
            onChange={(e) => setIsCritical(e.target.checked)}
          />
          急所
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideStatus}
            onChange={(e) => setHideStatus(e.target.checked)}
          />
          変化技を除外
        </label>
        <label className="flex flex-col">
          防御側HP%
          <input
            type="number"
            min={1}
            max={100}
            value={defenderHpPercent}
            onChange={(e) => setDefenderHpPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 100)))}
            className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
          />
        </label>
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold">結果 ({rows.length} 技)</h2>
          {progress.done < progress.total && (
            <span className="text-xs text-neutral-500">
              読み込み中: {progress.done} / {progress.total}
            </span>
          )}
        </div>
        {!attackerLoaded || !defenderLoaded ? (
          <div className="text-sm text-neutral-500">攻撃側と防御側のポケモンを選択してください</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-neutral-500">読み込み中…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-neutral-500 text-xs">
                <tr>
                  <th className="text-left p-1">技</th>
                  <th className="p-1">タイプ</th>
                  <th className="p-1">分類</th>
                  <th className="text-right p-1">威力</th>
                  <th className="text-right p-1">命中</th>
                  <th className="text-right p-1">ダメージ</th>
                  <th className="text-right p-1">HP%</th>
                  <th className="p-1">KO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isOHKO = r.koCount === r.rollsLen;
                  const isMaybeOHKO = r.koCount > 0 && !isOHKO;
                  return (
                    <tr key={r.name} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="p-1 font-medium">
                        {r.ja}
                        <span className="ml-1 text-[10px] text-neutral-500">{r.name}</span>
                      </td>
                      <td className="p-1 text-center">
                        <TypeBadge type={r.type} />
                      </td>
                      <td className="p-1 text-center text-xs">{CATEGORY_JA[r.category]}</td>
                      <td className="p-1 text-right font-mono">{r.power || "—"}</td>
                      <td className="p-1 text-right font-mono">{r.accuracy ?? "—"}</td>
                      <td className="p-1 text-right font-mono">
                        {r.min === r.max && r.min === 0 ? "—" : `${r.min}〜${r.max}`}
                      </td>
                      <td className="p-1 text-right font-mono text-xs">
                        {r.min === 0 && r.max === 0 ? "—" : `${r.minPct.toFixed(0)}〜${r.maxPct.toFixed(0)}%`}
                      </td>
                      <td className="p-1 text-center">
                        {isOHKO ? (
                          <span className="text-xs px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold">確</span>
                        ) : isMaybeOHKO ? (
                          <span className="text-xs px-1.5 py-0.5 bg-orange-500 text-white rounded font-bold">
                            {((r.koCount / r.rollsLen) * 100).toFixed(0)}%
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
