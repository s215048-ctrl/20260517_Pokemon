import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ポケモンチャンピオンズ 計算ツール",
  description:
    "ポケモンチャンピオンズ対応の素早さ比較・ダメージ計算ツール。種族値、努力値振り、第9世代準拠のダメージ計算をブラウザだけで完結。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <header className="bg-red-600 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-bold text-lg whitespace-nowrap">
              🔴 ポケチャン計算ツール
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/speed" className="hover:underline">
                素早さ比較
              </Link>
              <Link href="/speed-table" className="hover:underline">
                素早さ一覧表
              </Link>
              <Link href="/damage" className="hover:underline">
                ダメージ計算
              </Link>
              <Link href="/pokemon" className="hover:underline">
                ポケモン一覧
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
        <footer className="border-t mt-6 py-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
          データ提供: <a href="https://pokeapi.co/" className="underline" target="_blank" rel="noreferrer">PokeAPI</a>
          ・ロスターデータ: <a href="https://github.com/otterlyclueless/pokemon-champions-data" className="underline" target="_blank" rel="noreferrer">otterlyclueless/pokemon-champions-data</a>
          ・日本語名: PokeAPI CSVデータ。src/data/roster.ts を編集することで自由に追加・削除可能です。
        </footer>
      </body>
    </html>
  );
}
