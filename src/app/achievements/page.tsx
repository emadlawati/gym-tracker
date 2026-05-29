"use client";

import { useState, useEffect } from "react";
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

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

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
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter === "all" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          All ({achievements.length})
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter === "unlocked" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Unlocked ({unlocked.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter === cat ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const { key, ...rest } = a;
            return <AchievementCard key={key} {...rest} />;
          })}
          {filtered.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No achievements in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
