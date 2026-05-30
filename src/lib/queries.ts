import { prisma } from "@/lib/prisma";

export async function getExerciseBests(userId: string) {
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

export async function getExerciseBestsExcluding(userId: string, sessionId: string) {
  const sets = await prisma.exerciseSet.findMany({
    where: { completed: true, weight: { gt: 0 }, session: { userId }, sessionId: { not: sessionId } },
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

export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.userProfile.create({ data: { userId } });
  }
  return profile;
}
