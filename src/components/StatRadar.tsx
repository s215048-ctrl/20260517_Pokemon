"use client";

import { StatKey } from "@/data/natures";

interface Props {
  stats: Record<StatKey, number>;
  max?: number;
  size?: number;
}

const ORDER: StatKey[] = ["hp", "atk", "def", "spe", "spd", "spa"];
const LABELS: Record<StatKey, string> = {
  hp: "HP", atk: "攻撃", def: "防御", spa: "特攻", spd: "特防", spe: "素早",
};

export function StatRadar({ stats, max = 200, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;

  function point(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (Math.min(value, max) / max) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  }

  function labelPoint(index: number) {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = radius + 22;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  }

  function gridPolygon(scale: number) {
    return ORDER.map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = scale * radius;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    }).join(" ");
  }

  const polygon = ORDER.map((k, i) => {
    const [x, y] = point(i, stats[k]);
    return `${x},${y}`;
  }).join(" ");

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* concentric grid */}
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <polygon key={s} points={gridPolygon(s)} fill="none" stroke="currentColor" strokeOpacity={0.12} />
        ))}
        {/* axes */}
        {ORDER.map((_, i) => {
          const [x, y] = point(i, max);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.12} />;
        })}
        {/* polygon */}
        <polygon
          points={polygon}
          fill="url(#statGrad)"
          stroke="#dc2626"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* vertex dots */}
        {ORDER.map((k, i) => {
          const [x, y] = point(i, stats[k]);
          return <circle key={k} cx={x} cy={y} r={3} fill="#dc2626" />;
        })}
        <defs>
          <linearGradient id="statGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* labels */}
        {ORDER.map((k, i) => {
          const [x, y] = labelPoint(i);
          return (
            <g key={k}>
              <text x={x} y={y - 6} textAnchor="middle" fontSize={11} className="fill-neutral-500">
                {LABELS[k]}
              </text>
              <text
                x={x}
                y={y + 8}
                textAnchor="middle"
                fontSize={14}
                fontWeight="700"
                className="fill-neutral-900 dark:fill-neutral-100"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stats[k]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-xs text-neutral-500 -mt-1">
        合計 <span className="font-mono font-bold text-base text-neutral-800 dark:text-neutral-100">{total}</span>
      </div>
    </div>
  );
}
