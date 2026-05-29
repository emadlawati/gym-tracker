"use client";

import { useState, useMemo } from "react";
import { getWarmupSets } from "@/lib/utils";

interface Props {
  workingWeight: number;
}

export default function WarmupCalculator({ workingWeight }: Props) {
  const [open, setOpen] = useState(false);

  const warmupSets = useMemo(() => {
    if (workingWeight <= 0) return [];
    return getWarmupSets(workingWeight);
  }, [workingWeight]);

  if (warmupSets.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {open ? "Hide" : "Show"} warm-up sets
      </button>
      {open && (
        <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Warm-up</span>
          </div>
          {warmupSets.map((ws, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 last:border-0 text-xs"
            >
              <span className="text-zinc-400">{ws.percentage}%</span>
              <span className="text-zinc-300 font-medium">{ws.weight}kg x {ws.reps}</span>
              <span className="text-zinc-600">{i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
