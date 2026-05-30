import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
  const exerciseName = req.nextUrl.searchParams.get("exerciseName");

  if (!exerciseName) {
    return NextResponse.json({ error: "exerciseName required" }, { status: 400 });
  }

  const sets = await prisma.exerciseSet.findMany({
    where: {
      exerciseName,
      completed: true,
      session: { userId },
    },
    include: {
      session: {
        select: {
          date: true,
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const sessionsMap = new Map<string, {
    date: string;
    templateName: string;
    sets: { setNumber: number; weight: number; reps: number; rpe: number | null }[];
  }>();

  for (const s of sets) {
    const key = s.sessionId;
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, {
        date: s.session.date.toISOString(),
        templateName: s.session.template.name,
        sets: [],
      });
    }
    sessionsMap.get(key)!.sets.push({
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
    });
  }

  const history = Array.from(sessionsMap.values());

  const allExercises = await prisma.exerciseSet.findMany({
    where: { completed: true, session: { userId } },
    select: { exerciseName: true },
    distinct: ["exerciseName"],
    orderBy: { exerciseName: "asc" },
  });

  return NextResponse.json({
    exerciseName,
    history,
    allExercises: allExercises.map((e) => e.exerciseName),
  });
}
