import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const sessions = await prisma.workoutSession.findMany({
      where: { userId },
      include: {
        template: { select: { name: true } },
        _count: { select: { exerciseSets: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const { templateId, notes, freestyle } = await req.json();

    // Freestyle "Gym Day" session: no template, exercises are added on the fly.
    // Idempotent — resume the in-progress Gym Day if one exists rather than
    // spawning duplicates (guards against Strict Mode double-mounts / revisits).
    if (freestyle) {
      const existing = await prisma.workoutSession.findFirst({
        where: { userId, templateName: "Gym Day", completed: false },
        orderBy: { date: "desc" },
        include: { exerciseSets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] } },
      });
      if (existing) return NextResponse.json(existing);

      const session = await prisma.workoutSession.create({
        data: { userId, templateName: "Gym Day", notes: notes || null },
        include: { exerciseSets: true },
      });
      return NextResponse.json(session);
    }

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: { exercises: { orderBy: { sortOrder: "asc" } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const session = await prisma.workoutSession.create({
      data: {
        templateId,
        templateName: template.name,
        userId,
        notes: notes || null,
        exerciseSets: {
          create: template.exercises.flatMap((ex) =>
            Array.from({ length: ex.sets }, (_, i) => ({
              exerciseName: ex.exerciseName,
              setNumber: i + 1,
            }))
          ),
        },
      },
      include: {
        template: { include: { exercises: { orderBy: { sortOrder: "asc" } } } },
        exerciseSets: true,
      },
    });

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
