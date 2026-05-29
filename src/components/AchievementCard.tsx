"use client";

interface Props {
  icon: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond" | "ruby";
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number;
  neededDescription?: string;
}

const tierColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-600",
  silver: "from-zinc-400 to-zinc-300",
  gold: "from-yellow-500 to-yellow-400",
  diamond: "from-cyan-400 to-indigo-400",
  ruby: "from-red-500 to-pink-400",
};

const tierBg: Record<string, string> = {
  bronze: "bg-amber-900/30 border-amber-700/30",
  silver: "bg-zinc-800/20 border-zinc-500/30",
  gold: "bg-yellow-900/20 border-yellow-500/30",
  diamond: "bg-cyan-900/20 border-cyan-500/30",
  ruby: "bg-red-900/20 border-red-500/30",
};

const tierText: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-zinc-400",
  gold: "text-yellow-500",
  diamond: "text-cyan-400",
  ruby: "text-red-400",
};

export default function AchievementCard(props: Props) {
  const { icon, title, description, tier, unlocked, unlockedAt, progress = 0, neededDescription = "" } = props;
  const pct = Math.round(progress);

  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-4 transition-all ${
        unlocked ? tierBg[tier] : "border-zinc-800 opacity-80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
            unlocked ? `bg-gradient-to-br ${tierColors[tier]}` : "bg-zinc-800"
          }`}
        >
          {unlocked ? icon : "🔒"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${unlocked ? "text-white" : "text-zinc-500"}`}>
              {title}
            </h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${tierText[tier]}`}>
              {tier}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${unlocked ? "text-zinc-400" : "text-zinc-600"}`}>
            {description}
          </p>

          {!unlocked && progress > 0 && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-600">{pct}%</span>
                <span className="text-[10px] text-zinc-500">{neededDescription}</span>
              </div>
            </div>
          )}

          {unlocked && unlockedAt && (
            <p className="text-[10px] text-zinc-600 mt-1">
              {new Date(unlockedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
