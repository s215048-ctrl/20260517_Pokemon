import { MOVES_JA } from "./moves_ja";
import { ABILITIES_JA } from "./abilities_ja";
import { ITEMS_JA } from "./items_ja";

export function moveJa(slug: string): string {
  return MOVES_JA[slug] ?? slug;
}

export function abilityJa(slug: string): string {
  return ABILITIES_JA[slug] ?? slug;
}

export function itemJa(slug: string): string {
  return ITEMS_JA[slug] ?? slug;
}
