import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const exerciseName = req.nextUrl.searchParams.get("exerciseName");
  const sessionId = req.nextUrl.searchParams.get("excludeSessionId");

  if (!exerciseName) {
    return NextResponse.json({ error: "exerciseName required" }, { status: 400 });
  }

  const previousSet = await prisma.exerciseSet.findFirst({
    where: {
      exerciseName,
      completed: true,
      session: { userId },
      ...(sessionId ? { sessionId: { not: sessionId } } : {}),
    },
    include: {
      session: {
        select: {
          date: true,
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!previousSet) return NextResponse.json(null);

  const sameSessionSets = await prisma.exerciseSet.findMany({
    where: {
      sessionId: previousSet.sessionId,
      exerciseName,
    },
    orderBy: { setNumber: "asc" },
  });

  return NextResponse.json({
    date: previousSet.session.date,
    templateName: previousSet.session.template.name,
    sets: sameSessionSets.map((s) => ({
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
    })),
  });
}
