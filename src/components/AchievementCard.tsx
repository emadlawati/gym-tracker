"use client";

interface Props {
  icon: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  unlocked: boolean;
  unlockedAt?: string | null;
}

const tierColors = {
  bronze: "from-amber-700 to-amber-600",
  silver: "from-zinc-400 to-zinc-300",
  gold: "from-yellow-500 to-yellow-400",
  diamond: "from-cyan-400 to-indigo-400",
};

const tierBorders = {
  bronze: "border-amber-700/50",
  silver: "border-zinc-500/50",
  gold: "border-yellow-500/50",
  diamond: "border-cyan-500/50",
};

export default function AchievementCard({ icon, title, description, tier, unlocked, unlockedAt }: Props) {
  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-4 transition-all ${
        unlocked ? tierBorders[tier] : "border-zinc-800 opacity-60"
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
        <div className="min-w-0">
          <h3 className={`text-sm font-semibold ${unlocked ? "text-white" : "text-zinc-500"}`}>
            {unlocked ? title : "???"}
          </h3>
          <p className={`text-xs mt-0.5 ${unlocked ? "text-zinc-400" : "text-zinc-600"}`}>
            {unlocked ? description : "Keep grinding to unlock"}
          </p>
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
        <span
          className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${
            tier === "bronze"
              ? "text-amber-600"
              : tier === "silver"
              ? "text-zinc-400"
              : tier === "gold"
              ? "text-yellow-500"
              : "text-cyan-400"
          }`}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}
