"use client";

interface Props {
  defenderHp: number;        // max HP
  currentHpPct?: number;     // 1..100 — current HP as % of max (default 100)
  minDamage: number;
  maxDamage: number;
  rolls: number[];
}

export function DamageGauge({ defenderHp, currentHpPct = 100, minDamage, maxDamage, rolls }: Props) {
  const currentHp = Math.max(1, Math.round(defenderHp * (currentHpPct / 100)));
  const minPctOfMax = Math.min(100, (minDamage / defenderHp) * 100);
  const maxPctOfMax = Math.min(100, (maxDamage / defenderHp) * 100);
  // count rolls that would KO from current HP
  const koCount = rolls.filter((r) => r >= currentHp).length;
  const koPct = (koCount / rolls.length) * 100;

  // Compute geometry on the full HP bar
  // x-axis: 0% (left = empty) ... 100% (right = full HP)
  // Already-lost region: 0..(100 - currentHpPct)
  const lostPct = 100 - currentHpPct;
  // Damage band: starts at currentHp - maxDmg (clamped to 0), ends at currentHp - minDmg.
  // In % of max HP coordinates:
  const dmgRightPct = currentHpPct - minPctOfMax; // higher end of remaining HP after min dmg
  const dmgLeftPct = Math.max(0, currentHpPct - maxPctOfMax);

  return (
    <div className="space-y-2">
      <div className="relative h-8 rounded-md overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
        {/* full HP bar background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-yellow-400 to-emerald-400 opacity-25" />
        {/* already-lost portion (gray) */}
        {lostPct > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 bg-neutral-500/60"
            style={{ width: `${lostPct}%` }}
          />
        )}
        {/* damage band (will deplete this much) */}
        <div
          className="absolute top-0 bottom-0 bg-rose-500/80"
          style={{
            left: `${dmgLeftPct}%`,
            width: `${Math.max(0, dmgRightPct - dmgLeftPct)}%`,
          }}
        />
        {/* current HP marker line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]"
          style={{ left: `${currentHpPct}%` }}
        />
        {/* HP percentage labels */}
        <div className="relative h-full flex items-center justify-between px-2 text-xs font-bold text-white drop-shadow">
          <span>0</span>
          <span>HP {defenderHp}</span>
        </div>
      </div>
      <div className="text-xs flex justify-between text-neutral-600 dark:text-neutral-400">
        <span>
          現状: {currentHp} / {defenderHp} ({currentHpPct}%)
        </span>
        <span>
          削り: {minPctOfMax.toFixed(1)}% 〜 {maxPctOfMax.toFixed(1)}% (最大HP比)
        </span>
      </div>
      {koCount > 0 && (
        <div className="text-xs">
          KO確率 (現状HP {currentHpPct}% から):{" "}
          <span className="font-bold">
            {koCount === rolls.length
              ? "100% (確定)"
              : `${koPct.toFixed(1)}% (${koCount}/${rolls.length} 乱数)`}
          </span>
        </div>
      )}
    </div>
  );
}
