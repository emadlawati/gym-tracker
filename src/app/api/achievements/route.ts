import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAchievementDefs } from "@/lib/game";

export async function GET() {
  const allDefs = getAchievementDefs();
  const unlocked = await prisma.achievement.findMany({
    where: { unlockedAt: { not: null } },
  });

  const achievements = allDefs.map((def) => {
    const record = unlocked.find((a) => a.key === def.key);
    return {
      ...def,
      unlocked: !!record,
      unlockedAt: record?.unlockedAt || null,
    };
  });

  return NextResponse.json(achievements);
}

export async function POST() {
  return NextResponse.json({});
}
