"use client";

import { useMemo, useState } from "react";
import { SideEditor, SideState, newSideState } from "@/components/SideEditor";
import { MoveSelector } from "@/components/MoveSelector";
import { DamageGauge } from "@/components/DamageGauge";
import { Pokemon, Species } from "@/lib/pokeapi";
import { calculateDamage, DamageOptions, MoveInput, SideInput, Terrain, Weather } from "@/lib/damage";

interface LoadedSide {
  pokemon: Pokemon;
  species: Species;
  sideInput: SideInput;
}

export default function DamagePage() {
  const [attacker, setAttacker] = useState<SideState>(newSideState("adamant"));
  const [defender, setDefender] = useState<SideState>(newSideState("bold"));
  const [attackerLoaded, setAttackerLoaded] = useState<LoadedSide | null>(null);
  const [defenderLoaded, setDefenderLoaded] = useState<LoadedSide | null>(null);

  const [moveSlug, setMoveSlug] = useState<string | null>(null);
  const [move, setMove] = useState<MoveInput | null>(null);

  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [isCritical, setIsCritical] = useState(false);
  const [hpPercent, setHpPercent] = useState(100);

  const result = useMemo(() => {
    if (!attackerLoaded || !defenderLoaded || !move) return null;
    const opts: DamageOptions = { weather, terrain, isCritical, hpPercent };
    return calculateDamage(attackerLoaded.sideInput, defenderLoaded.sideInput, move, opts);
  }, [attackerLoaded, defenderLoaded, move, weather, terrain, isCritical, hpPercent]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ダメージ計算 (第9世代準拠)</h1>

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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="font-bold mb-2">技選択 (攻撃側が覚える技)</div>
          <MoveSelector
            pokemon={attackerLoaded?.pokemon ?? null}
            value={moveSlug}
            onChange={setMoveSlug}
            onLoaded={setMove}
          />
        </div>
        <div className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="font-bold mb-2">場の状態</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
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
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
              />
              急所
            </label>
            <label className="flex flex-col col-span-2">
              攻撃側 HP%
              <input
                type="number"
                min={1}
                max={100}
                value={hpPercent}
                onChange={(e) => setHpPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 100)))}
                className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
              />
              <span className="text-xs text-neutral-500">もうか/げきりゅう等の判定用 (33%以下で発動)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="card p-5 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <h2 className="font-display text-2xl mb-3 heading-glow inline-block">計算結果</h2>
        {!result ? (
          <div className="text-sm text-neutral-500">
            両側のポケモンと技を選択するとここに表示されます
          </div>
        ) : result.effectiveness === 0 ? (
          <div className="text-2xl font-bold text-neutral-600">こうかなし</div>
        ) : result.min === 0 && result.max === 0 ? (
          <div className="text-lg text-neutral-600">変化技 (ダメージなし)</div>
        ) : (
          <div className="space-y-4 relative">
            <div className="flex flex-wrap items-baseline gap-3">
              <div className="font-mono text-4xl font-bold">
                {result.min} 〜 {result.max}
              </div>
              <div className="text-lg text-neutral-700 dark:text-neutral-300">
                ({result.minPct.toFixed(1)}% 〜 {result.maxPct.toFixed(1)}%)
              </div>
              {result.guaranteedOHKO && (
                <span className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-full font-bold shadow-lg shadow-rose-600/30">
                  確定1発
                </span>
              )}
              {!result.guaranteedOHKO && result.possibleOHKO && (
                <span className="px-2.5 py-1 bg-orange-500 text-white text-xs rounded-full font-bold shadow-lg shadow-orange-500/30">
                  乱数1発
                </span>
              )}
            </div>
            {defenderLoaded && (
              <DamageGauge
                defenderHp={defenderLoaded.sideInput.stats.hp}
                minDamage={result.min}
                maxDamage={result.max}
                rolls={result.rolls}
              />
            )}
            <div>
              <div className="text-xs text-neutral-500 mb-1">乱数 (16段階)</div>
              <div className="flex flex-wrap gap-1 text-xs font-mono">
                {result.rolls.map((r, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            {result.notes.length > 0 && (
              <div>
                <div className="text-xs text-neutral-500 mb-1">適用された補正</div>
                <ul className="text-sm list-disc list-inside">
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        ※ 第9世代の主要補正に対応: タイプ相性、性格、努力値、個体値、ランク、STAB、テラスタル、天候、フィールド、急所、一部特性 (もうか/げきりゅう/しんりょく/むしのしらせ、ちからもち/ヨガパワー、テクニシャン、てつのこぶし、かたいツメ、あついしぼう、もふもふ、マルチスケイル、フィルター/ハードロック、てきおうりょく)、一部持ち物 (いのちのたま、こだわりハチマキ/メガネ、たつじんのおび、ちからのハチマキ、ものしりメガネ、タイプ強化アイテム)。
      </div>
    </div>
  );
}
