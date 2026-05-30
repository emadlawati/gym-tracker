"use client";

interface Props {
  muscleVolumes: Record<string, number>;
}

export default function MuscleHeatmap({ muscleVolumes }: Props) {
  const groups = [
    { key: "Chest", left: 12, top: 17, w: 20, h: 14 },
    { key: "Shoulders", left: 20, top: 7, w: 26, h: 10 },
    { key: "Triceps", left: 12, top: 32, w: 18, h: 16 },
    { key: "Biceps", left: 16, top: 32, w: 16, h: 14 },
    { key: "Forearms", left: 12, top: 48, w: 18, h: 10 },
    { key: "Back", left: 38, top: 10, w: 22, h: 20 },
    { key: "Abs", left: 30, top: 30, w: 20, h: 12 },
    { key: "Glutes", left: 30, top: 44, w: 20, h: 12 },
    { key: "Quads", left: 28, top: 56, w: 22, h: 18 },
    { key: "Hamstrings", left: 50, top: 56, w: 18, h: 18 },
    { key: "Calves", left: 30, top: 74, w: 20, h: 10 },
    { key: "Traps", left: 22, top: 5, w: 16, h: 6 },
  ];

  const maxVol = Math.max(1, ...Object.values(muscleVolumes));

  const getOpacity = (key: string) => {
    const vol = muscleVolumes[key] || 0;
    if (vol === 0) return 0.05;
    return 0.1 + (vol / maxVol) * 0.9;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Muscle Coverage This Week</h3>
      <div className="relative w-full" style={{ paddingBottom: "85%" }}>
        <div className="absolute inset-0 flex flex-col items-center">
          <span className="text-zinc-500 text-[10px] mb-1">Front</span>
          <div className="relative w-[75px] h-[190px] border border-zinc-700/50 rounded-lg bg-zinc-950/50 overflow-hidden">
            {/* Neck/Head */}
            <div className="absolute left-[40%] w-[20%] h-[6%] top-[1%] rounded-full bg-zinc-700/20" />
            {/* Body outline */}
            {groups.filter((g) => ["Chest", "Shoulders", "Triceps", "Biceps", "Forearms", "Abs", "Quads", "Calves"].includes(g.key)).map((g) => (
              <div
                key={g.key}
                className="absolute rounded transition-all duration-500"
                style={{
                  left: `${g.left}%`, top: `${g.top}%`,
                  width: `${g.w}%`, height: `${g.h}%`,
                  backgroundColor: `rgba(99, 102, 241, ${getOpacity(g.key)})`,
                  border: `1px solid rgba(99, 102, 241, ${getOpacity(g.key) * 0.5})`,
                }}
                title={`${g.key}: ${muscleVolumes[g.key] || 0}kg`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {groups.map((g) => {
          const vol = muscleVolumes[g.key] || 0;
          return (
            <span key={g.key} className={`text-[10px] ${vol > 0 ? "text-indigo-400" : "text-zinc-700"}`}>
              {g.key}
            </span>
          );
        })}
      </div>
    </div>
  );
}
