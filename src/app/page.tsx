export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRelativeDate, calculateStreak } from "@/lib/utils";
import { getLevel, VOLUME_MILESTONES, getIdentityTitle } from "@/lib/game";
import Heatmap from "@/components/Heatmap";
import LevelBadge from "@/components/LevelBadge";
import MuscleHeatmap from "@/components/MuscleHeatmap";
import { getMuscles } from "@/lib/muscles";
import { getUserId } from "@/lib/cookies";

export default async function DashboardPage() {
  const userId = (await getUserId()) || "user_imad";

  const templates = await prisma.workoutTemplate.findMany({
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const recentSessions = await prisma.workoutSession.findMany({
    where: { userId }, take: 3,
    include: { template: { select: { name: true } }, exerciseSets: true },
    orderBy: { date: "desc" },
  });

  const allCompletedSessions = await prisma.workoutSession.findMany({
    where: { completed: true, userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const streak = calculateStreak(allCompletedSessions.map((s) => s.date));
  const lastSession = recentSessions[0];
  const isNewUser = allCompletedSessions.length === 0;

  const totalWorkouts = await prisma.workoutSession.count({ where: { completed: true, userId } });

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const sessionsThisWeek = await prisma.workoutSession.findMany({
    where: { completed: true, userId, date: { gte: thisWeekStart, lt: thisWeekEnd } },
    include: { exerciseSets: true },
  });
  const workoutsThisWeek = sessionsThisWeek.length;

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const level = getLevel(profile?.currentXP || 0);

  const allAchs = await prisma.achievement.findMany({ where: { userId, unlockedAt: { not: null } } });
  const identity = getIdentityTitle({ totalSessions: profile?.totalSessions || 0, bestStreak: profile?.bestStreak || 0, level: level.level, achievementCount: allAchs.length });

  const heatmapSessions = await prisma.workoutSession.findMany({
    where: { completed: true, userId },
    select: { date: true, exerciseSets: { where: { completed: true } } },
    orderBy: { date: "desc" },
  });
  const heatmapData = heatmapSessions.map((s) => ({ date: s.date.toISOString(), volume: s.exerciseSets.reduce((sum, es) => sum + es.weight * es.reps, 0) }));

  const muscleVolumes: Record<string, number> = {};
  for (const s of sessionsThisWeek) {
    for (const es of s.exerciseSets) {
      if (!es.completed) continue;
      const muscles = getMuscles(es.exerciseName);
      const vol = es.weight * es.reps;
      muscleVolumes[muscles.primary] = (muscleVolumes[muscles.primary] || 0) + vol;
    }
  }

  const lastCompletedSession = await prisma.workoutSession.findFirst({
    where: { userId, completed: true },
    include: { template: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  const nextMilestone = VOLUME_MILESTONES.find((m) => m.kg > (profile?.lifetimeVolume || 0));
  const lv = profile?.lifetimeVolume || 0;

  const latestWeight = await prisma.bodyWeight.findFirst({ where: { userId }, orderBy: { date: "desc" } });

  return (
    <div className="space-y-6">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gym Tracker</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lastSession ? `Last session: ${formatRelativeDate(lastSession.date)}` : isNewUser ? "Let's get started" : "No sessions yet"}
            {(profile?.totalSessions || 0) > 0 && <span className="ml-2 text-[10px] bg-volt/10 border border-volt/20 px-1.5 py-0.5 rounded font-semibold text-volt">{identity}</span>}
          </p>
        </div>
      </header>

      {isNewUser && templates.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">🏋️</div>
          <h2 className="text-lg font-bold text-white">Welcome to Gym Tracker</h2>
          <p className="text-sm text-zinc-400">Track your workouts, chase PRs, and level up.</p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Link href="/workouts" className="w-full py-3 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright transition-all active:scale-[0.98]">
              Set up your workouts →
            </Link>
            <p className="text-xs text-zinc-600">Start by creating a workout template (A/B/C)</p>
          </div>
        </div>
      ) : (
        <>
          {isNewUser && templates.length > 0 && (
            <div className="bg-volt/10 border border-volt/25 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-volt">Ready to start</p>
              <p className="text-xs text-volt/70 mt-1">Pick a workout below and log your first session</p>
            </div>
          )}

          {!isNewUser && (
            <section className="grid grid-cols-3 gap-2">
              <Link href="/history" className="bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-xl p-3 text-center transition-colors">
                <p className="text-xl font-bold text-white tabular-nums">{totalWorkouts}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Workouts</p>
              </Link>
              <Link href="/achievements" className="bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-xl p-3 text-center transition-colors">
                <p className={`text-xl font-bold tabular-nums ${streak > 0 ? "text-amber-400" : "text-white"}`}>{streak}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Streak</p>
              </Link>
              <Link href="/history" className="bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-xl p-3 text-center transition-colors">
                <p className="text-xl font-bold text-volt tabular-nums">{workoutsThisWeek}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">This Week</p>
              </Link>
            </section>
          )}

          {!isNewUser && profile && (
            <LevelBadge totalXP={profile.currentXP || 0} level={level.level} currentLevelXP={level.currentLevelXP} nextLevelXP={level.nextLevelXP} />
          )}

      {!isNewUser && heatmapData.length > 0 && (
        <MuscleHeatmap muscleVolumes={muscleVolumes} />
      )}

      {!isNewUser && heatmapData.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Activity</h3>
              <Heatmap sessions={heatmapData} />
            </section>
          )}

          {lv > 0 && nextMilestone && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Lifetime Volume</p>
                <span className="text-[10px] text-zinc-600 tabular-nums">{lv.toLocaleString()}kg</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-volt to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((lv / nextMilestone.kg) * 100))}%` }} />
              </div>
              <p className="text-[10px] text-zinc-500">Next: {nextMilestone.label} ({Math.min(100, Math.round((lv / nextMilestone.kg) * 100))}%)</p>
            </section>
          )}

          {latestWeight && (
            <Link href="/weight" className="block bg-zinc-900 border border-zinc-800 hover:border-volt/40 rounded-xl p-4 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Body Weight</p>
                <span className="text-xs text-zinc-500 tabular-nums">{latestWeight.weight}kg · {formatRelativeDate(latestWeight.date)}</span>
              </div>
            </Link>
          )}
        </>
      )}

      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Start Workout</h2>
        <div className="grid gap-2">
          <Link
            href="/gym-day"
            className="flex items-center justify-between bg-volt rounded-xl px-5 py-4 transition-all group active:scale-[0.99] shadow-lg shadow-volt/20"
          >
            <div>
              <h3 className="font-bold text-volt-ink">Start Gym Day</h3>
              <p className="text-xs text-volt-ink/70 mt-0.5">Pick exercises by body part as you go</p>
            </div>
            <span className="text-volt-ink text-xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          {lastCompletedSession && (
            <Link
              href={`/session/${lastCompletedSession.templateId || templates[0]?.id}`}
              className="flex items-center justify-between bg-zinc-900 border border-volt/20 hover:border-volt/50 rounded-xl px-5 py-4 transition-all group active:scale-[0.99]"
            >
              <div>
                <h3 className="font-semibold text-volt transition-colors">Repeat Last Workout</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {lastCompletedSession.template?.name || "Workout"} · {new Date(lastCompletedSession.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="text-volt text-lg group-hover:translate-x-1 transition-transform">↻</span>
            </Link>
          )}
          {templates.length === 0 ? (
            <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-500 text-sm">No workout templates yet</p>
              <Link href="/workouts" className="inline-block mt-3 px-5 py-2.5 bg-volt text-volt-ink rounded-xl text-sm font-bold hover:bg-volt-bright transition-all active:scale-[0.98]">Create Workout A</Link>
            </div>
          ) : (
            templates.map((t) => (
              <Link key={t.id} href={`/session/${t.id}`}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-volt/40 active:border-volt/60 rounded-xl px-5 py-4 transition-all group active:scale-[0.99]">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-volt transition-colors">{t.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.exercises.length} exercises · {t.exercises.reduce((sum, e) => sum + e.sets, 0)} sets</p>
                </div>
                <span className="text-volt text-lg group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent</h2>
            <Link href="/history" className="text-[10px] text-volt hover:text-volt-bright">All →</Link>
          </div>
          <div className="space-y-1">
            {recentSessions.map((s) => (
              <Link key={s.id} href={`/history/${s.id}`} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-volt/30 rounded-lg px-4 py-3 transition-colors">
                <div>
                  <span className="text-sm font-medium text-white">{s.templateName || s.template?.name || "Workout"}</span>
                  <span className="text-xs text-zinc-500 ml-2">{formatRelativeDate(s.date)}</span>
                  {s.xpEarned ? <span className="text-[10px] text-volt ml-1">+{s.xpEarned}XP</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {s.completed ? <span className="text-[10px] text-emerald-500">Done</span> : <span className="text-[10px] text-amber-500">Prog</span>}
                  <span className="text-[10px] text-zinc-600 tabular-nums">{s.exerciseSets.filter((es) => es.completed).length}/{s.exerciseSets.length}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
