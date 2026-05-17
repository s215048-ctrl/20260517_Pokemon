import { Nature, StatKey, natureMod } from "@/data/natures";

export type Stats = Record<StatKey, number>;

export function calcHP(base: number, iv: number, ev: number, level: number): number {
  if (base === 1) return 1; // Shedinja-style
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function calcStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: Nature,
  stat: StatKey,
): number {
  if (stat === "hp") return calcHP(base, iv, ev, level);
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(raw * natureMod(nature, stat));
}

// 準速 (junsoku): neutral nature, max EVs (252), max IVs (31)
export function junsokuSpeed(baseSpeed: number, level = 50): number {
  return calcStat(baseSpeed, 31, 252, level, { id: "hardy", ja: "がんばりや", up: null, down: null }, "spe");
}

// 最速 (saisoku): +Speed nature, max EVs (252), max IVs (31)
export function saisokuSpeed(baseSpeed: number, level = 50): number {
  return calcStat(baseSpeed, 31, 252, level, { id: "timid", ja: "おくびょう", up: "spe", down: "atk" }, "spe");
}

// 無振り: neutral nature, max IVs (31), 0 EVs
export function unInvestedSpeed(baseSpeed: number, level = 50): number {
  return calcStat(baseSpeed, 31, 0, level, { id: "hardy", ja: "がんばりや", up: null, down: null }, "spe");
}

export const STAT_STAGE_MULTIPLIERS = [
  2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 1, 3 / 2, 4 / 2, 5 / 2, 6 / 2, 7 / 2, 8 / 2,
];

export function applyStatStage(stat: number, stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  return Math.floor(stat * STAT_STAGE_MULTIPLIERS[s + 6]);
}
