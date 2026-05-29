"use client";

interface Props {
  completed: number;
  total: number;
}

export default function ProgressRing({ completed, total }: Props) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = () => {
    if (percent >= 100) return "#34d399";
    if (percent >= 60) return "#818cf8";
    if (percent >= 30) return "#fbbf24";
    return "#52525b";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-zinc-400">{completed}/{total} sets done</p>
        {percent >= 100 && <p className="text-[10px] text-emerald-400 font-medium">Ready to finish!</p>}
      </div>
    </div>
  );
}
