import { PokeType, typeEffectiveness } from "@/data/types";
import { applyStatStage } from "./stats";

export type Weather = "none" | "sun" | "rain" | "sand" | "snow";
export type Terrain = "none" | "electric" | "grassy" | "psychic" | "misty";
export type MoveCategory = "physical" | "special" | "status";

export interface MoveInput {
  name: string;
  ja?: string;
  type: PokeType;
  category: MoveCategory;
  power: number;
  accuracy: number | null;
}

export interface SideInput {
  level: number;
  types: PokeType[];
  ability?: string;
  item?: string;
  // Pre-computed final stats including nature/EV/IV.
  stats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  // Stat stage modifiers (-6 to +6)
  stages: {
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  isTera?: boolean;
  teraType?: PokeType;
}

export interface DamageOptions {
  weather: Weather;
  terrain: Terrain;
  isCritical: boolean;
  // % HP remaining for attacker (for ability triggers like Blaze)
  hpPercent?: number;
}

export interface DamageResult {
  min: number;
  max: number;
  rolls: number[];
  effectiveness: number;
  hits: number;
  // Percent of defender HP (min/max)
  minPct: number;
  maxPct: number;
  // KO probabilities at various rolls
  guaranteedOHKO: boolean;
  possibleOHKO: boolean;
  // Notes on modifiers applied
  notes: string[];
}

const PHYSICAL_TYPE_BOOST_ITEMS: Record<string, PokeType> = {
  "silver-powder": "bug",
  "soft-sand": "ground",
  "hard-stone": "rock",
  "spell-tag": "ghost",
  "metal-coat": "steel",
  "charcoal": "fire",
  "mystic-water": "water",
  "magnet": "electric",
  "miracle-seed": "grass",
  "never-melt-ice": "ice",
  "black-belt": "fighting",
  "poison-barb": "poison",
  "sharp-beak": "flying",
  "twisted-spoon": "psychic",
  "silk-scarf": "normal",
  "dragon-fang": "dragon",
  "black-glasses": "dark",
};

// Defender types after Tera
function effectiveTypes(side: SideInput): PokeType[] {
  if (side.isTera && side.teraType) return [side.teraType];
  return side.types;
}

// STAB calculation (Gen 9 with Terastal)
function stabMultiplier(attacker: SideInput, moveType: PokeType): number {
  const originalSTAB = attacker.types.includes(moveType);
  if (attacker.isTera && attacker.teraType) {
    const teraSTAB = attacker.teraType === moveType;
    if (teraSTAB && originalSTAB) {
      // Same type as Tera and original: ×2.0 (Adaptability would push to ×2.25)
      return attacker.ability === "adaptability" ? 2.25 : 2.0;
    }
    if (teraSTAB || originalSTAB) {
      return attacker.ability === "adaptability" ? 2.0 : 1.5;
    }
    return 1.0;
  }
  if (originalSTAB) {
    return attacker.ability === "adaptability" ? 2.0 : 1.5;
  }
  return 1.0;
}

function weatherMultiplier(move: MoveInput, weather: Weather): { mult: number; note?: string } {
  if (weather === "sun") {
    if (move.type === "fire") return { mult: 1.5, note: "晴れ ×1.5 (ほのお)" };
    if (move.type === "water") return { mult: 0.5, note: "晴れ ×0.5 (みず)" };
  }
  if (weather === "rain") {
    if (move.type === "water") return { mult: 1.5, note: "雨 ×1.5 (みず)" };
    if (move.type === "fire") return { mult: 0.5, note: "雨 ×0.5 (ほのお)" };
  }
  return { mult: 1.0 };
}

function terrainMultiplier(
  move: MoveInput,
  attackerGrounded: boolean,
  defenderGrounded: boolean,
  terrain: Terrain,
): { mult: number; note?: string } {
  if (terrain === "electric" && move.type === "electric" && attackerGrounded) {
    return { mult: 1.3, note: "エレキフィールド ×1.3" };
  }
  if (terrain === "grassy" && move.type === "grass" && attackerGrounded) {
    return { mult: 1.3, note: "グラスフィールド ×1.3" };
  }
  if (terrain === "psychic" && move.type === "psychic" && attackerGrounded) {
    return { mult: 1.3, note: "サイコフィールド ×1.3" };
  }
  if (terrain === "misty" && move.type === "dragon" && defenderGrounded) {
    return { mult: 0.5, note: "ミストフィールド ×0.5 (ドラゴン)" };
  }
  if (terrain === "grassy" && (move.name === "earthquake" || move.name === "bulldoze" || move.name === "magnitude") && defenderGrounded) {
    return { mult: 0.5, note: "グラスフィールド ×0.5 (じめん技)" };
  }
  return { mult: 1.0 };
}

function abilityAttackMultiplier(
  attacker: SideInput,
  move: MoveInput,
  hpPercent: number,
): { mult: number; note?: string } {
  const a = attacker.ability;
  if (!a) return { mult: 1.0 };
  if (hpPercent <= 33.33) {
    if (a === "blaze" && move.type === "fire") return { mult: 1.5, note: "もうか ×1.5" };
    if (a === "torrent" && move.type === "water") return { mult: 1.5, note: "げきりゅう ×1.5" };
    if (a === "overgrow" && move.type === "grass") return { mult: 1.5, note: "しんりょく ×1.5" };
    if (a === "swarm" && move.type === "bug") return { mult: 1.5, note: "むしのしらせ ×1.5" };
  }
  if (a === "huge-power" || a === "pure-power") {
    if (move.category === "physical") return { mult: 2.0, note: "ちからもち/ヨガパワー ×2.0" };
  }
  if (a === "guts" && move.category === "physical") {
    // Assume any status condition: 1.5x Attack
    return { mult: 1.0 }; // Status not modeled yet
  }
  if (a === "technician" && move.power <= 60) {
    return { mult: 1.5, note: "テクニシャン ×1.5" };
  }
  if (a === "iron-fist" && isPunchingMove(move.name)) {
    return { mult: 1.2, note: "てつのこぶし ×1.2" };
  }
  if (a === "tough-claws" && isContactMove(move.name)) {
    return { mult: 1.3, note: "かたいツメ ×1.3" };
  }
  return { mult: 1.0 };
}

function abilityDefenseMultiplier(defender: SideInput, move: MoveInput): { mult: number; note?: string } {
  const a = defender.ability;
  if (!a) return { mult: 1.0 };
  if (a === "thick-fat" && (move.type === "fire" || move.type === "ice")) {
    return { mult: 0.5, note: "あついしぼう ×0.5" };
  }
  if (a === "fluffy") {
    if (move.type === "fire") return { mult: 2.0, note: "もふもふ ×2.0 (ほのお)" };
    if (isContactMove(move.name)) return { mult: 0.5, note: "もふもふ ×0.5 (接触)" };
  }
  if (a === "multiscale" || a === "shadow-shield") {
    // Only at full HP - assume true unless we model otherwise
    return { mult: 0.5, note: "マルチスケイル/シャドーアーマー ×0.5 (満タン時)" };
  }
  if (a === "filter" || a === "solid-rock" || a === "prism-armor") {
    // Reduces super-effective damage by 25%
    return { mult: 1.0 }; // Applied conditionally below
  }
  return { mult: 1.0 };
}

function itemMultiplier(attacker: SideInput, move: MoveInput): { mult: number; note?: string } {
  const item = attacker.item;
  if (!item) return { mult: 1.0 };
  if (item === "life-orb") return { mult: 1.3, note: "いのちのたま ×1.3" };
  if (item === "choice-band" && move.category === "physical") return { mult: 1.5, note: "こだわりハチマキ ×1.5" };
  if (item === "choice-specs" && move.category === "special") return { mult: 1.5, note: "こだわりメガネ ×1.5" };
  if (item === "expert-belt") {
    // Only on super-effective; applied below
    return { mult: 1.0 };
  }
  if (item === "muscle-band" && move.category === "physical") return { mult: 1.1, note: "ちからのハチマキ ×1.1" };
  if (item === "wise-glasses" && move.category === "special") return { mult: 1.1, note: "ものしりメガネ ×1.1" };
  // Type-boosting plate/incense/etc.
  const boostType = PHYSICAL_TYPE_BOOST_ITEMS[item];
  if (boostType && boostType === move.type) {
    return { mult: 1.2, note: `${item} ×1.2 (${move.type})` };
  }
  return { mult: 1.0 };
}

function isContactMove(name: string): boolean {
  // Simplified — true contact list is large. Heuristic.
  const nonContact = new Set([
    "earthquake", "thunderbolt", "ice-beam", "flamethrower", "surf", "psychic",
    "shadow-ball", "earth-power", "moonblast", "draco-meteor", "hyper-voice",
    "boomburst", "air-slash", "dragon-pulse", "energy-ball", "focus-blast",
    "scald", "sludge-bomb", "dark-pulse", "aura-sphere", "flash-cannon",
    "fire-blast", "thunder", "blizzard", "hurricane",
  ]);
  return !nonContact.has(name);
}

function isPunchingMove(name: string): boolean {
  return [
    "ice-punch", "fire-punch", "thunder-punch", "mach-punch", "bullet-punch",
    "drain-punch", "focus-punch", "hammer-arm", "shadow-punch", "sky-uppercut",
    "dynamic-punch", "mega-punch", "comet-punch", "dizzy-punch", "meteor-mash",
    "double-iron-bash", "plasma-fists", "power-up-punch",
  ].includes(name);
}

export function calculateDamage(
  attacker: SideInput,
  defender: SideInput,
  move: MoveInput,
  opts: DamageOptions,
): DamageResult {
  const notes: string[] = [];

  if (move.category === "status" || move.power === 0) {
    return {
      min: 0,
      max: 0,
      rolls: new Array(16).fill(0),
      effectiveness: 1,
      hits: 1,
      minPct: 0,
      maxPct: 0,
      guaranteedOHKO: false,
      possibleOHKO: false,
      notes: ["変化技のためダメージなし"],
    };
  }

  const defTypes = effectiveTypes(defender);
  const eff = typeEffectiveness(move.type, defTypes);

  if (eff === 0) {
    return {
      min: 0,
      max: 0,
      rolls: new Array(16).fill(0),
      effectiveness: 0,
      hits: 1,
      minPct: 0,
      maxPct: 0,
      guaranteedOHKO: false,
      possibleOHKO: false,
      notes: ["こうかなし"],
    };
  }

  // Choose stats
  const isPhysical = move.category === "physical";
  const atkBase = isPhysical ? attacker.stats.atk : attacker.stats.spa;
  const defBase = isPhysical ? defender.stats.def : defender.stats.spd;
  const atkStage = isPhysical ? attacker.stages.atk : attacker.stages.spa;
  const defStage = isPhysical ? defender.stages.def : defender.stages.spd;

  // Critical: ignores attacker's negative attack stages and defender's positive defense stages
  let atk = applyStatStage(atkBase, opts.isCritical && atkStage < 0 ? 0 : atkStage);
  let def = applyStatStage(defBase, opts.isCritical && defStage > 0 ? 0 : defStage);

  // Weather defense boost (sand: Rock SpD ×1.5, snow: Ice Def ×1.5)
  if (opts.weather === "sand" && defender.types.includes("rock") && !isPhysical) {
    def = Math.floor(def * 1.5);
    notes.push("砂嵐 SpD ×1.5 (いわタイプ)");
  }
  if (opts.weather === "snow" && defender.types.includes("ice") && isPhysical) {
    def = Math.floor(def * 1.5);
    notes.push("雪 Def ×1.5 (こおりタイプ)");
  }

  // Base damage formula
  // dmg = ((2L/5 + 2) * power * A / D / 50 + 2)
  let power = move.power;

  // Ability attack mods
  const abilAtk = abilityAttackMultiplier(attacker, move, opts.hpPercent ?? 100);
  if (abilAtk.mult !== 1) {
    atk = Math.floor(atk * abilAtk.mult);
    if (abilAtk.note) notes.push(abilAtk.note);
  }

  // Ability defense mods
  const abilDef = abilityDefenseMultiplier(defender, move);
  if (abilDef.mult !== 1) {
    def = Math.floor(def * abilDef.mult);
    if (abilDef.note) notes.push(abilDef.note);
  }

  // Item attack mods
  const itemAtk = itemMultiplier(attacker, move);
  if (itemAtk.mult !== 1) {
    atk = Math.floor(atk * itemAtk.mult);
    if (itemAtk.note) notes.push(itemAtk.note);
  }

  // Weather power mod
  const w = weatherMultiplier(move, opts.weather);
  if (w.mult !== 1) {
    power = Math.floor(power * w.mult);
    if (w.note) notes.push(w.note);
  }

  // Terrain power mod
  const t = terrainMultiplier(move, true, true, opts.terrain);
  if (t.mult !== 1) {
    power = Math.floor(power * t.mult);
    if (t.note) notes.push(t.note);
  }

  // Base damage
  const L = attacker.level;
  let base = Math.floor(Math.floor((Math.floor((2 * L) / 5) + 2) * power * atk) / def);
  base = Math.floor(base / 50) + 2;

  // Critical: ×1.5
  if (opts.isCritical) {
    base = Math.floor(base * 1.5);
    notes.push("急所 ×1.5");
  }

  // STAB
  const stab = stabMultiplier(attacker, move.type);
  if (stab !== 1) {
    base = Math.floor(base * stab);
    notes.push(`タイプ一致 ×${stab}`);
  }

  // Type effectiveness
  base = Math.floor(base * eff);
  if (eff > 1) notes.push(`こうかばつぐん ×${eff}`);
  else if (eff < 1 && eff > 0) notes.push(`いまひとつ ×${eff}`);

  // Filter/Solid Rock/Prism Armor (defender) ×0.75 if super effective
  if (eff > 1 && (defender.ability === "filter" || defender.ability === "solid-rock" || defender.ability === "prism-armor")) {
    base = Math.floor(base * 0.75);
    notes.push("フィルター/ハードロック ×0.75");
  }

  // Expert Belt ×1.2 if super effective
  if (eff > 1 && attacker.item === "expert-belt") {
    base = Math.floor(base * 1.2);
    notes.push("たつじんのおび ×1.2");
  }

  // Damage rolls (85-100%, 16 rolls)
  const rolls: number[] = [];
  for (let i = 0; i < 16; i++) {
    const roll = (85 + i) / 100;
    rolls.push(Math.max(1, Math.floor(base * roll)));
  }

  const min = rolls[0];
  const max = rolls[rolls.length - 1];
  const defenderHP = defender.stats.hp;

  return {
    min,
    max,
    rolls,
    effectiveness: eff,
    hits: 1,
    minPct: (min / defenderHP) * 100,
    maxPct: (max / defenderHP) * 100,
    guaranteedOHKO: min >= defenderHP,
    possibleOHKO: max >= defenderHP,
    notes,
  };
}
