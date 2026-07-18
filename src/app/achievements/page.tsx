"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AchievementCard from "@/components/AchievementCard";

interface Achievement {
  key: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond" | "ruby";
  icon: string;
  category: string;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  neededDescription: string;
}

const categoryLabels: Record<string, string> = {
  strength: "Strength",
  plates: "Plates",
  clubs: "Clubs",
  consistency: "Consistency",
  volume: "Volume",
  mastery: "Mastery",
  xp: "XP",
  hidden: "Hidden",
};

function AchievementsContent() {
  const searchParams = useSearchParams();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(searchParams.get("filter") || "all");

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      });
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const filtered = filter === "all" ? achievements : filter === "unlocked" ? unlocked : achievements.filter((a) => a.category === filter);

  const categories = [...new Set(achievements.map((a) => a.category))].filter((c) => c !== "hidden");

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Achievements</h1>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${filter === "all" ? "bg-volt text-volt-ink" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          All ({achievements.length})
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${filter === "unlocked" ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Unlocked ({unlocked.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${filter === cat ? "bg-volt text-volt-ink" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {!loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-white font-medium tabular-nums">{unlocked.length}/{achievements.length} unlocked</span>
          <div className="h-1.5 flex-1 mx-3 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-volt to-amber-400 rounded-full transition-all" style={{ width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%` }} />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums">{achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0}%</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((a) => {
            const { key, ...rest } = a;
            return <AchievementCard key={key} {...rest} />;
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No achievements in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 pt-4 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-40" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-28" />
          ))}
        </div>
      </div>
    }>
      <AchievementsContent />
    </Suspense>
  );
}
