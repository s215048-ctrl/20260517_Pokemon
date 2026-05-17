// Pokemon natures. Each modifies one stat by +10% and another by -10%.
// "neutral" natures (same up/down) have no net effect.

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export const STAT_JA: Record<StatKey, string> = {
  hp: "HP",
  atk: "攻撃",
  def: "防御",
  spa: "特攻",
  spd: "特防",
  spe: "素早さ",
};

export interface Nature {
  id: string;
  ja: string;
  up: StatKey | null;
  down: StatKey | null;
}

export const NATURES: Nature[] = [
  { id: "hardy", ja: "がんばりや", up: null, down: null },
  { id: "lonely", ja: "さみしがり", up: "atk", down: "def" },
  { id: "brave", ja: "ゆうかん", up: "atk", down: "spe" },
  { id: "adamant", ja: "いじっぱり", up: "atk", down: "spa" },
  { id: "naughty", ja: "やんちゃ", up: "atk", down: "spd" },
  { id: "bold", ja: "ずぶとい", up: "def", down: "atk" },
  { id: "docile", ja: "すなお", up: null, down: null },
  { id: "relaxed", ja: "のんき", up: "def", down: "spe" },
  { id: "impish", ja: "わんぱく", up: "def", down: "spa" },
  { id: "lax", ja: "のうてんき", up: "def", down: "spd" },
  { id: "timid", ja: "おくびょう", up: "spe", down: "atk" },
  { id: "hasty", ja: "せっかち", up: "spe", down: "def" },
  { id: "serious", ja: "まじめ", up: null, down: null },
  { id: "jolly", ja: "ようき", up: "spe", down: "spa" },
  { id: "naive", ja: "むじゃき", up: "spe", down: "spd" },
  { id: "modest", ja: "ひかえめ", up: "spa", down: "atk" },
  { id: "mild", ja: "おっとり", up: "spa", down: "def" },
  { id: "quiet", ja: "れいせい", up: "spa", down: "spe" },
  { id: "bashful", ja: "てれや", up: null, down: null },
  { id: "rash", ja: "うっかりや", up: "spa", down: "spd" },
  { id: "calm", ja: "おだやか", up: "spd", down: "atk" },
  { id: "gentle", ja: "おとなしい", up: "spd", down: "def" },
  { id: "sassy", ja: "なまいき", up: "spd", down: "spe" },
  { id: "careful", ja: "しんちょう", up: "spd", down: "spa" },
  { id: "quirky", ja: "きまぐれ", up: null, down: null },
];

export function natureMod(nature: Nature, stat: StatKey): number {
  if (nature.up === stat && nature.down !== stat) return 1.1;
  if (nature.down === stat && nature.up !== stat) return 0.9;
  return 1.0;
}

export function natureById(id: string): Nature {
  return NATURES.find((n) => n.id === id) ?? NATURES[0];
}
