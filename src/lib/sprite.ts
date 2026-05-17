/**
 * Sprite URL builder. Uses PokeAPI's sprite repo (raw GitHub) for predictable URLs
 * without needing an API fetch.
 *
 * For base forms (no suffix), we can use the national dex number directly.
 * For mega/regional forms, the numeric form-id isn't known without an API hit,
 * so we fall back to the dex-numbered base sprite (visually close enough).
 */

const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function officialArtwork(dex: number | undefined): string | null {
  if (!dex) return null;
  return `${SPRITE_BASE}/other/official-artwork/${dex}.png`;
}

export function homeSprite(dex: number | undefined): string | null {
  if (!dex) return null;
  return `${SPRITE_BASE}/other/home/${dex}.png`;
}

export function frontSprite(dex: number | undefined): string | null {
  if (!dex) return null;
  return `${SPRITE_BASE}/${dex}.png`;
}
