import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevel, calculateSessionXP, checkAchievements, getAchievementDefs, getLevelName } from "@/lib/game";

export async function GET() {
  let profile = await prisma.userProfile.findUnique({ where: { id: "default" } });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { id: "default" },
    });
  }

  const level = getLevel(profile.currentXP);
  const achievements = await prisma.achievement.findMany();

  return NextResponse.json({
    ...profile,
    level: level.level,
    levelName: getLevelName(level.level),
    currentLevelXP: level.currentLevelXP,
    nextLevelXP: level.nextLevelXP,
    achievements,
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
    return NextResponse.json({ error: "XP already awarded for this session" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { id: "default" } });
  if (!profile) {
    await prisma.userProfile.create({ data: { id: "default" } });
  }

  const exerciseNames = [...new Set(session.exerciseSets.map((s) => s.exerciseName))];
  const previousPRs: { exerciseName: string; bestE1RM: number; bestVolume: number }[] = [];

  for (const name of exerciseNames) {
    const prevSets = await prisma.exerciseSet.findMany({
      where: {
        exerciseName: name,
        completed: true,
        sessionId: { not: sessionId },
      },
    });

    let bestE1RM = 0;
    let bestVolume = 0;
    for (const s of prevSets) {
      const e1rm = s.weight * (1 + s.reps / 30);
      if (e1rm > bestE1RM) bestE1RM = e1rm;
      const vol = s.weight * s.reps;
      if (vol > bestVolume) bestVolume = vol;
    }

    previousPRs.push({ exerciseName: name, bestE1RM, bestVolume });
  }

  const { xp, newPRs, volume } = calculateSessionXP(
    session.exerciseSets.map((s) => ({
      exerciseName: s.exerciseName,
      weight: s.weight,
      reps: s.reps,
      completed: s.completed,
    })),
    previousPRs
  );

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
      totalPRs: newPRs,
      currentStreak: newStreak,
      bestStreak,
      lastWorkoutDate: today,
    },
    update: {
      currentXP: { increment: xp },
      lifetimeVolume: { increment: volume },
      totalSessions: { increment: 1 },
      totalPRs: { increment: newPRs },
      currentStreak: newStreak,
      bestStreak,
      lastWorkoutDate: today,
    },
  });

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { xpEarned: xp },
  });

  const level = getLevel(updatedProfile.currentXP);
  const newAchievements = checkAchievements({
    totalSessions: updatedProfile.totalSessions,
    totalPRs: updatedProfile.totalPRs,
    lifetimeVolume: updatedProfile.lifetimeVolume,
    currentStreak: updatedProfile.currentStreak,
    bestStreak: updatedProfile.bestStreak,
    currentXP: updatedProfile.currentXP,
    totalXP: updatedProfile.currentXP,
    level: level.level,
  });

  const unlockedAchievements: string[] = [];
  for (const def of newAchievements) {
    const existing = await prisma.achievement.findUnique({ where: { key: def.key } });
    if (existing && existing.unlockedAt) continue;

    await prisma.achievement.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
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

    unlockedAchievements.push(def.key);
  }

  return NextResponse.json({
    xp,
    volume,
    newPRs,
    newStreak,
    level: level.level,
    levelName: getLevelName(level.level),
    currentLevelXP: level.currentLevelXP,
    nextLevelXP: level.nextLevelXP,
    totalXP: updatedProfile.currentXP,
    newAchievements: unlockedAchievements.map((key) => {
      const def = getAchievementDefs().find((d) => d.key === key)!;
      return def;
    }),
  });
}
