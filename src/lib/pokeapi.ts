import { PokeType } from "@/data/types";
import { MoveCategory } from "./damage";

const API_BASE = "https://pokeapi.co/api/v2";

// Simple in-memory + sessionStorage cache.
const memoryCache = new Map<string, any>();

function cacheGet(key: string): any | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const v = JSON.parse(raw);
        memoryCache.set(key, v);
        return v;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

function cacheSet(key: string, value: any): void {
  memoryCache.set(key, value);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota - ignore
    }
  }
}

async function fetchJSON<T>(path: string): Promise<T> {
  const key = `poke:${path}`;
  const cached = cacheGet(key);
  if (cached) return cached as T;
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`PokeAPI ${path}: ${res.status}`);
  const json = (await res.json()) as T;
  cacheSet(key, json);
  return json;
}

// ---------- Pokémon ----------

export interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonMoveRef {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: PokeType } }[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: PokemonMoveRef[];
  species: { name: string; url: string };
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
      home?: { front_default: string | null };
    };
  };
}

export function getPokemon(slug: string): Promise<Pokemon> {
  return fetchJSON<Pokemon>(`/pokemon/${slug}`);
}

// ---------- Species (for Japanese name) ----------

export interface Species {
  id: number;
  name: string;
  names: { language: { name: string }; name: string }[];
}

export function getSpecies(url: string): Promise<Species> {
  // url is like https://pokeapi.co/api/v2/pokemon-species/25/
  const m = url.match(/\/pokemon-species\/(\d+)\/?$/);
  const id = m ? m[1] : "0";
  return fetchJSON<Species>(`/pokemon-species/${id}`);
}

export function jaName(species: Species, fallback: string): string {
  const en = species.names.find((n) => n.language.name === "en");
  const ja = species.names.find((n) => n.language.name === "ja-Hrkt" || n.language.name === "ja");
  return ja?.name ?? en?.name ?? fallback;
}

// ---------- Move ----------

export interface Move {
  id: number;
  name: string;
  accuracy: number | null;
  power: number | null;
  pp: number | null;
  priority: number;
  type: { name: PokeType };
  damage_class: { name: MoveCategory };
  names: { language: { name: string }; name: string }[];
  flavor_text_entries: { language: { name: string }; flavor_text: string }[];
  meta?: {
    crit_rate: number;
    drain: number;
    healing: number;
    min_hits: number | null;
    max_hits: number | null;
  } | null;
}

export function getMove(name: string): Promise<Move> {
  return fetchJSON<Move>(`/move/${name}`);
}

export function moveJaName(move: Move): string {
  const ja = move.names.find((n) => n.language.name === "ja-Hrkt" || n.language.name === "ja");
  return ja?.name ?? move.name;
}

// ---------- Helpers ----------

export function pickStat(p: Pokemon, name: "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed"): number {
  return p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
}

export function spriteURL(p: Pokemon): string | null {
  return (
    p.sprites.other?.["official-artwork"]?.front_default ??
    p.sprites.other?.home?.front_default ??
    p.sprites.front_default ??
    null
  );
}
