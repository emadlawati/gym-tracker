import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getLevel,
  getLevelName,
  calculateSessionXP,
  checkAllAchievements,
  getAllAchievementDefs,
  getIdentityTitle,
} from "@/lib/game";

export async function GET() {
  let profile = await prisma.userProfile.findUnique({ where: { id: "default" } });
  if (!profile) {
    profile = await prisma.userProfile.create({ data: { id: "default" } });
  }

  const level = getLevel(profile.currentXP);

  const bodyweightEntry = await prisma.bodyWeight.findFirst({ orderBy: { date: "desc" } });
  const bodyweight = bodyweightEntry?.weight || null;

  const exerciseBests = await getExerciseBests();

  const uniqueExercises = await prisma.exerciseSet.findMany({
    where: { completed: true },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
  });

  const totalSets = await prisma.exerciseSet.count({ where: { completed: true } });

  const rpe10Sets = await prisma.exerciseSet.count({
    where: { completed: true, rpe: { gte: 10 } },
  });

  const achievements = await prisma.achievement.findMany();
  const achievementCount = achievements.filter((a) => a.unlockedAt).length;

  const evalProfile = {
    bodyweight,
    exerciseBests,
    totalSessions: profile.totalSessions,
    totalPRs: profile.totalPRs,
    lifetimeVolume: profile.lifetimeVolume,
    currentStreak: profile.currentStreak,
    bestStreak: profile.bestStreak,
    totalXP: profile.currentXP,
    level: level.level,
    uniqueExercises: uniqueExercises.length,
    totalSets,
    rpe10Sets,
    completedAllTemplatesIn4Days: false,
    completedAllTemplatesIn7Days: false,
    sessionsWith5plusPRs: 0,
  };

  const results = checkAllAchievements(evalProfile);
  const identity = getIdentityTitle({ totalSessions: profile.totalSessions, bestStreak: profile.bestStreak, level: level.level, achievementCount });

  return NextResponse.json({
    ...profile,
    level: level.level,
    levelName: getLevelName(level.level),
    currentLevelXP: level.currentLevelXP,
    nextLevelXP: level.nextLevelXP,
    bodyweight,
    identity,
    achievements,
    allAchievements: results,
  });
}

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { exerciseSets: true },
  });

  if (!session || !session.completed) {
    return NextResponse.json({ error: "Session not found or not completed" }, { status: 400 });
  }

  if (session.xpEarned) {
    return NextResponse.json({ error: "XP already awarded" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { id: "default" } });
  if (!profile) {
    await prisma.userProfile.create({ data: { id: "default" } });
  }

  const nonSessionBests = await getExerciseBestsExcluding(sessionId);

  const { xp, newRepPRs, newWeightPRs, volume } = calculateSessionXP(
    session.exerciseSets.map((s) => ({
      exerciseName: s.exerciseName,
      weight: s.weight,
      reps: s.reps,
      completed: s.completed,
    })),
    nonSessionBests
  );

  const totalPRs = newWeightPRs + newRepPRs;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let newStreak = 1;
  if (profile?.lastWorkoutDate) {
    const last = new Date(profile.lastWorkoutDate);
    last.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      newStreak = (profile.currentStreak || 0) + 1;
    } else if (diff === 0) {
      newStreak = profile.currentStreak || 1;
    }
  }

  const bestStreak = Math.max(newStreak, profile?.bestStreak || 0);

  const updatedProfile = await prisma.userProfile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      currentXP: xp,
      lifetimeVolume: volume,
      totalSessions: 1,
      totalPRs,
      currentStreak: newStreak,
      bestStreak,
      lastWorkoutDate: today,
    },
    update: {
      currentXP: { increment: xp },
      lifetimeVolume: { increment: volume },
      totalSessions: { increment: 1 },
      totalPRs: { increment: totalPRs },
      currentStreak: newStreak,
      bestStreak,
      lastWorkoutDate: today,
    },
  });

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { xpEarned: xp },
  });

  const bodyweightEntry = await prisma.bodyWeight.findFirst({ orderBy: { date: "desc" } });
  const bodyweight = bodyweightEntry?.weight || null;
  const exerciseBests = await getExerciseBests();
  const uniqueExercises = await prisma.exerciseSet.findMany({
    where: { completed: true },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
  });
  const totalSets = await prisma.exerciseSet.count({ where: { completed: true } });
  const rpe10Sets = await prisma.exerciseSet.count({
    where: { completed: true, rpe: { gte: 10 } },
  });

  const level = getLevel(updatedProfile.currentXP);
  const evalProfile = {
    bodyweight,
    exerciseBests,
    totalSessions: updatedProfile.totalSessions,
    totalPRs: updatedProfile.totalPRs,
    lifetimeVolume: updatedProfile.lifetimeVolume,
    currentStreak: updatedProfile.currentStreak,
    bestStreak: updatedProfile.bestStreak,
    totalXP: updatedProfile.currentXP,
    level: level.level,
    uniqueExercises: uniqueExercises.length,
    totalSets,
    rpe10Sets,
    completedAllTemplatesIn4Days: false,
    completedAllTemplatesIn7Days: false,
    sessionsWith5plusPRs: totalPRs >= 5 ? 1 : 0,
  };

  const results = checkAllAchievements(evalProfile);
  const unlockedAchievements: { icon: string; title: string }[] = [];

  for (const r of results) {
    if (!r.unlocked) continue;
    const existing = await prisma.achievement.findUnique({ where: { key: r.key } });
    if (existing?.unlockedAt) continue;

    const def = getAllAchievementDefs().find((d) => d.key === r.key);
    if (!def) continue;

    await prisma.achievement.upsert({
      where: { key: r.key },
      create: {
        key: r.key,
        tier: def.tier,
        unlockedAt: new Date(),
        progress: 100,
      },
      update: {
        unlockedAt: existing?.unlockedAt || new Date(),
        progress: 100,
        tier: def.tier,
      },
    });

    unlockedAchievements.push({ icon: def.icon, title: def.title });
  }

  return NextResponse.json({
    xp,
    volume,
    newRepPRs,
    newWeightPRs,
    newStreak,
    level: level.level,
    levelName: getLevelName(level.level),
    totalXP: updatedProfile.currentXP,
    newAchievements: unlockedAchievements,
  });
}

async function getExerciseBests(): Promise<{ exerciseName: string; bestE1RM: number; bestWeight: number; bestReps: number; bestVolume: number }[]> {
  const sets = await prisma.exerciseSet.findMany({
    where: { completed: true, weight: { gt: 0 } },
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

async function getExerciseBestsExcluding(sessionId: string) {
  const sets = await prisma.exerciseSet.findMany({
    where: { completed: true, weight: { gt: 0 }, sessionId: { not: sessionId } },
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
