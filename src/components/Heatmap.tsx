"use client";

import { useMemo } from "react";

interface Props {
  sessions: { date: string; volume: number }[];
  months?: number;
}

const LEVEL_CLASSES = [
  "bg-zinc-800/60",
  "bg-volt/20",
  "bg-volt/40",
  "bg-volt/60",
  "bg-volt",
];

export default function Heatmap({ sessions, months = 4 }: Props) {
  const weeks = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setMonth(start.getMonth() - months);
    // Align to Monday
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const volumeMap = new Map<string, number>();
    for (const s of sessions) {
      const key = new Date(s.date).toDateString();
      volumeMap.set(key, (volumeMap.get(key) || 0) + s.volume);
    }
    const maxVolume = Math.max(1, ...volumeMap.values());

    const result: ({ date: Date; volume: number; level: number } | null)[][] = [];
    let week: ({ date: Date; volume: number; level: number } | null)[] = [];
    const cur = new Date(start);

    while (cur <= end || week.length % 7 !== 0) {
      if (cur <= end) {
        const vol = volumeMap.get(cur.toDateString()) || 0;
        week.push({ date: new Date(cur), volume: vol, level: vol === 0 ? 0 : Math.ceil((vol / maxVolume) * 4) });
      } else {
        week.push(null); // pad final week
      }
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [sessions, months]);

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="overflow-x-auto -mx-1 pb-1">
      <div className="flex gap-[3px] min-w-fit justify-center">
        <div className="flex flex-col gap-[3px] mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-6 h-3 flex items-center">
              <span className="text-[8px] text-zinc-600 leading-none">{label}</span>
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) =>
              cell ? (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-[3px] ${LEVEL_CLASSES[cell.level]}`}
                  title={`${cell.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${cell.volume.toLocaleString()}kg`}
                />
              ) : (
                <div key={di} className="w-3 h-3" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
