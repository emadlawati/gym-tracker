import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getLevel, getLevelName, calculateSessionXP,
  checkAllAchievements, getAllAchievementDefs, getIdentityTitle,
} from "@/lib/game";
import { getExerciseBests, getExerciseBestsExcluding, getOrCreateProfile } from "@/lib/queries";

function getUserId(req: NextRequest): string {
  return req.cookies.get("gym_user_id")?.value || "user_imad";
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const profile = await getOrCreateProfile(userId);
    const level = getLevel(profile.currentXP);
    const bodyweightEntry = await prisma.bodyWeight.findFirst({ where: { userId }, orderBy: { date: "desc" } });
    const bodyweight = bodyweightEntry?.weight || null;

    const achievements = await prisma.achievement.findMany({ where: { userId } });
    const achievementCount = achievements.filter((a) => a.unlockedAt).length;

    const identity = getIdentityTitle({ totalSessions: profile.totalSessions, bestStreak: profile.bestStreak, level: level.level, achievementCount });

    return NextResponse.json({
      ...profile,
      level: level.level,
      levelName: getLevelName(level.level),
      currentLevelXP: level.currentLevelXP,
      nextLevelXP: level.nextLevelXP,
      bodyweight, identity, achievements,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.workoutSession.findFirst({
        where: { id: sessionId, userId, completed: true, xpAwarded: false },
        include: { exerciseSets: true },
      });

      if (!session) {
        const existing = await tx.workoutSession.findFirst({ where: { id: sessionId, userId } });
        if (!existing || !existing.completed) throw new Error("Session not found or not completed");
        throw new Error("XP already awarded");
      }

      const profile = await getOrCreateProfile(userId);
      const nonSessionBests = await getExerciseBestsExcluding(userId, sessionId);

      const { xp, newRepPRs, newWeightPRs, volume } = calculateSessionXP(
        session.exerciseSets.map((s) => ({
          exerciseName: s.exerciseName, weight: s.weight, reps: s.reps, completed: s.completed,
        })),
        nonSessionBests
      );

      const totalPRs = newWeightPRs + newRepPRs;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let newStreak = 1;
      if (profile.lastWorkoutDate) {
        const last = new Date(profile.lastWorkoutDate);
        last.setHours(0, 0, 0, 0);
        const diff = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) newStreak = (profile.currentStreak || 0) + 1;
        else if (diff === 0) newStreak = profile.currentStreak || 1;
      }

      const bestStreak = Math.max(newStreak, profile.bestStreak || 0);

      await tx.userProfile.upsert({
        where: { userId },
        create: { userId, currentXP: xp, lifetimeVolume: volume, totalSessions: 1, totalPRs, currentStreak: newStreak, bestStreak, lastWorkoutDate: today },
        update: { currentXP: { increment: xp }, lifetimeVolume: { increment: volume }, totalSessions: { increment: 1 }, totalPRs: { increment: totalPRs }, currentStreak: newStreak, bestStreak, lastWorkoutDate: today },
      });

      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { xpEarned: xp, xpAwarded: true },
      });

      return { xp, volume, totalPRs, newWeightPRs, newRepPRs, newStreak, updatedProfile: profile };
    });

    const updatedProfile = await prisma.userProfile.findUnique({ where: { userId } }) || await getOrCreateProfile(userId);

    const bodyweightEntry = await prisma.bodyWeight.findFirst({ where: { userId }, orderBy: { date: "desc" } });
    const bodyweight = bodyweightEntry?.weight || null;
    const exerciseBests = await getExerciseBests(userId);
    const uniqueExSets = await prisma.exerciseSet.findMany({
    where: { completed: true, session: { userId } },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
  });
  const uniqueEx = uniqueExSets.length;
    const totalSetsAll = await prisma.exerciseSet.count({ where: { completed: true, session: { userId } } });
    const rpe10 = await prisma.exerciseSet.count({ where: { completed: true, session: { userId }, rpe: 10 } });

    const level = getLevel(updatedProfile.currentXP);

    const evalProfile = {
      bodyweight, exerciseBests,
      totalSessions: updatedProfile.totalSessions,
      totalPRs: updatedProfile.totalPRs,
      lifetimeVolume: updatedProfile.lifetimeVolume,
      currentStreak: updatedProfile.currentStreak,
      bestStreak: updatedProfile.bestStreak,
      totalXP: updatedProfile.currentXP,
      level: level.level,
      uniqueExercises: uniqueEx,
      totalSets: totalSetsAll,
      rpe10Sets: rpe10,
      completedAllTemplatesIn4Days: false,
      completedAllTemplatesIn7Days: false,
      sessionsWith5plusPRs: result.totalPRs >= 5 ? 1 : 0,
    };

    const results = checkAllAchievements(evalProfile);
    const unlockedAchievements: { icon: string; title: string }[] = [];

    for (const r of results) {
      if (!r.unlocked) continue;
      const existing = await prisma.achievement.findUnique({ where: { userId_key: { userId, key: r.key } } });
      if (existing?.unlockedAt) continue;

      const def = getAllAchievementDefs().find((d) => d.key === r.key);
      if (!def) continue;

      await prisma.achievement.upsert({
        where: { userId_key: { userId, key: r.key } },
        create: { userId, key: r.key, tier: def.tier, unlockedAt: new Date(), progress: 100 },
        update: { unlockedAt: existing?.unlockedAt || new Date(), progress: 100, tier: def.tier },
      });

      unlockedAchievements.push({ icon: def.icon, title: def.title });
    }

    return NextResponse.json({
      xp: result.xp, volume: result.volume,
      newRepPRs: result.newRepPRs, newWeightPRs: result.newWeightPRs,
      newStreak: result.newStreak,
      level: level.level, levelName: getLevelName(level.level),
      totalXP: updatedProfile.currentXP,
      newAchievements: unlockedAchievements,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "XP already awarded") {
      return NextResponse.json({ error: "XP already awarded" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Session not found or not completed") {
      return NextResponse.json({ error: "Session not found or not completed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to process workout completion" }, { status: 500 });
  }
}
