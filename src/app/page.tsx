import Link from "next/link";
import { UNIQUE_ROSTER } from "@/data/roster";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-red-950 dark:to-yellow-950 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">ポケモンチャンピオンズ 計算ツール</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          素早さ比較 / 種族値・努力値計算 / 第9世代準拠ダメージ計算
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          対応ポケモン: {UNIQUE_ROSTER.length} 体（メガシンカ・リージョン含む）
        </p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FeatureCard
          href="/speed"
          title="素早さ比較"
          desc="2体以上のポケモンを選択し、種族値・努力値・性格・補正込みで実数値を比較"
          icon="⚡"
        />
        <FeatureCard
          href="/speed-table"
          title="素早さ一覧表"
          desc="ロスター全ポケモンの素早さ種族値・無振り・準速・最速の実数値を一覧表示"
          icon="📊"
        />
        <FeatureCard
          href="/damage"
          title="ダメージ計算"
          desc="第9世代準拠。タイプ相性・性格・努力値・特性・持ち物・天候・テラスタル対応"
          icon="💥"
        />
        <FeatureCard
          href="/pokemon"
          title="ポケモン一覧"
          desc="ロスター全ポケモンを一覧表示。個別ページで種族値・覚える技を確認"
          icon="📖"
        />
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-bold mb-2">使い方</h2>
        <ul className="text-sm space-y-1 text-neutral-700 dark:text-neutral-300 list-disc list-inside">
          <li>各ポケモンのデータは <a href="https://pokeapi.co/" className="underline" target="_blank" rel="noreferrer">PokeAPI</a> から取得します（初回読み込みに数秒）。</li>
          <li>取得済みデータはセッション中キャッシュされ、再表示は高速です。</li>
          <li>ダメージ計算は第9世代準拠フル: タイプ相性、特性（一部）、持ち物、天候、フィールド、テラスタル、急所、最小〜最大乱数(85%-100%)。</li>
          <li>準速 = 性格補正なし・努力値252・個体値31／最速 = 性格+補正・努力値252・個体値31（Lv50基準）。</li>
        </ul>
      </section>
    </div>
  );
}

function FeatureCard({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link
      href={href}
      className="block bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:border-red-400 hover:shadow-md transition"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold mb-1">{title}</div>
      <div className="text-xs text-neutral-600 dark:text-neutral-400">{desc}</div>
    </Link>
  );
}
