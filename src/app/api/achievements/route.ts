import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllAchievementDefs, checkAllAchievements } from "@/lib/game";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";

  const bodyweightEntry = await prisma.bodyWeight.findFirst({ where: { userId }, orderBy: { date: "desc" } });
  const bodyweight = bodyweightEntry?.weight || null;

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const exerciseBests = await getExerciseBests(userId);
  const uniqueExercises = await prisma.exerciseSet.findMany({
    where: { completed: true, session: { userId } },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
  });
  const totalSets = await prisma.exerciseSet.count({ where: { completed: true, session: { userId } } });
  const rpe10Sets = await prisma.exerciseSet.count({ where: { completed: true, session: { userId }, rpe: { gte: 10 } } });

  const { getLevel } = await import("@/lib/game");
  const level = getLevel(profile?.currentXP || 0);

  const evalProfile = {
    bodyweight,
    exerciseBests,
    totalSessions: profile?.totalSessions || 0,
    totalPRs: profile?.totalPRs || 0,
    lifetimeVolume: profile?.lifetimeVolume || 0,
    currentStreak: profile?.currentStreak || 0,
    bestStreak: profile?.bestStreak || 0,
    totalXP: profile?.currentXP || 0,
    level: level.level,
    uniqueExercises: uniqueExercises.length,
    totalSets,
    rpe10Sets,
    completedAllTemplatesIn4Days: false,
    completedAllTemplatesIn7Days: false,
    sessionsWith5plusPRs: 0,
  };

  const results = checkAllAchievements(evalProfile);
  const unlocked = await prisma.achievement.findMany({ where: { userId, unlockedAt: { not: null } } });
  const allDefs = getAllAchievementDefs();

  const achievements = allDefs.map((def) => {
    const record = unlocked.find((a) => a.key === def.key);
    const check = results.find((r) => r.key === def.key);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      tier: def.tier,
      icon: def.icon,
      category: def.category,
      hidden: def.hidden || false,
      unlocked: !!record?.unlockedAt,
      unlockedAt: record?.unlockedAt || null,
      progress: check?.progress || 0,
      neededDescription: check?.neededDescription || "",
    };
  });

  return NextResponse.json(achievements);
}

export async function POST() {
  return NextResponse.json({});
}

async function getExerciseBests(userId: string) {
  const sets = await prisma.exerciseSet.findMany({
    where: { completed: true, weight: { gt: 0 }, session: { userId } },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, typeof sets>();
  for (const s of sets) {
    if (!map.has(s.exerciseName)) map.set(s.exerciseName, []);
    map.get(s.exerciseName)!.push(s);
  }
  return Array.from(map.entries()).map(([name, exSets]) => {
    let bestE1RM = 0, bestWeight = 0, bestReps = 0, bestVolume = 0;
    for (const s of exSets) {
      const e1rm = s.weight * (1 + s.reps / 30);
      if (e1rm > bestE1RM) { bestE1RM = e1rm; bestWeight = s.weight; bestReps = s.reps; }
      const vol = s.weight * s.reps;
      if (vol > bestVolume) bestVolume = vol;
    }
    return { exerciseName: name, bestE1RM, bestWeight, bestReps, bestVolume };
  });
}
