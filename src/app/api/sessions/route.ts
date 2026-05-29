import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.workoutSession.findMany({
    include: {
      template: { select: { name: true } },
      _count: { select: { exerciseSets: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { templateId, notes } = await req.json();

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
}
