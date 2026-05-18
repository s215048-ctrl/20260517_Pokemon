"use client";

import { useEffect, useMemo, useState } from "react";
import { PokemonSelect } from "@/components/PokemonSelect";
import { TypeBadge } from "@/components/TypeBadge";
import { NATURES, natureById, StatKey } from "@/data/natures";
import { calcStat } from "@/lib/stats";
import { getPokemon, pickStat, Pokemon } from "@/lib/pokeapi";
import { findRosterEntry } from "@/data/roster";
import { officialArtwork } from "@/lib/sprite";

type Tab = "speed" | "bulk";

export default function TuningPage() {
  const [tab, setTab] = useState<Tab>("speed");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold heading-glow inline-block">調整サポート</h1>
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <TabButton active={tab === "speed"} onClick={() => setTab("speed")}>
          素早さ調整 (抜き調整)
        </TabButton>
        <TabButton active={tab === "bulk"} onClick={() => setTab("bulk")}>
          耐久調整 (確定耐え)
        </TabButton>
      </div>
      {tab === "speed" ? <SpeedTuning /> : <BulkTuning />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-rose-500 text-rose-600 dark:text-rose-400"
          : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// 素早さ調整 (抜き調整)
// ────────────────────────────────────────────────────────────
function SpeedTuning() {
  const [level, setLevel] = useState(50);

  // Target Pokemon
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const [targetEv, setTargetEv] = useState(252);
  const [targetIv, setTargetIv] = useState(31);
  const [targetNatureUp, setTargetNatureUp] = useState(true);
  const [targetScarf, setTargetScarf] = useState(false);
  const [targetStage, setTargetStage] = useState(0);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);

  // My Pokemon
  const [mySlug, setMySlug] = useState<string | null>(null);
  const [myIv, setMyIv] = useState(31);
  const [myStage, setMyStage] = useState(0);
  const [myScarf, setMyScarf] = useState(false);
  const [myPokemon, setMyPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTargetPokemon(null);
    if (!targetSlug) return;
    getPokemon(targetSlug).then((p) => { if (!cancelled) setTargetPokemon(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, [targetSlug]);

  useEffect(() => {
    let cancelled = false;
    setMyPokemon(null);
    if (!mySlug) return;
    getPokemon(mySlug).then((p) => { if (!cancelled) setMyPokemon(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, [mySlug]);

  const stageMul = (s: number) => [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 1, 3 / 2, 2, 5 / 2, 3, 7 / 2, 4][Math.max(-6, Math.min(6, s)) + 6];

  const targetSpeed = useMemo(() => {
    if (!targetPokemon) return 0;
    const base = pickStat(targetPokemon, "speed");
    const nat = natureById(targetNatureUp ? "timid" : "hardy");
    let spe = calcStat(base, targetIv, targetEv, level, nat, "spe");
    spe = Math.floor(spe * stageMul(targetStage));
    if (targetScarf) spe = Math.floor(spe * 1.5);
    return spe;
  }, [targetPokemon, targetEv, targetIv, targetNatureUp, targetScarf, targetStage, level]);

  // Compute minimum EV required for various nature/IV settings to outpace target
  const myResults = useMemo(() => {
    if (!myPokemon || targetSpeed <= 0) return null;
    const base = pickStat(myPokemon, "speed");
    const myStageMul = stageMul(myStage);
    const scarfMul = myScarf ? 1.5 : 1;

    // We want final speed > targetSpeed (抜き)
    // final = floor(floor(calcStat(...) * myStageMul) * scarfMul)
    // We binary-search EV from 0..252 (step 4)
    function findMinEV(natureId: string): number | null {
      const nat = natureById(natureId);
      for (let ev = 0; ev <= 252; ev += 4) {
        let spe = calcStat(base, myIv, ev, level, nat, "spe");
        spe = Math.floor(spe * myStageMul);
        if (myScarf) spe = Math.floor(spe * scarfMul);
        if (spe > targetSpeed) return ev;
      }
      return null; // even 252 EV can't outpace
    }

    return {
      neutral: findMinEV("hardy"),
      positive: findMinEV("timid"),
      base,
    };
  }, [myPokemon, myIv, myStage, myScarf, targetSpeed, level]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        相手の素早さを「抜く」ために必要な最小努力値を計算します。
      </p>

      <div className="card p-3">
        <label className="text-sm flex items-center gap-2">
          Lv:
          <input
            type="number" min={1} max={100} value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 50)}
            className="w-16 p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
          />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-3 space-y-2">
          <div className="font-bold">抜きたい相手</div>
          <PokemonSelect value={targetSlug} onChange={setTargetSlug} />
          {targetPokemon && (
            <>
              <div className="text-xs text-neutral-500">
                素早さ種族値: <span className="font-mono font-bold">{pickStat(targetPokemon, "speed")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col">
                  努力値
                  <input
                    type="number" min={0} max={252} step={4}
                    value={targetEv}
                    onChange={(e) => setTargetEv(Math.max(0, Math.min(252, parseInt(e.target.value) || 0)))}
                    className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  />
                </label>
                <label className="flex flex-col">
                  個体値
                  <input
                    type="number" min={0} max={31}
                    value={targetIv}
                    onChange={(e) => setTargetIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                    className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  />
                </label>
                <label className="flex items-center gap-1 col-span-2">
                  <input type="checkbox" checked={targetNatureUp} onChange={(e) => setTargetNatureUp(e.target.checked)} />
                  +素早さ性格(最速)
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={targetScarf} onChange={(e) => setTargetScarf(e.target.checked)} />
                  スカーフ
                </label>
                <label className="flex flex-col">
                  ランク
                  <select
                    value={targetStage}
                    onChange={(e) => setTargetStage(parseInt(e.target.value))}
                    className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  >
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s}>{s >= 0 ? `+${s}` : s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="text-lg font-mono">
                相手実数値: <span className="font-bold">{targetSpeed}</span>
              </div>
            </>
          )}
        </div>

        <div className="card p-3 space-y-2">
          <div className="font-bold">自分のポケモン</div>
          <PokemonSelect value={mySlug} onChange={setMySlug} />
          {myPokemon && (
            <>
              <div className="text-xs text-neutral-500">
                素早さ種族値: <span className="font-mono font-bold">{pickStat(myPokemon, "speed")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col">
                  個体値
                  <input
                    type="number" min={0} max={31}
                    value={myIv}
                    onChange={(e) => setMyIv(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                    className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  />
                </label>
                <label className="flex flex-col">
                  ランク
                  <select
                    value={myStage}
                    onChange={(e) => setMyStage(parseInt(e.target.value))}
                    className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  >
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s}>{s >= 0 ? `+${s}` : s}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 col-span-2">
                  <input type="checkbox" checked={myScarf} onChange={(e) => setMyScarf(e.target.checked)} />
                  スカーフ装備
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {myResults && (
        <div className="card p-4">
          <h2 className="font-bold mb-2">必要な努力値</h2>
          <table className="w-full text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="text-left p-1">性格</th>
                <th className="text-right p-1">最小EV</th>
                <th className="text-left p-1 pl-3">備考</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-1">補正なし (準速系)</td>
                <td className="p-1 text-right font-mono font-bold">
                  {myResults.neutral === null ? "—" : myResults.neutral}
                </td>
                <td className="p-1 pl-3 text-xs text-neutral-500">
                  {myResults.neutral === null ? "252振りでも抜けません" : myResults.neutral === 0 ? "無振りで抜けます" : ""}
                </td>
              </tr>
              <tr className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="p-1">+素早さ補正 (最速系)</td>
                <td className="p-1 text-right font-mono font-bold">
                  {myResults.positive === null ? "—" : myResults.positive}
                </td>
                <td className="p-1 pl-3 text-xs text-neutral-500">
                  {myResults.positive === null ? "最速252でも抜けません" : myResults.positive === 0 ? "無振り(+補正)で抜けます" : ""}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-neutral-500 mt-2">
            「抜く」= 相手の実数値より高い (同速ではなく確定で上)
          </p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 耐久調整 (確定耐え)
// ────────────────────────────────────────────────────────────
import { calculateDamage, MoveInput, SideInput, Weather, Terrain } from "@/lib/damage";
import { POKE_TYPES, PokeType } from "@/data/types";
import { abilityJa } from "@/data/locale";
import { SideEditor, SideState, newSideState } from "@/components/SideEditor";
import { MoveSelector } from "@/components/MoveSelector";
import { Species } from "@/lib/pokeapi";

interface LoadedSide { pokemon: Pokemon; species: Species; sideInput: SideInput; }

function BulkTuning() {
  const [attacker, setAttacker] = useState<SideState>(newSideState("adamant"));
  const [defender, setDefender] = useState<SideState>(newSideState("hardy"));
  const [attackerLoaded, setAttackerLoaded] = useState<LoadedSide | null>(null);
  const [defenderLoaded, setDefenderLoaded] = useState<LoadedSide | null>(null);

  const [moveSlug, setMoveSlug] = useState<string | null>(null);
  const [move, setMove] = useState<MoveInput | null>(null);

  const [weather, setWeather] = useState<Weather>("none");
  const [terrain, setTerrain] = useState<Terrain>("none");
  const [isCritical, setIsCritical] = useState(false);
  const [target, setTarget] = useState<"確定耐え (16/16)" | "高乱耐え (15/16)" | "中乱耐え (12/16)">("確定耐え (16/16)");

  // Optimization: keep defender's nature/IVs but solve for HP and Def (or SpD).
  const result = useMemo(() => {
    if (!attackerLoaded || !defenderLoaded || !move || !move.power) return null;
    const isPhysical = move.category === "physical";
    const defStatKey: StatKey = isPhysical ? "def" : "spd";

    // Targets
    const needRollsKO: Record<typeof target, number> = {
      "確定耐え (16/16)": 0,    // 0 KOs out of 16 = always survive
      "高乱耐え (15/16)": 1,
      "中乱耐え (12/16)": 4,
    };
    const maxAllowedKO = needRollsKO[target];

    // Recompute defender stats with overridden HP/Def EVs
    const defPokemon = defenderLoaded.pokemon;
    const defState = defender;
    const baseHP = pickStat(defPokemon, "hp");
    const baseDef = pickStat(defPokemon, isPhysical ? "defense" : "special-defense");
    const nature = natureById(defState.natureId);

    // Try every (hpEv, defEv) combo where hpEv + defEv <= 508 (rest of EVs unspecified here)
    // We want minimum total HP+Def EV that achieves the target. We iterate by total ascending.
    const otherEVs = (["atk", "spa", "spe"] as StatKey[]).reduce((a, k) => a + defState.evs[k], 0);
    const remainingBudget = Math.max(0, 508 - otherEVs);

    function evalAt(hpEv: number, defEv: number): boolean {
      const hp = calcStat(baseHP, defState.ivs.hp, hpEv, defState.level, nature, "hp");
      const dv = calcStat(baseDef, defState.ivs[defStatKey], defEv, defState.level, nature, defStatKey);
      // Build a synthetic SideInput
      const stats = { ...defenderLoaded!.sideInput.stats, hp, [isPhysical ? "def" : "spd"]: dv };
      const sideIn: SideInput = { ...defenderLoaded!.sideInput, stats };
      const res = calculateDamage(attackerLoaded!.sideInput, sideIn, move!, { weather, terrain, isCritical });
      const koCount = res.rolls.filter((r) => r >= hp).length;
      return koCount <= maxAllowedKO;
    }

    // Find min total EV (4 step). Sweep total from 0 to remainingBudget, then for each total, sweep hpEv.
    let best: { hpEv: number; defEv: number; total: number; hp: number; defStat: number } | null = null;
    for (let total = 0; total <= Math.min(504, remainingBudget); total += 4) {
      for (let hpEv = 0; hpEv <= Math.min(252, total); hpEv += 4) {
        const defEv = total - hpEv;
        if (defEv > 252) continue;
        if (evalAt(hpEv, defEv)) {
          const hp = calcStat(baseHP, defState.ivs.hp, hpEv, defState.level, nature, "hp");
          const dv = calcStat(baseDef, defState.ivs[defStatKey], defEv, defState.level, nature, defStatKey);
          best = { hpEv, defEv, total, hp, defStat: dv };
          break;
        }
      }
      if (best) break;
    }

    return { best, defStatKey, isPhysical, target, maxAllowedKO };
  }, [attackerLoaded, defenderLoaded, defender, move, weather, terrain, isCritical, target]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        攻撃側の指定技を「確定耐え/乱数耐え」するために必要な防御側のHP/防御 (or 特防) 努力値を逆算します。
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <SideEditor label="攻撃側" state={attacker} onChange={setAttacker} onLoaded={setAttackerLoaded} />
        <SideEditor label="防御側 (このポケモンを調整)" state={defender} onChange={setDefender} onLoaded={setDefenderLoaded} />
      </div>

      <div className="card p-3">
        <div className="font-bold mb-2">攻撃技</div>
        <MoveSelector pokemon={attackerLoaded?.pokemon ?? null} value={moveSlug} onChange={setMoveSlug} onLoaded={setMove} />
      </div>

      <div className="card p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <label className="flex flex-col">
          天候
          <select value={weather} onChange={(e) => setWeather(e.target.value as Weather)} className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700">
            <option value="none">なし</option><option value="sun">晴れ</option><option value="rain">雨</option><option value="sand">砂嵐</option><option value="snow">雪</option>
          </select>
        </label>
        <label className="flex flex-col">
          フィールド
          <select value={terrain} onChange={(e) => setTerrain(e.target.value as Terrain)} className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700">
            <option value="none">なし</option><option value="electric">エレキ</option><option value="grassy">グラス</option><option value="psychic">サイコ</option><option value="misty">ミスト</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} />
          急所
        </label>
        <label className="flex flex-col">
          目標
          <select value={target} onChange={(e) => setTarget(e.target.value as typeof target)} className="p-1 border rounded bg-white dark:bg-neutral-900 dark:border-neutral-700">
            <option>確定耐え (16/16)</option>
            <option>高乱耐え (15/16)</option>
            <option>中乱耐え (12/16)</option>
          </select>
        </label>
      </div>

      <div className="card p-4">
        <h2 className="font-bold mb-2">調整結果</h2>
        {!attackerLoaded || !defenderLoaded || !move ? (
          <div className="text-sm text-neutral-500">両側のポケモンと攻撃技を選択してください</div>
        ) : move.power === 0 ? (
          <div className="text-sm text-neutral-500">変化技は耐久調整できません</div>
        ) : !result?.best ? (
          <div className="text-sm text-rose-600">
            ※ 防御側に振れる残り努力値だけでは目標を達成できません。他のステ振りを減らして再試行してください。
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-neutral-500">調整対象: </span>
              <span className="font-bold">{result.isPhysical ? "HP / 防御" : "HP / 特防"}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr><th className="text-left py-1 pr-3 text-neutral-500 font-normal">HP努力値</th><td className="py-1 font-mono font-bold">{result.best.hpEv}</td></tr>
                <tr><th className="text-left py-1 pr-3 text-neutral-500 font-normal">{result.isPhysical ? "防御" : "特防"}努力値</th><td className="py-1 font-mono font-bold">{result.best.defEv}</td></tr>
                <tr><th className="text-left py-1 pr-3 text-neutral-500 font-normal">合計</th><td className="py-1 font-mono">{result.best.total}</td></tr>
                <tr><th className="text-left py-1 pr-3 text-neutral-500 font-normal">実数値 HP</th><td className="py-1 font-mono">{result.best.hp}</td></tr>
                <tr><th className="text-left py-1 pr-3 text-neutral-500 font-normal">実数値 {result.isPhysical ? "防御" : "特防"}</th><td className="py-1 font-mono">{result.best.defStat}</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-neutral-500">
              ※ HPと{result.isPhysical ? "防御" : "特防"}の合計が最小になる組み合わせを採用。同合計値の中ではHP優先で割当。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
