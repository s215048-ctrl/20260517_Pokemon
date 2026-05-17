"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { findRosterEntry } from "@/data/roster";
import { getPokemon, getSpecies, jaName, pickStat, Pokemon, Species, spriteURL } from "@/lib/pokeapi";
import { TypeBadge } from "@/components/TypeBadge";
import { junsokuSpeed, saisokuSpeed, unInvestedSpeed } from "@/lib/stats";
import { abilityJa, moveJa } from "@/data/locale";

export default function PokemonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<Species | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPokemon(null);
    setSpecies(null);
    (async () => {
      try {
        const p = await getPokemon(slug);
        if (cancelled) return;
        setPokemon(p);
        const sp = await getSpecies(p.species.url);
        if (cancelled) return;
        setSpecies(sp);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "読み込み失敗");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const entry = findRosterEntry(slug);

  if (error) {
    return (
      <div className="space-y-3">
        <Link href="/pokemon" className="text-sm underline">
          ← 一覧へ
        </Link>
        <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 rounded">
          読み込みエラー: {error}
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="space-y-3">
        <Link href="/pokemon" className="text-sm underline">
          ← 一覧へ
        </Link>
        <div className="p-4 text-neutral-500">読み込み中…</div>
      </div>
    );
  }

  const displayName = species ? jaName(species, entry?.ja ?? pokemon.name) : entry?.ja ?? pokemon.name;
  const sprite = spriteURL(pokemon);
  const base = {
    hp: pickStat(pokemon, "hp"),
    atk: pickStat(pokemon, "attack"),
    def: pickStat(pokemon, "defense"),
    spa: pickStat(pokemon, "special-attack"),
    spd: pickStat(pokemon, "special-defense"),
    spe: pickStat(pokemon, "speed"),
  };

  return (
    <div className="space-y-4">
      <Link href="/pokemon" className="text-sm underline">
        ← 一覧へ
      </Link>
      <div className="flex flex-wrap gap-4 items-start bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {sprite && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sprite} alt={displayName} className="w-32 h-32 object-contain" />
        )}
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold">
            {displayName}{" "}
            <span className="text-sm text-neutral-500">
              #{pokemon.id} ({pokemon.name})
            </span>
          </h1>
          <div className="mt-2 flex gap-2">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.type.name} type={t.type.name} />
            ))}
          </div>
          <div className="mt-3">
            <div className="text-xs text-neutral-500">特性</div>
            <div className="text-sm">
              {pokemon.abilities.map((a) => (
                <span key={a.ability.name} className="mr-2" title={a.ability.name}>
                  {abilityJa(a.ability.name)}
                  {a.is_hidden ? " (夢)" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-bold mb-2">種族値</h2>
        <table className="w-full text-sm">
          <tbody>
            {(["hp", "atk", "def", "spa", "spd", "spe"] as const).map((k) => (
              <tr key={k} className="border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left py-1 pr-2 font-normal w-20 text-neutral-500">
                  {{ hp: "HP", atk: "攻撃", def: "防御", spa: "特攻", spd: "特防", spe: "素早さ" }[k]}
                </th>
                <td className="py-1 font-mono">{base[k]}</td>
                <td className="py-1 w-full">
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${Math.min(100, (base[k] / 255) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <th className="text-left py-1 pr-2 font-normal w-20 text-neutral-500">合計</th>
              <td className="py-1 font-mono">{Object.values(base).reduce((a, b) => a + b, 0)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-bold mb-2">素早さ実数値 (Lv50)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500">
              <th className="text-left">区分</th>
              <th className="text-right">実数値</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>種族値</td><td className="text-right font-mono">{base.spe}</td></tr>
            <tr><td>無振り (補正なし)</td><td className="text-right font-mono">{unInvestedSpeed(base.spe)}</td></tr>
            <tr><td>準速 (補正なし・252)</td><td className="text-right font-mono">{junsokuSpeed(base.spe)}</td></tr>
            <tr><td>最速 (+補正・252)</td><td className="text-right font-mono">{saisokuSpeed(base.spe)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-bold mb-2">覚える技 ({pokemon.moves.length})</h2>
        <div className="text-xs text-neutral-500 mb-2">
          ※ PokeAPI 上で関連付けされている全技。各技の詳細はダメージ計算ページから個別に確認できます。
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 text-sm">
          {pokemon.moves.map((m) => (
            <div key={m.move.name} className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 rounded text-xs" title={m.move.name}>
              {moveJa(m.move.name)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
