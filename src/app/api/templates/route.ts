import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.workoutTemplate.findMany({
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const { name, exercises } = await req.json();

  const template = await prisma.workoutTemplate.create({
    data: {
      name,
      exercises: {
        create: exercises.map((ex: { exerciseName: string; sets: number; sortOrder: number; notes?: string; settings?: string }) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          sortOrder: ex.sortOrder,
          notes: ex.notes || null,
          settings: ex.settings || null,
        })),
      },
    },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(template);
}
