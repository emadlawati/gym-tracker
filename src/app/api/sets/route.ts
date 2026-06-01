import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { sessionId, exerciseName, setNumber } = await req.json();

    if (!sessionId || !exerciseName) {
      return NextResponse.json({ error: "sessionId and exerciseName required" }, { status: 400 });
    }

    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const exerciseSet = await prisma.exerciseSet.create({
      data: { sessionId, exerciseName, setNumber: setNumber || 1 },
    });

    return NextResponse.json(exerciseSet);
  } catch {
    return NextResponse.json({ error: "Failed to create set" }, { status: 500 });
  }
}
