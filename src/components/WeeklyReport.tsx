interface Props {
  sessionsThisWeek: number;
  totalVolume: number;
  newPRs: number;
  sessionsPlanned: number;
}

export default function WeeklyReport({ sessionsThisWeek, totalVolume, newPRs, sessionsPlanned }: Props) {
  if (sessionsThisWeek === 0 && newPRs === 0) return null;

  const grade = sessionsPlanned > 0 ? Math.min(100, Math.round((sessionsThisWeek / sessionsPlanned) * 100)) : 0;
  const letter =
    grade >= 100 ? "S" : grade >= 80 ? "A" : grade >= 60 ? "B" : grade >= 40 ? "C" : "D";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">This Week</h3>
        <span
          className={`text-lg font-bold ${
            letter === "S" ? "text-amber-400" : letter === "A" ? "text-emerald-400" : letter === "B" ? "text-blue-400" : "text-zinc-500"
          }`}
        >
          {letter}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-white">{sessionsThisWeek}</p>
          <p className="text-[10px] text-zinc-500">sessions</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{(totalVolume / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-zinc-500">kg lifted</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-400">{newPRs}</p>
          <p className="text-[10px] text-zinc-500">PRs hit</p>
        </div>
      </div>
    </div>
  );
}
