"use client";

interface Props {
  muscleVolumes: Record<string, number>;
}

interface Region {
  key: string;
  side: "front" | "back";
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}

const REGIONS: Region[] = [
  { key: "Shoulders", side: "front", x: 17, y: 36, w: 14, h: 12, rx: 6 },
  { key: "Shoulders", side: "front", x: 69, y: 36, w: 14, h: 12, rx: 6 },
  { key: "Chest", side: "front", x: 33, y: 38, w: 15, h: 18, rx: 4 },
  { key: "Chest", side: "front", x: 52, y: 38, w: 15, h: 18, rx: 4 },
  { key: "Biceps", side: "front", x: 15, y: 52, w: 11, h: 24, rx: 5 },
  { key: "Biceps", side: "front", x: 74, y: 52, w: 11, h: 24, rx: 5 },
  { key: "Forearms", side: "front", x: 14, y: 80, w: 10, h: 24, rx: 5 },
  { key: "Forearms", side: "front", x: 76, y: 80, w: 10, h: 24, rx: 5 },
  { key: "Abs", side: "front", x: 38, y: 62, w: 24, h: 36, rx: 6 },
  { key: "Quads", side: "front", x: 33, y: 110, w: 15, h: 34, rx: 6 },
  { key: "Quads", side: "front", x: 52, y: 110, w: 15, h: 34, rx: 6 },
  { key: "Calves", side: "front", x: 34, y: 150, w: 13, h: 28, rx: 6 },
  { key: "Calves", side: "front", x: 53, y: 150, w: 13, h: 28, rx: 6 },
  { key: "Traps", side: "back", x: 36, y: 30, w: 28, h: 16, rx: 6 },
  { key: "Shoulders", side: "back", x: 17, y: 36, w: 14, h: 12, rx: 6 },
  { key: "Shoulders", side: "back", x: 69, y: 36, w: 14, h: 12, rx: 6 },
  { key: "Back", side: "back", x: 33, y: 48, w: 34, h: 38, rx: 8 },
  { key: "Triceps", side: "back", x: 15, y: 52, w: 11, h: 24, rx: 5 },
  { key: "Triceps", side: "back", x: 74, y: 52, w: 11, h: 24, rx: 5 },
  { key: "Forearms", side: "back", x: 14, y: 80, w: 10, h: 24, rx: 5 },
  { key: "Forearms", side: "back", x: 76, y: 80, w: 10, h: 24, rx: 5 },
  { key: "Glutes", side: "back", x: 33, y: 90, w: 34, h: 20, rx: 8 },
  { key: "Hamstrings", side: "back", x: 33, y: 114, w: 15, h: 32, rx: 6 },
  { key: "Hamstrings", side: "back", x: 52, y: 114, w: 15, h: 32, rx: 6 },
  { key: "Calves", side: "back", x: 34, y: 150, w: 13, h: 28, rx: 6 },
  { key: "Calves", side: "back", x: 53, y: 150, w: 13, h: 28, rx: 6 },
];

const LEGEND = ["Chest", "Back", "Shoulders", "Traps", "Biceps", "Triceps", "Forearms", "Abs", "Glutes", "Quads", "Hamstrings", "Calves"];

function Silhouette() {
  return (
    <g className="fill-zinc-800/50">
      <circle cx="50" cy="16" r="10" />
      <rect x="30" y="28" width="40" height="78" rx="14" />
      <rect x="12" y="32" width="14" height="76" rx="7" />
      <rect x="74" y="32" width="14" height="76" rx="7" />
      <rect x="31" y="106" width="17" height="76" rx="8" />
      <rect x="52" y="106" width="17" height="76" rx="8" />
    </g>
  );
}

export default function MuscleHeatmap({ muscleVolumes }: Props) {
  const maxVol = Math.max(1, ...Object.values(muscleVolumes));

  const getOpacity = (key: string) => {
    const vol = muscleVolumes[key] || 0;
    if (vol === 0) return 0;
    return 0.2 + (vol / maxVol) * 0.8;
  };

  const renderSide = (side: "front" | "back") => (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{side}</span>
      <svg viewBox="0 0 100 190" className="w-full max-w-[110px]" role="img" aria-label={`${side} muscle coverage`}>
        <Silhouette />
        {REGIONS.filter((r) => r.side === side).map((r, i) => {
          const op = getOpacity(r.key);
          if (op === 0) return null;
          return (
            <rect
              key={`${r.key}-${i}`}
              x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 4}
              className="fill-volt transition-opacity duration-500"
              opacity={op}
            >
              <title>{`${r.key}: ${(muscleVolumes[r.key] || 0).toLocaleString()}kg this week`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Muscle Coverage This Week</h3>
      <div className="flex gap-4">
        {renderSide("front")}
        {renderSide("back")}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {LEGEND.map((key) => {
          const vol = muscleVolumes[key] || 0;
          return (
            <span key={key} className={`text-[10px] tabular-nums ${vol > 0 ? "text-volt" : "text-zinc-600"}`}>
              {key}{vol > 0 && <span className="text-zinc-500"> {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol}kg</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
