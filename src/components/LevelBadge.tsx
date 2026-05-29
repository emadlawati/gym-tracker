"use client";

import { getLevelName } from "@/lib/game";

interface Props {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
}

export default function LevelBadge({ totalXP, level, currentLevelXP, nextLevelXP }: Props) {
  const name = getLevelName(level);
  const progress = nextLevelXP > 0 ? Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100)) : 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            {name}
          </p>
          <p className="text-2xl font-bold text-white mt-0.5">Lv. {level}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">XP</p>
          <p className="text-lg font-bold text-indigo-400">{totalXP.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
          <span>{currentLevelXP.toLocaleString()} XP</span>
          <span>{nextLevelXP.toLocaleString()} XP</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-500 text-right mt-1">
          {nextLevelXP - currentLevelXP} XP to Lv. {level + 1}
        </p>
      </div>
    </div>
  );
}
