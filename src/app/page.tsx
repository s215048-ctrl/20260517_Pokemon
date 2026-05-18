import Link from "next/link";
import { UNIQUE_ROSTER } from "@/data/roster";
import { officialArtwork } from "@/lib/sprite";

const FEATURED_DEX = [445, 6, 658, 248, 887, 908, 700, 727]; // Garchomp, Charizard, Greninja, Tyranitar, Dragapult, Meowscarada, Sylveon, Incineroar

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl py-12 px-6 bg-gradient-to-br from-rose-100 via-white to-sky-100 dark:from-rose-950 dark:via-neutral-950 dark:to-sky-950 border border-white/60 dark:border-neutral-800 shadow-xl">
        <div className="absolute -top-10 -right-10 w-72 h-72 opacity-20 pointer-events-none">
          <PokeballSilhouette />
        </div>
        <div className="relative max-w-3xl">
          <div className="text-xs uppercase tracking-[0.3em] text-rose-700 dark:text-rose-300 font-bold mb-2">
            Pokémon Champions Calculator
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-3">
            <span className="heading-glow">ポケモンチャンピオンズ計算ツール</span>
          </h1>
          <p className="text-neutral-700 dark:text-neutral-200 text-base md:text-lg max-w-2xl">
            素早さ比較・種族値・第9世代準拠ダメージ計算を、ブラウザだけで完結。
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur border border-neutral-200 dark:border-neutral-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            対応ポケモン: {UNIQUE_ROSTER.length} 体（通常・メガシンカ・リージョン）
          </div>
        </div>
        <div className="relative mt-8 flex justify-center gap-3 flex-wrap">
          {FEATURED_DEX.map((dex) => (
            <FeaturedSprite key={dex} dex={dex} />
          ))}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FeatureCard
          href="/speed"
          title="素早さ比較"
          desc="複数ポケモンの実数値を性格・努力値・補正込みで比較"
          accent="from-yellow-400 to-amber-500"
          icon="⚡"
        />
        <FeatureCard
          href="/speed-table"
          title="素早さ一覧表"
          desc="ロスター全ポケモンの無振り・準速・最速・スカーフ実数値"
          accent="from-sky-400 to-blue-600"
          icon="📊"
        />
        <FeatureCard
          href="/damage"
          title="ダメージ計算"
          desc="第9世代準拠フル。テラスタル・天候・特性・持ち物対応"
          accent="from-rose-500 to-red-700"
          icon="💥"
        />
        <FeatureCard
          href="/pokemon"
          title="ポケモン一覧"
          desc="種族値・タイプ・覚える技をPokeAPIから取得して表示"
          accent="from-emerald-400 to-teal-600"
          icon="📖"
        />
      </section>

      <section className="card p-5">
        <h2 className="font-bold mb-2 heading-glow inline-block">使い方</h2>
        <ul className="text-sm space-y-1 text-neutral-700 dark:text-neutral-300 list-disc list-inside mt-3">
          <li>ポケモンデータは <a href="https://pokeapi.co/" className="underline" target="_blank" rel="noreferrer">PokeAPI</a> から取得（初回読み込みに数秒、以後セッション中キャッシュ）</li>
          <li>ダメージ計算: タイプ相性・性格・努力値・特性（一部）・持ち物・天候・フィールド・テラスタル・急所・乱数16段階</li>
          <li>準速 = 性格補正なし・努力値252・個体値31 ／ 最速 = +素早さ性格・努力値252・個体値31 (Lv50)</li>
          <li>検索欄はひらがな入力可（例: <code className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded">め</code> → メ始まり全件）</li>
        </ul>
      </section>
    </div>
  );
}

function FeatureCard({
  href, title, desc, icon, accent,
}: {
  href: string; title: string; desc: string; icon: string; accent: string;
}) {
  return (
    <Link href={href} className="card card-hover block p-4 relative overflow-hidden">
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="font-bold mb-1 text-base">{title}</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">{desc}</div>
      </div>
    </Link>
  );
}

function FeaturedSprite({ dex }: { dex: number }) {
  const url = officialArtwork(dex);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className="w-20 h-20 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-200"
    />
  );
}

function PokeballSilhouette() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="currentColor" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="3" />
      <path d="M4 50 H96" stroke="white" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="white" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  );
}
