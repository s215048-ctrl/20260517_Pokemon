import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP, JetBrains_Mono, DotGothic16 } from "next/font/google";
import "./globals.css";
import { NavTabs } from "@/components/NavTabs";

const sans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});
const display = DotGothic16({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ポケモンチャンピオンズ計算ツール",
  description:
    "ポケモンチャンピオンズ対応の素早さ比較・ダメージ計算ツール。種族値、努力値振り、第9世代準拠のダメージ計算をブラウザだけで完結。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <div className="pokeball-bg" aria-hidden />
        <header className="sticky top-0 z-30 backdrop-blur-md bg-gradient-to-r from-rose-600/90 via-red-600/90 to-sky-600/90 text-white shadow-lg shadow-red-900/20 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-display text-lg whitespace-nowrap tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
              ポケモンチャンピオンズ計算ツール
            </Link>
            <NavTabs />
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 relative">{children}</main>
        <footer className="border-t border-neutral-200/60 dark:border-neutral-800 mt-6 py-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
          データ提供: <a href="https://pokeapi.co/" className="underline" target="_blank" rel="noreferrer">PokeAPI</a>
          ・ロスターデータ: <a href="https://github.com/otterlyclueless/pokemon-champions-data" className="underline" target="_blank" rel="noreferrer">otterlyclueless/pokemon-champions-data</a>
          ・日本語名: PokeAPI CSVデータ。src/data/roster.ts を編集することで自由に追加・削除可能です。
        </footer>
      </body>
    </html>
  );
}
