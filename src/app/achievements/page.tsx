"use client";

import { useState, useEffect } from "react";
import AchievementCard from "@/components/AchievementCard";

interface Achievement {
  key: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      });
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold text-white">Achievements</h1>

      <div className="flex gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-lg font-bold text-amber-400">{unlocked.length}</p>
          <p className="text-[10px] text-zinc-500">Unlocked</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-lg font-bold text-zinc-400">{locked.length}</p>
          <p className="text-[10px] text-zinc-500">Locked</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center flex-1">
          <p className="text-lg font-bold text-indigo-400">
            {achievements.length > 0
              ? Math.round((unlocked.length / achievements.length) * 100)
              : 0}
            %
          </p>
          <p className="text-[10px] text-zinc-500">Complete</p>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : (
        <>
          {unlocked.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Unlocked ({unlocked.length})
              </h2>
              <div className="space-y-2">
                {unlocked.map((a) => {
                  const { key, ...rest } = a;
                  return <AchievementCard key={key} {...rest} />;
                })}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 mt-6">
                Locked ({locked.length})
              </h2>
              <div className="space-y-2">
                {locked.map((a) => {
                  const { key, ...rest } = a;
                  return <AchievementCard key={key} {...rest} />;
                })}
              </div>
            </section>
          )}

          {achievements.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">Complete a workout to unlock achievements.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
