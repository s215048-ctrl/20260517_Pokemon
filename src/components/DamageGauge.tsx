"use client";

interface Props {
  defenderHp: number;
  minDamage: number;
  maxDamage: number;
  rolls: number[];
}

export function DamageGauge({ defenderHp, minDamage, maxDamage, rolls }: Props) {
  const minPct = Math.min(100, (minDamage / defenderHp) * 100);
  const maxPct = Math.min(100, (maxDamage / defenderHp) * 100);
  // count rolls that would KO
  const koCount = rolls.filter((r) => r >= defenderHp).length;
  const koPct = (koCount / rolls.length) * 100;
  return (
    <div className="space-y-2">
      <div className="relative h-7 rounded-md overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
        {/* full HP bar background = green to amber gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500 opacity-30" />
        {/* damage area: from (100 - maxPct) to (100 - minPct) */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500/80 to-rose-700/80"
          style={{
            left: `${Math.max(0, 100 - maxPct)}%`,
            width: `${Math.min(maxPct, 100) - Math.max(0, 100 - minPct - (100 - maxPct))}%`,
          }}
        />
        {/* exact damage band, more saturated */}
        <div
          className="absolute top-0 bottom-0 bg-rose-600"
          style={{
            left: `${Math.max(0, 100 - maxPct)}%`,
            width: `${Math.min(100, maxPct - minPct)}%`,
            mixBlendMode: "multiply",
          }}
        />
        {/* HP percentage labels */}
        <div className="relative h-full flex items-center justify-between px-2 text-xs font-bold text-white drop-shadow">
          <span>0</span>
          <span>HP {defenderHp}</span>
        </div>
      </div>
      <div className="text-xs flex justify-between text-neutral-600 dark:text-neutral-400">
        <span>残り: {(100 - maxPct).toFixed(0)}% 〜 {(100 - minPct).toFixed(0)}%</span>
        <span>削り: {minPct.toFixed(1)}% 〜 {maxPct.toFixed(1)}%</span>
      </div>
      {koCount > 0 && (
        <div className="text-xs">
          1発KO確率:{" "}
          <span className="font-bold">
            {koCount === rolls.length ? "100% (確定)" : `${koPct.toFixed(1)}% (${koCount}/${rolls.length} 乱数)`}
          </span>
        </div>
      )}
    </div>
  );
}
