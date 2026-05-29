"use client";

import { useMemo } from "react";

interface Props {
  sessions: { date: string; volume: number }[];
  months?: number;
}

export default function Heatmap({ sessions, months = 4 }: Props) {
  const cells = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    const volumeMap = new Map<string, number>();
    for (const s of sessions) {
      const key = new Date(s.date).toDateString();
      volumeMap.set(key, (volumeMap.get(key) || 0) + s.volume);
    }

    const maxVolume = Math.max(1, ...Array.from(volumeMap.values()));

    const rows: { date: Date; volume: number; level: number }[][] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 && rows.length > 0) {
        // new week
      }
      const weekIdx = Math.floor(
        (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / 7
      );
      if (!rows[weekIdx]) rows[weekIdx] = [];
      const key = current.toDateString();
      const vol = volumeMap.get(key) || 0;
      rows[weekIdx].push({
        date: new Date(current),
        volume: vol,
        level: vol === 0 ? 0 : Math.ceil((vol / maxVolume) * 4),
      });
      current.setDate(current.getDate() + 1);
    }

    return rows.filter((r) => r && r.length > 0);
  }, [sessions, months]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const getColor = (level: number) => {
    switch (level) {
      case 0: return "bg-zinc-800/50";
      case 1: return "bg-indigo-900/60";
      case 2: return "bg-indigo-700/70";
      case 3: return "bg-indigo-500/80";
      case 4: return "bg-indigo-400";
      default: return "bg-zinc-800/50";
    }
  };

  return (
    <div className="overflow-x-auto -mx-1 pb-1">
      <div className="flex gap-1 min-w-fit justify-center">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-5 h-3 flex items-center">
              <span className="text-[8px] text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
        {cells.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, di) => {
              const cell = week.find((c) => c.date.getDay() === (di + 1) % 7 || (di === 6 ? 0 : di + 1));
              if (!cell) {
                return <div key={di} className="w-3 h-3 rounded-sm bg-transparent" />;
              }
              return (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${getColor(cell.level)}`}
                  title={`${cell.date.toDateString()}: ${cell.volume.toLocaleString()}kg`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
