/**
 * Japanese-aware search utilities for filtering Pokemon/move/ability names.
 */

// Convert hiragana to katakana (U+3041..U+3096 -> U+30A1..U+30F6).
export function hiraToKata(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  );
}

// Convert katakana to hiragana (the inverse).
export function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

// Build a normalized key for matching: lowercase ASCII + force-katakana for kana.
export function normalize(s: string): string {
  return hiraToKata(s).toLowerCase();
}

/**
 * Score how well a candidate matches the query.
 * Lower = better. Returns -1 if no match.
 *
 *   0  candidate name starts with query
 *   1  candidate slug starts with query
 *   2  candidate name contains query
 *   3  candidate slug contains query
 */
export function matchScore(
  candidate: { ja: string; slug: string },
  rawQuery: string,
): number {
  const q = normalize(rawQuery.trim());
  if (!q) return 0;
  const ja = normalize(candidate.ja);
  const slug = candidate.slug.toLowerCase();
  if (ja.startsWith(q)) return 0;
  if (slug.startsWith(q)) return 1;
  if (ja.includes(q)) return 2;
  if (slug.includes(q)) return 3;
  return -1;
}

/**
 * Filter and sort an array by relevance to the query. Stable within score
 * buckets (preserves original order).
 */
export function searchSort<T extends { ja: string; slug: string }>(
  items: readonly T[],
  query: string,
): T[] {
  if (!query.trim()) return items.slice();
  const scored: { item: T; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const s = matchScore(item, query);
    if (s >= 0) scored.push({ item, score: s, index });
  });
  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return scored.map((s) => s.item);
}
